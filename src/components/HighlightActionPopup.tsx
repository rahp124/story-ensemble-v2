import { useEffect, useRef } from 'react';

type HighlightActionPopupProps = {
  rect: DOMRect;
  onCopy: () => void;
  onRemove: () => void;
  onDismiss: () => void;
};

export function HighlightActionPopup({
  rect,
  onCopy,
  onRemove,
  onDismiss
}: HighlightActionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onDismiss();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onDismiss]);

  const top = Math.max(8, rect.top - 48);
  const left = Math.min(
    Math.max(8, rect.left + rect.width / 2),
    window.innerWidth - 8
  );

  return (
    <div
      ref={popupRef}
      className="fixed z-[60] -translate-x-1/2 flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1 py-1 shadow-lg"
      style={{ top, left }}
      role="toolbar"
      aria-label="Highlight actions"
    >
      <button
        type="button"
        onClick={() => {
          onCopy();
          onDismiss();
        }}
        className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
      >
        Copy to notes
      </button>
      <button
        type="button"
        onClick={() => {
          onRemove();
          onDismiss();
        }}
        className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
      >
        Remove
      </button>
    </div>
  );
}
