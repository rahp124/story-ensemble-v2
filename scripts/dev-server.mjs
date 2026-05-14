import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import OpenAI, { toFile } from 'openai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

const PORT = 3000;

const server = createServer(async (req, res) => {
  if (req.url !== '/api/generate-edit' || req.method !== 'POST') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString('utf8');

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Invalid JSON body' }));
  }

  const startTime = Date.now();
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || payload.apiKey });
    const base64 = payload.image.includes(',') ? payload.image.split(',')[1] : payload.image;
    const bytes = Buffer.from(base64, 'base64');
    const imageFile = await toFile(bytes, 'reference.png', { type: 'image/png' });

    console.log(`[dev-server] images.edit start (prompt: ${payload.prompt?.slice(0, 60)}...)`);
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

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ b64_json: b64 }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[dev-server] images.edit failed (${Date.now() - startTime}ms):`, message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }
});

server.requestTimeout = 0;
server.headersTimeout = 0;
server.timeout = 0;

server.listen(PORT, () => {
  console.log(`[dev-server] listening on http://localhost:${PORT}`);
  console.log(`[dev-server] OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'set from .env.local' : 'will use client-forwarded key'}`);
});
