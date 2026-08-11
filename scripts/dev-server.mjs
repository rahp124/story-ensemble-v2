import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import OpenAI, { toFile } from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

// .env first, then .env.local can override when loaded second only if we flip order.
// Prefer: base .env, then .env.local overrides by loading local second with force.
loadEnvFile(resolve(__dirname, '..', '.env'));
const envLocalPath = resolve(__dirname, '..', '.env.local');
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

const PORT = 8080;
const COOKIE_NAME = 'se_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 20;

const failedLogins = new Map(); // ip -> { count, resetAt }

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...extraHeaders
  });
  res.end(JSON.stringify(body));
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function parseAllowlist() {
  const raw = process.env.ACCESS_ALLOWLIST || '';
  return new Set(
    raw
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || '';
}

function cookieSecure() {
  return (
    process.env.SESSION_COOKIE_SECURE === 'true' ||
    process.env.NODE_ENV === 'production'
  );
}

function cookiePath() {
  return process.env.SESSION_COOKIE_PATH || '/storyweaver';
}

function signPayload(accessId, exp) {
  const secret = getSessionSecret();
  return createHmac('sha256', secret)
    .update(`${accessId}|${exp}`)
    .digest('base64url');
}

function makeSessionCookieValue(accessId) {
  const exp = Date.now() + SESSION_TTL_MS;
  const sig = signPayload(accessId, exp);
  return `${encodeURIComponent(accessId)}.${exp}.${sig}`;
}

function verifySessionCookieValue(raw) {
  if (!raw || !getSessionSecret()) return null;
  const parts = raw.split('.');
  if (parts.length !== 3) return null;
  const [encodedId, expStr, sig] = parts;
  const accessId = decodeURIComponent(encodedId);
  const exp = Number(expStr);
  if (!accessId || !Number.isFinite(exp) || Date.now() > exp) return null;

  const expected = signPayload(accessId, exp);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return { accessId, exp };
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

function sessionCookieHeader(value, maxAgeSec) {
  const parts = [
    `${COOKIE_NAME}=${value}`,
    `Path=${cookiePath()}`,
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`
  ];
  if (cookieSecure()) parts.push('Secure');
  return parts.join('; ');
}

function clearSessionCookieHeader() {
  const parts = [
    `${COOKIE_NAME}=`,
    `Path=${cookiePath()}`,
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];
  if (cookieSecure()) parts.push('Secure');
  return parts.join('; ');
}

function isRateLimited(ip) {
  const entry = failedLogins.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    failedLogins.delete(ip);
    return false;
  }
  return entry.count >= LOGIN_MAX_FAILURES;
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const entry = failedLogins.get(ip);
  if (!entry || now > entry.resetAt) {
    failedLogins.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }
  entry.count += 1;
}

function clearFailedLogins(ip) {
  failedLogins.delete(ip);
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function readJsonBody(req) {
  const raw = await readRawBody(req);
  const body = raw.toString('utf8');
  if (!body) return {};
  return JSON.parse(body);
}

function getOpenAiKey() {
  return process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
}

function getFalKey() {
  return process.env.FAL_KEY || process.env.VITE_FAL_KEY || '';
}

function requireSession(req, res) {
  const cookies = parseCookies(req);
  const session = verifySessionCookieValue(cookies[COOKIE_NAME]);
  if (!session) {
    json(res, 401, { error: 'Not authenticated' });
    return null;
  }
  return session;
}

function isAllowedFalHost(hostname) {
  return (
    hostname === 'fal.ai' ||
    hostname === 'fal.run' ||
    hostname.endsWith('.fal.ai') ||
    hostname.endsWith('.fal.run')
  );
}

const SKIP_PROXY_RESPONSE_HEADERS = new Set([
  'content-length',
  'content-encoding',
  'transfer-encoding',
  'connection'
]);

function forwardProxyResponseHeaders(upstreamHeaders) {
  const out = {};
  upstreamHeaders.forEach((value, key) => {
    if (SKIP_PROXY_RESPONSE_HEADERS.has(key.toLowerCase())) return;
    out[key] = value;
  });
  return out;
}

async function handleLogin(req, res) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return json(res, 429, { error: 'Too many login attempts. Try again later.' });
  }

  if (!getSessionSecret()) {
    return json(res, 500, { error: 'Server SESSION_SECRET is not configured.' });
  }

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const accessId =
    typeof payload.accessId === 'string' ? payload.accessId.trim() : '';
  if (!accessId) {
    recordFailedLogin(ip);
    return json(res, 403, { error: 'Invalid access ID' });
  }

  const allowlist = parseAllowlist();
  if (!allowlist.has(accessId)) {
    recordFailedLogin(ip);
    return json(res, 403, { error: 'Invalid access ID' });
  }

  clearFailedLogins(ip);
  const cookieValue = makeSessionCookieValue(accessId);
  return json(
    res,
    200,
    { ok: true, accessId },
    {
      'Set-Cookie': sessionCookieHeader(
        cookieValue,
        Math.floor(SESSION_TTL_MS / 1000)
      )
    }
  );
}

function handleSession(req, res) {
  const cookies = parseCookies(req);
  const session = verifySessionCookieValue(cookies[COOKIE_NAME]);
  if (!session) {
    return json(res, 401, { error: 'Not authenticated' });
  }
  return json(res, 200, { ok: true, accessId: session.accessId });
}

function handleLogout(_req, res) {
  return json(
    res,
    200,
    { ok: true },
    { 'Set-Cookie': clearSessionCookieHeader() }
  );
}

async function handleGenerateEdit(req, res) {
  if (!requireSession(req, res)) return;

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const apiKey = getOpenAiKey();
  if (!apiKey) {
    return json(res, 500, { error: 'OPENAI_API_KEY is not configured.' });
  }

  const startTime = Date.now();
  try {
    const openai = new OpenAI({ apiKey });
    const base64 = payload.image.includes(',')
      ? payload.image.split(',')[1]
      : payload.image;
    const bytes = Buffer.from(base64, 'base64');
    const imageFile = await toFile(bytes, 'reference.png', { type: 'image/png' });

    console.log(
      `[dev-server] images.edit start (prompt: ${payload.prompt?.slice(0, 60)}...)`
    );
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: payload.prompt,
      n: 1,
      size: payload.size || '1024x1024'
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI returned no image data');
    console.log(`[dev-server] images.edit ok (${Date.now() - startTime}ms)`);

    return json(res, 200, { b64_json: b64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[dev-server] images.edit failed (${Date.now() - startTime}ms):`,
      message
    );
    return json(res, 500, { error: message });
  }
}

async function handleChatCompletions(req, res) {
  if (!requireSession(req, res)) return;

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const apiKey = getOpenAiKey();
  if (!apiKey) {
    return json(res, 500, { error: 'OPENAI_API_KEY is not configured.' });
  }

  const { model, messages, response_format } = payload;
  if (typeof model !== 'string' || !Array.isArray(messages)) {
    return json(res, 400, { error: 'model and messages are required' });
  }

  const startTime = Date.now();
  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model,
      messages,
      ...(response_format ? { response_format } : {})
    });
    const content = completion.choices[0]?.message?.content ?? null;
    console.log(`[dev-server] chat.completions ok (${Date.now() - startTime}ms)`);
    return json(res, 200, { content });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[dev-server] chat.completions failed (${Date.now() - startTime}ms):`,
      message
    );
    return json(res, 500, { error: message });
  }
}

async function handleGenerateImage(req, res) {
  if (!requireSession(req, res)) return;

  let payload;
  try {
    payload = await readJsonBody(req);
  } catch {
    return json(res, 400, { error: 'Invalid JSON body' });
  }

  const apiKey = getOpenAiKey();
  if (!apiKey) {
    return json(res, 500, { error: 'OPENAI_API_KEY is not configured.' });
  }

  const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
  if (!prompt) {
    return json(res, 400, { error: 'prompt is required' });
  }
  const size = payload.size === '512x512' ? '512x512' : '1024x1024';

  const startTime = Date.now();
  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt,
      n: 1,
      size
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI returned no image data');
    console.log(`[dev-server] images.generate ok (${Date.now() - startTime}ms)`);
    return json(res, 200, { b64_json: b64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      `[dev-server] images.generate failed (${Date.now() - startTime}ms):`,
      message
    );
    return json(res, 500, { error: message });
  }
}

async function handleFalProxy(req, res) {
  if (!requireSession(req, res)) return;

  const targetUrlRaw = req.headers['x-fal-target-url'];
  const targetUrl =
    typeof targetUrlRaw === 'string'
      ? targetUrlRaw
      : Array.isArray(targetUrlRaw)
        ? targetUrlRaw[0]
        : '';
  if (!targetUrl) {
    return json(res, 400, { error: 'Missing x-fal-target-url header' });
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return json(res, 400, { error: 'Invalid target URL' });
  }
  if (!isAllowedFalHost(parsed.hostname)) {
    return json(res, 412, { error: 'Target URL host is not allowed' });
  }

  const falKey = getFalKey();
  if (!falKey) {
    return json(res, 500, { error: 'FAL_KEY is not configured.' });
  }

  const method = req.method || 'GET';
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const forwardHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (
      lower === 'host' ||
      lower === 'connection' ||
      lower === 'content-length' ||
      lower === 'x-fal-target-url' ||
      lower === 'cookie' ||
      lower === 'authorization'
    ) {
      continue;
    }
    if (typeof value === 'string') forwardHeaders[key] = value;
    else if (Array.isArray(value)) forwardHeaders[key] = value.join(', ');
  }
  forwardHeaders.authorization = `Key ${falKey}`;

  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await readRawBody(req);

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body: body && body.length > 0 ? body : undefined
    });

    res.writeHead(upstream.status, forwardProxyResponseHeaders(upstream.headers));
    if (upstream.body) {
      for await (const chunk of upstream.body) {
        res.write(chunk);
      }
    }
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[dev-server] fal proxy failed:', message);
    if (!res.headersSent) {
      return json(res, 502, { error: message });
    }
    res.end();
  }
}

const server = createServer(async (req, res) => {
  const url = req.url?.split('?')[0] || '';

  try {
    if (url === '/api/login' && req.method === 'POST') {
      return await handleLogin(req, res);
    }
    if (url === '/api/session' && req.method === 'GET') {
      return handleSession(req, res);
    }
    if (url === '/api/logout' && req.method === 'POST') {
      return handleLogout(req, res);
    }
    if (url === '/api/generate-edit' && req.method === 'POST') {
      return await handleGenerateEdit(req, res);
    }
    if (url === '/api/chat-completions' && req.method === 'POST') {
      return await handleChatCompletions(req, res);
    }
    if (url === '/api/generate-image' && req.method === 'POST') {
      return await handleGenerateImage(req, res);
    }
    if (url === '/api/fal/proxy') {
      return await handleFalProxy(req, res);
    }

    return json(res, 404, { error: 'Not found' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[dev-server] unhandled:', message);
    return json(res, 500, { error: message });
  }
});

server.requestTimeout = 0;
server.headersTimeout = 0;
server.timeout = 0;

server.listen(PORT, () => {
  console.log(`[dev-server] listening on http://localhost:${PORT}`);
  console.log(
    `[dev-server] OPENAI_API_KEY: ${getOpenAiKey() ? 'set' : 'MISSING'}`
  );
  console.log(`[dev-server] FAL_KEY: ${getFalKey() ? 'set' : 'MISSING'}`);
  console.log(
    `[dev-server] ACCESS_ALLOWLIST: ${
      parseAllowlist().size
    } id(s); SESSION_SECRET: ${getSessionSecret() ? 'set' : 'MISSING'}`
  );
});
