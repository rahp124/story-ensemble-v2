import OpenAI from 'openai';

const localKeys = {
  openaiKey: '',
  stabilityKey: ''
};

export function getOpenAiKey() {
  if (import.meta.env['VITE_OPENAI_API_KEY']) {
    return import.meta.env['VITE_OPENAI_API_KEY'];
  }

  return localKeys.openaiKey;
}
export function setOpenAiKey(key: string) {
  localKeys.openaiKey = key;
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

  return localKeys.stabilityKey;
}

export function setStabilityAiKey(key: string) {
  localKeys.stabilityKey = key;
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
