export type AccessSession = {
  accessId: string;
};

export class AccessSessionError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AccessSessionError';
    this.status = status;
  }
}

async function parseJson(res: Response): Promise<Record<string, unknown>> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function fetchSession(): Promise<AccessSession | null> {
  const res = await fetch('/api/session', {
    method: 'GET',
    credentials: 'include'
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    const body = await parseJson(res);
    throw new AccessSessionError(
      typeof body.error === 'string' ? body.error : 'Session check failed',
      res.status
    );
  }
  const body = await parseJson(res);
  if (typeof body.accessId !== 'string') return null;
  return { accessId: body.accessId };
}

export async function login(accessId: string): Promise<AccessSession> {
  const res = await fetch('/api/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessId })
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new AccessSessionError(
      typeof body.error === 'string' ? body.error : 'Login failed',
      res.status
    );
  }
  if (typeof body.accessId !== 'string') {
    throw new AccessSessionError('Login response missing accessId', res.status);
  }
  return { accessId: body.accessId };
}

export async function logout(): Promise<void> {
  await fetch('/api/logout', {
    method: 'POST',
    credentials: 'include'
  });
}
