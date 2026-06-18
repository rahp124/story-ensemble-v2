import { useMemo, useState } from 'react';
import { type DesignerFrame } from '@/data/designerStoryboards';
import type { FrameOutline } from '@/types';
import { useStore } from '../store';

interface DesignerVariantPickerProps {
  /** When true, the participant is imagining the situation rather than recalling it. */
  rewordAsImagined?: boolean;
  /** Called once the participant commits to a full storyboard variant. */
  onPick: (args: { variantId: string }) => void;
  /** Optional escape hatch — build a storyboard from scratch instead of picking one. */
  onStartFromScratch?: () => void;
}

const FRAME_LABEL: Record<FrameOutline['frameType'], string> = {
  Context: 'Context',
  Problem: 'Problem',
  Action: 'Action',
  Resolution: 'Resolution'
};

function MissingImageTile({ label }: { label: string }) {
  return (
    <div className="w-full aspect-square bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 px-2 text-center">
      {label}
    </div>
  );
}

function FrameThumb({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) return <MissingImageTile label={`Missing ${src}`} />;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
    />
  );
}

export function DesignerVariantPicker({
  rewordAsImagined,
  onPick,
  onStartFromScratch
}: DesignerVariantPickerProps) {
  const adminStoryboardOverrides = useStore((s) => s.adminStoryboardOverrides);
  const getEffectiveDesignerStoryboards = useStore(
    (s) => s.getEffectiveDesignerStoryboards
  );
  const storyboards = useMemo(
    () => getEffectiveDesignerStoryboards(),
    // Recompute whenever the admin overrides change.
    [getEffectiveDesignerStoryboards, adminStoryboardOverrides]
  );

  const [selectedId, setSelectedId] = useState<string>(
    storyboards[0]?.id ?? ''
  );
  const selected =
    storyboards.find((v) => v.id === selectedId) ?? storyboards[0];

  const prompt = rewordAsImagined
    ? 'Which storyboard would feel most realistic for this situation?'
    : 'Which storyboard most closely reflects your experience?';

  const handleStartFromScratch = () => {
    if (onStartFromScratch) {
      onStartFromScratch();
    } else {
      // TODO: wire to a real "from scratch" flow once one exists.
      console.log('[DesignerVariantPicker] start from scratch — not yet wired');
    }
  };

  if (!selected) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        No storyboards available.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center p-6">
      <div className="max-w-6xl w-full">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 text-center">
          Choose a storyboard
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-8 text-center">
          {prompt}
        </h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* LEFT: vertical storyboard toggle */}
          <div className="flex md:flex-col gap-2 md:w-52 flex-shrink-0">
            {storyboards.map((variant) => {
              const isActive = variant.id === selected.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedId(variant.id)}
                  className={`flex-1 md:flex-none text-left px-4 py-3 rounded-xl border font-semibold transition ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {variant.title}
                </button>
              );
            })}
          </div>

          {/* MAIN: all 4 panels of the selected storyboard */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 overflow-x-auto">
              <div className="flex gap-4 min-w-max">
                {selected.frames.map((frame: DesignerFrame) => (
                  <div
                    key={frame.frameType}
                    className="w-56 flex-shrink-0 flex flex-col"
                  >
                    <FrameThumb
                      src={frame.image}
                      alt={`${selected.title} — ${FRAME_LABEL[frame.frameType]}`}
                    />
                    <span className="mt-3 inline-block self-start text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {FRAME_LABEL[frame.frameType]}
                    </span>
                    {frame.caption && (
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                        {frame.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onPick({ variantId: selected.id })}
              className="mt-6 inline-flex items-center justify-center w-full py-3 px-4 bg-blue-600 text-white text-base font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              {selected.title} most closely reflects my experience
            </button>
          </div>
        </div>

        {/* FALLBACK: start from scratch */}
        <div className="mt-10 bg-white rounded-xl border border-gray-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-gray-600">
            Not relating to any of these storyboards? Try creating one from
            scratch.
          </p>
          <button
            type="button"
            onClick={handleStartFromScratch}
            disabled={!onStartFromScratch}
            className="flex-shrink-0 px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start from scratch
          </button>
        </div>
      </div>
    </div>
  );
}
