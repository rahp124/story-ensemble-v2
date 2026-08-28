import { useRef, type MouseEvent } from 'react';
import {
  findEnclosingRange,
  textOffsetIn,
  toSegments,
  type HighlightRange,
  type HighlightSegment
} from '@/lib/evaluateHighlights';

type HighlightableTextProps = {
  text: string;
  ranges: HighlightRange[];
  readOnly?: boolean;
  onAdd?: (range: HighlightRange, selectedText: string, rect: DOMRect) => void;
  onActivate?: (range: HighlightRange, selectedText: string, rect: DOMRect) => void;
  className?: string;
};

export function HighlightableText({
  text,
  ranges,
  readOnly = false,
  onAdd,
  onActivate,
  className = 'text-xs text-slate-600 leading-relaxed whitespace-pre-wrap'
}: HighlightableTextProps) {
  const containerRef = useRef<HTMLParagraphElement>(null);

  const showHighlightMenu = (
    range: HighlightRange,
    selectedText: string,
    rect: DOMRect
  ) => {
    onActivate?.(range, selectedText, rect);
    window.getSelection()?.removeAllRanges();
  };

  const handleMouseUp = () => {
    if (readOnly || !containerRef.current) return;
    if (!onAdd && !onActivate) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      return;
    }

    const domRange = selection.getRangeAt(0);
    const { startContainer, startOffset, endContainer, endOffset } = domRange;

    if (
      !containerRef.current.contains(startContainer) ||
      !containerRef.current.contains(endContainer)
    ) {
      return;
    }

    const start = textOffsetIn(containerRef.current, startContainer, startOffset);
    const end = textOffsetIn(containerRef.current, endContainer, endOffset);
    if (start === null || end === null) return;

    const rangeStart = Math.min(start, end);
    const rangeEnd = Math.max(start, end);
    if (rangeEnd <= rangeStart) return;

    const selectedText = text.slice(rangeStart, rangeEnd);
    if (!selectedText.trim()) return;

    const rects = domRange.getClientRects();
    const rect =
      rects.length > 0 ? rects[rects.length - 1] : domRange.getBoundingClientRect();

    const enclosing = findEnclosingRange(ranges, rangeStart, rangeEnd);
    if (enclosing && onActivate) {
      showHighlightMenu(
        { start: rangeStart, end: rangeEnd },
        selectedText,
        rect
      );
      return;
    }

    if (!onAdd) return;

    onAdd({ start: rangeStart, end: rangeEnd }, selectedText, rect);
    selection.removeAllRanges();
  };

  const handleMarkClick = (event: MouseEvent, segment: HighlightSegment) => {
    if (readOnly || !onActivate) return;
    event.preventDefault();
    event.stopPropagation();

    const range = {
      start: segment.start,
      end: segment.start + segment.text.length
    };
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    showHighlightMenu(range, segment.text, rect);
  };

  if (!text) {
    return <p className={className}>—</p>;
  }

  const segments = toSegments(text, ranges);

  return (
    <p
      ref={containerRef}
      className={className}
      onMouseUp={readOnly ? undefined : handleMouseUp}
    >
      {segments.map((segment, index) =>
        segment.highlighted ? (
          <mark
            key={`h-${segment.start}-${index}`}
            className={`bg-yellow-200 rounded-sm ${
              readOnly ? '' : 'cursor-pointer'
            }`}
            title={readOnly ? undefined : 'Click for highlight options'}
            onClick={
              readOnly
                ? undefined
                : (event) => handleMarkClick(event, segment)
            }
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`t-${segment.start}-${index}`}>{segment.text}</span>
        )
      )}
    </p>
  );
}
