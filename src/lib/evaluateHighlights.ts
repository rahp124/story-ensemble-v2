import type { EvaluateSource } from '@/lib/evaluateData';

export type HighlightRange = { start: number; end: number };

export type HighlightSegment = {
  text: string;
  start: number;
  highlighted: boolean;
};

export type HighlightTextEntry = {
  start: number;
  end: number;
  text: string;
};

export type ItemHighlights = Record<string, HighlightRange[]>;
export type PairHighlights = Partial<Record<EvaluateSource, ItemHighlights>>;
export type HighlightsByPair = Record<string, PairHighlights>;

function normalizeRange(range: HighlightRange, textLength: number): HighlightRange | null {
  const start = Math.max(0, Math.min(range.start, textLength));
  const end = Math.max(0, Math.min(range.end, textLength));
  if (end <= start) return null;
  return { start, end };
}

export function addRange(
  ranges: HighlightRange[],
  next: HighlightRange,
  textLength: number
): HighlightRange[] {
  const normalized = normalizeRange(next, textLength);
  if (!normalized) return ranges;

  const merged = [...ranges, normalized].sort((a, b) => a.start - b.start);
  const result: HighlightRange[] = [];

  for (const range of merged) {
    const last = result[result.length - 1];
    if (!last || range.start > last.end) {
      result.push({ ...range });
      continue;
    }
    last.end = Math.max(last.end, range.end);
  }

  return result;
}

export function removeRangeContaining(
  ranges: HighlightRange[],
  offset: number
): HighlightRange[] {
  return ranges.filter((range) => offset < range.start || offset >= range.end);
}

/** Returns the stored range that fully contains [start, end), if any. */
export function findEnclosingRange(
  ranges: HighlightRange[],
  start: number,
  end: number
): HighlightRange | null {
  return (
    ranges.find((range) => range.start <= start && range.end >= end) ?? null
  );
}

export function toSegments(text: string, ranges: HighlightRange[]): HighlightSegment[] {
  if (!text) return [];

  const sorted = [...ranges]
    .map((range) => normalizeRange(range, text.length))
    .filter((range): range is HighlightRange => range !== null)
    .sort((a, b) => a.start - b.start);

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const range of sorted) {
    if (range.start > cursor) {
      segments.push({
        text: text.slice(cursor, range.start),
        start: cursor,
        highlighted: false
      });
    }
    if (range.end > range.start) {
      segments.push({
        text: text.slice(range.start, range.end),
        start: range.start,
        highlighted: true
      });
    }
    cursor = Math.max(cursor, range.end);
  }

  if (cursor < text.length) {
    segments.push({
      text: text.slice(cursor),
      start: cursor,
      highlighted: false
    });
  }

  return segments;
}

export function highlightTexts(
  text: string,
  ranges: HighlightRange[]
): HighlightTextEntry[] {
  return ranges
    .map((range) => normalizeRange(range, text.length))
    .filter((range): range is HighlightRange => range !== null)
    .map((range) => ({
      start: range.start,
      end: range.end,
      text: text.slice(range.start, range.end)
    }));
}

export function textOffsetIn(
  container: Node,
  node: Node,
  nodeOffset: number
): number | null {
  if (!container.contains(node)) return null;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let current = walker.nextNode();

  while (current) {
    if (current === node) {
      return offset + nodeOffset;
    }
    offset += current.textContent?.length ?? 0;
    current = walker.nextNode();
  }

  return null;
}

export function formatHighlightSnippet(
  conditionLabel: string,
  text: string
): string {
  const normalized = text.trim().replace(/\s+/g, ' ');
  return `[${conditionLabel}] "${normalized}"`;
}

export function appendToNotes(existing: string, snippet: string): string {
  if (!existing.trim()) return snippet;
  return `${existing.trimEnd()}\n${snippet}`;
}

export function getFieldHighlights(
  pairHighlights: PairHighlights | undefined,
  source: EvaluateSource,
  fieldKey: string
): HighlightRange[] {
  return pairHighlights?.[source]?.[fieldKey] ?? [];
}
