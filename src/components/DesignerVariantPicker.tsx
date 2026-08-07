import { useState, type KeyboardEvent } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';
import type { DesignerStoryboard } from '@/data/designerStoryboards';
import { DESIGNER_FLOW_COPY } from '@/content/designerFlowCopy';
import { EnlargeableStoryboardImage } from './EnlargeableStoryboardImage';

interface DesignerVariantPickerProps {
  /** Called once the participant commits to a storyboard. */
  onPick: (args: { storyboardId: string }) => void;
}

function StoryboardCard({
  storyboard,
  selected,
  onSelect
}: {
  storyboard: DesignerStoryboard;
  selected: boolean;
  onSelect: () => void;
}) {
  const [errored, setErrored] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      aria-pressed={selected}
      className={`w-full text-left rounded-2xl p-1 transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
        selected
          ? 'border-2 border-blue-600 ring-2 ring-blue-600 bg-blue-50/40 shadow-sm'
          : 'border-2 border-transparent'
      }`}
    >
      {errored ? (
        <div className="w-full aspect-[16/9] bg-gray-100 border border-dashed border-gray-300 rounded-lg flex items-center justify-center text-xs text-gray-400">
          Missing image
        </div>
      ) : (
        <EnlargeableStoryboardImage
          src={storyboard.image}
          alt={storyboard.title}
          onError={() => setErrored(true)}
          imgClassName="w-full h-auto rounded-lg"
        />
      )}
    </div>
  );
}

export function DesignerVariantPicker({ onPick }: DesignerVariantPickerProps) {
  const storyboards = useStore(
    useShallow((s) => s.getEffectiveDesignerStoryboards())
  );
  const [selectedId, setSelectedId] = useState<string>(storyboards[0]?.id ?? '');

  const copy = DESIGNER_FLOW_COPY.picker;

  if (storyboards.length === 0) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-6 text-gray-500">
        No storyboards available.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center p-6">
      <div className="max-w-4xl w-full">
        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 text-center">
          {copy.eyebrow}
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-8 text-center">
          {copy.heading}
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col gap-2">
            {storyboards.map((storyboard) => (
              <StoryboardCard
                key={storyboard.id}
                storyboard={storyboard}
                selected={selectedId === storyboard.id}
                onSelect={() => setSelectedId(storyboard.id)}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onPick({ storyboardId: selectedId })}
          disabled={!selectedId}
          className="mt-6 inline-flex items-center justify-center w-full py-3 px-4 bg-blue-600 text-white text-base font-semibold rounded-xl hover:bg-blue-700 transition disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {copy.continueButton}
        </button>
      </div>
    </div>
  );
}
