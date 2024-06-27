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

export function getStabilityAiKey() {
  if (import.meta.env['VITE_STABILITY_API_KEY']) {
    return import.meta.env['VITE_STABILITY_API_KEY'];
  }

  return localKeys.stabilityKey;
}

export function setStabilityAiKey(key: string) {
  localKeys.stabilityKey = key;
}
