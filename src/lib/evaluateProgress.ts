export type EvaluatePhase = 'intro' | 'items' | 'summary';

export type EvaluateProgressDraft = {
  phase: EvaluatePhase;
  itemIndex: number;
  /** Furthest item index reached via Continue; progress bar stays at this level when going back. */
  maxItemIndex: number;
  itemOrder: string[];
  itemAnswers: Record<string, Record<string, string>>;
  summaryAnswers: Record<string, string>;
};

const STORAGE_PREFIX = 'evaluate:';

function storageKey(accessId: string): string {
  return `${STORAGE_PREFIX}${accessId}`;
}

export function loadEvaluateProgress(
  accessId: string
): EvaluateProgressDraft | null {
  try {
    const raw = localStorage.getItem(storageKey(accessId));
    if (!raw) return null;
    return JSON.parse(raw) as EvaluateProgressDraft;
  } catch {
    return null;
  }
}

export function saveEvaluateProgress(
  accessId: string,
  draft: EvaluateProgressDraft
): void {
  try {
    localStorage.setItem(storageKey(accessId), JSON.stringify(draft));
  } catch (err) {
    console.warn('[evaluate progress] failed to save', err);
  }
}

export function clearEvaluateProgress(accessId: string): void {
  try {
    localStorage.removeItem(storageKey(accessId));
  } catch {
    // ignore
  }
}
