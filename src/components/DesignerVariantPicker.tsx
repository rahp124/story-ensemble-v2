import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import type { DesignerVariant } from '@/data/designerStoryboards';
import type { FrameOutline } from '@/types';

const NEW_IDEA_ID = 'new-idea';

type PickMode = 'storyboard' | 'panel';

interface DesignerVariantPickerProps {
  /** When true, the participant is imagining the situation rather than recalling it. */
  rewordAsImagined?: boolean;
  /** Which frame type to display on each card. */
  frameType?: FrameOutline['frameType'];
  /** storyboard = initial Context pick (all variants); panel = single seeded variant. */
  pickMode?: PickMode;
  /** Variant chosen at Context — used in panel mode only. */
  seededVariantId?: string;
  /** Called once the participant commits to a full storyboard variant. */
  onPick: (args: { variantId: string }) => void;
  /** Optional escape hatch — build a storyboard from scratch instead of picking one. */
  onStartFromScratch?: () => void;
}

function cardClass(selected: boolean) {
  return `w-full text-left rounded-2xl border-2 p-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
    selected
      ? 'border-blue-600 ring-2 ring-blue-600 bg-blue-50/40 shadow-sm'
      : 'border-gray-200 bg-white hover:border-blue-300'
  }`;
}

function FrameThumb({ src, alt }: { src?: string; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className="w-full aspect-square bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400 px-2 text-center">
        {src ? 'Missing image' : 'No image'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
    />
  );
}

function SelectableFrameCard({
  variant,
  frameType,
  selected,
  onSelect
}: {
  variant: DesignerVariant;
  frameType: FrameOutline['frameType'];
  selected: boolean;
  onSelect: () => void;
}) {
  const frame = variant.frames.find((f) => f.frameType === frameType);
  const frameLabel = frameType === 'Action' ? 'Action / Solution' : frameType;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cardClass(selected)}
      aria-pressed={selected}
    >
      <FrameThumb
        src={frame?.image}
        alt={`${variant.title} — ${frameType}`}
      />
      <span className="mt-3 inline-block text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
        {frameLabel}
      </span>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{variant.title}</h3>
      {frame?.caption && (
        <p className="mt-1 text-sm text-gray-800 leading-relaxed">
          {frame.caption}
        </p>
      )}
    </button>
  );
}

function NewIdeaCard({
  selected,
  onSelect,
  pickMode
}: {
  selected: boolean;
  onSelect: () => void;
  pickMode: PickMode;
}) {
  const isPanel = pickMode === 'panel';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cardClass(selected)}
      aria-pressed={selected}
    >
      <div className="w-full aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 px-3 text-center">
        <span className="text-3xl text-gray-300" aria-hidden>
          +
        </span>
        <span className="text-xs font-medium text-gray-500">Blank frame</span>
      </div>
      <span className="mt-3 inline-block text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
        New
      </span>
      <h3 className="mt-2 text-sm font-semibold text-gray-900">
        {isPanel ? 'Generate a new panel' : 'Generate a new idea'}
      </h3>
      <p className="mt-1 text-sm text-gray-600 leading-relaxed">
        {isPanel
          ? 'Start with a blank panel for this scene.'
          : 'Start with a blank storyboard and build your own narrative.'}
      </p>
    </button>
  );
}

export function DesignerVariantPicker({
  rewordAsImagined,
  frameType = 'Context',
  pickMode = 'storyboard',
  seededVariantId,
  onPick,
  onStartFromScratch
}: DesignerVariantPickerProps) {
  const adminStoryboardOverrides = useStore((s) => s.adminStoryboardOverrides);
  const getEffectiveDesignerStoryboards = useStore(
    (s) => s.getEffectiveDesignerStoryboards
  );
  const storyboards = useMemo(
    () => getEffectiveDesignerStoryboards(),
    [getEffectiveDesignerStoryboards, adminStoryboardOverrides]
  );

  const isPanelMode = pickMode === 'panel';
  const seededVariant = seededVariantId
    ? storyboards.find((v) => v.id === seededVariantId)
    : undefined;

  const defaultSelectedId = isPanelMode
    ? (seededVariantId ?? NEW_IDEA_ID)
    : (storyboards[0]?.id ?? NEW_IDEA_ID);

  const [selectedId, setSelectedId] = useState<string>(defaultSelectedId);

  useEffect(() => {
    setSelectedId(defaultSelectedId);
  }, [defaultSelectedId, frameType, pickMode, seededVariantId]);

  const selectedVariant = storyboards.find((v) => v.id === selectedId);
  const isNewIdea = selectedId === NEW_IDEA_ID;

  const frameLabel = frameType === 'Action' ? 'Action / Solution' : frameType;

  const eyebrow = isPanelMode ? 'Choose a panel' : 'Choose a storyboard';

  const prompt = isPanelMode
    ? `Review the next panel for your story`
  : rewordAsImagined
    ? 'Which storyboard would feel most realistic for you?'
    : 'Which storyboard most closely reflects your experience?';

  const continueLabel = isNewIdea
    ? isPanelMode
      ? 'Generate a new panel'
      : 'Generate a new idea'
    : isPanelMode
      ? `Continue with this ${frameLabel} panel`
      : `${selectedVariant?.title ?? 'This storyboard'} most closely reflects my experience`;

  const continueDisabled = isNewIdea
    ? !onStartFromScratch
    : isPanelMode
      ? !seededVariant
      : !selectedVariant;

  const handleContinue = () => {
    if (isNewIdea) {
      if (onStartFromScratch) {
        onStartFromScratch();
      } else {
        console.log('[DesignerVariantPicker] start from scratch — not yet wired');
      }
      return;
    }
    if (isPanelMode && seededVariant) {
      onPick({ variantId: seededVariant.id });
      return;
    }
    if (selectedVariant) {
      onPick({ variantId: selectedVariant.id });
    }
  };

  if (storyboards.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        No storyboards available.
      </div>
    );
  }

  if (isPanelMode && !seededVariant) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        No seeded storyboard found. Please restart from the beginning.
      </div>
    );
  }

  const gridClass = isPanelMode
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center p-6">
      <div className="max-w-6xl w-full">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 text-center">
          {eyebrow}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-8 text-center">
          {prompt}
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className={gridClass}>
            {isPanelMode && seededVariant ? (
              <SelectableFrameCard
                variant={seededVariant}
                frameType={frameType}
                selected={selectedId === seededVariant.id}
                onSelect={() => setSelectedId(seededVariant.id)}
              />
            ) : (
              storyboards.map((variant) => (
                <SelectableFrameCard
                  key={variant.id}
                  variant={variant}
                  frameType={frameType}
                  selected={selectedId === variant.id}
                  onSelect={() => setSelectedId(variant.id)}
                />
              ))
            )}
            <NewIdeaCard
              selected={isNewIdea}
              onSelect={() => setSelectedId(NEW_IDEA_ID)}
              pickMode={pickMode}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={continueDisabled}
          className="mt-6 inline-flex items-center justify-center w-full py-3 px-4 bg-blue-600 text-white text-base font-semibold rounded-xl hover:bg-blue-700 transition disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
