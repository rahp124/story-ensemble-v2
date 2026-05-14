import OpenAI from 'openai';

export function getOpenAiKey() {
  if (import.meta.env['VITE_OPENAI_API_KEY']) {
    return import.meta.env['VITE_OPENAI_API_KEY'];
  }

  return sessionStorage.getItem('openaiKey') ?? '';
}
export function setOpenAiKey(key: string) {
  sessionStorage.setItem('openaiKey', key);
}

export async function validateOpenAiKey(key: string) {
  try {
    const openai = new OpenAI({
      apiKey: key,
      dangerouslyAllowBrowser: true
    });
    await openai.models.list();

    return { error: false };
  } catch {
    return { error: true };
  }
}

export function getStabilityAiKey() {
  if (import.meta.env['VITE_STABILITY_API_KEY']) {
    return import.meta.env['VITE_STABILITY_API_KEY'];
  }

  return sessionStorage.getItem('stabilityKey') ?? '';
}

export function setStabilityAiKey(key: string) {
  sessionStorage.setItem('stabilityKey', key);
}

export async function validateStabilityAiKey(key: string) {
  try {
    const response = await fetch(`https://api.stability.ai/v1/user/balance`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`
      }
    });

    if (!response.ok) {
      return { error: 'INVALID_API_KEY' } as const;
    }

    const { credits } = (await response.json()) as { credits: number };
    if (credits < 300) {
      return { error: 'INSUFFICIENT_CREDITS', credits } as const;
    }

    return { error: false } as const;
  } catch {
    return { error: 'INVALID_API_KEY' } as const;
  }
}

export function getFalKey() {
  if (import.meta.env['VITE_FAL_KEY']) {
    return import.meta.env['VITE_FAL_KEY'];
  }

  return sessionStorage.getItem('falKey') ?? '';
}

export function setFalKey(key: string) {
  sessionStorage.setItem('falKey', key);
}

export type ImageProvider = 'fal' | 'openai' | 'stability' | 'auto';

export function getImageProvider(): ImageProvider {
  const explicit = import.meta.env['VITE_IMAGE_PROVIDER'] as string | undefined;
  if (explicit === 'fal' || explicit === 'openai' || explicit === 'stability') {
    return explicit;
  }
  return 'auto';
}

export function resolveImageProvider(): 'fal' | 'openai' | 'stability' {
  const explicit = getImageProvider();
  if (explicit !== 'auto') return explicit;
  if (getFalKey()) return 'fal';
  if (getStabilityAiKey()) return 'stability';
  return 'openai';
}
