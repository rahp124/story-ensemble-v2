import { useState } from 'react';
import type { CharacterProfileAdjustments } from '@/store';
import type { CharacterCreationCopy } from '@/content/onboardingCopy';
import {
  AestheticUpdateComparisonModal,
  type ImageComparisonChoice
} from './AestheticUpdateComparisonModal';

export type CharacterPreviewResult = { image: string };

interface CharacterRefinementPhaseProps {
  copy: CharacterCreationCopy['refine'];
  adjustments: CharacterProfileAdjustments;
  currentImage?: string;
  onChange: (field: keyof CharacterProfileAdjustments, value: string) => void;
  onPreview: (adjustments: CharacterProfileAdjustments) => Promise<CharacterPreviewResult | void>;
  onPreviewChoice?: (
    choice: ImageComparisonChoice,
    adjustments: CharacterProfileAdjustments,
    preview: CharacterPreviewResult
  ) => void;
  onContinue: (adjustments: CharacterProfileAdjustments) => void;
  isGenerating: boolean;
}

export function CharacterRefinementPhase({
  copy,
  adjustments,
  currentImage,
  onChange,
  onPreview,
  onPreviewChoice,
  onContinue,
  isGenerating
}: CharacterRefinementPhaseProps) {
  const [comparison, setComparison] = useState<{
    original: CharacterPreviewResult;
    preview: CharacterPreviewResult;
  } | null>(null);

  const handleUpdateClick = async () => {
    const original: CharacterPreviewResult = { image: currentImage ?? '' };
    try {
      const preview = await onPreview(adjustments);
      if (preview?.image) {
        setComparison({ original, preview });
      }
    } catch (err) {
      console.error('[character profile preview]', err);
    }
  };

  const resolveChoice = (choice: ImageComparisonChoice) => {
    if (!comparison) return;
    onPreviewChoice?.(choice, adjustments, comparison.preview);
    if (choice === 'updated') {
      onChange('face', '');
      onChange('hairAccessories', '');
      onChange('clothing', '');
    }
    setComparison(null);
  };

  const disabled = isGenerating || !!comparison;

  return (
    <>
      <div className="rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col bg-white">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {copy.title}
          </h2>
          <p className="text-sm text-gray-700 mt-1">{copy.subtitle}</p>
        </div>

        <div className="flex-grow space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              {copy.face.label}
            </label>
            <p className="text-xs text-gray-700 mb-2">{copy.face.helper}</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
              placeholder={copy.face.placeholder}
              value={adjustments.face ?? ''}
              onChange={(e) => onChange('face', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              {copy.hairAccessories.label}
            </label>
            <p className="text-xs text-gray-700 mb-2">{copy.hairAccessories.helper}</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
              placeholder={copy.hairAccessories.placeholder}
              value={adjustments.hairAccessories ?? ''}
              onChange={(e) => onChange('hairAccessories', e.target.value)}
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              {copy.clothing.label}
            </label>
            <p className="text-xs text-gray-700 mb-2">{copy.clothing.helper}</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none"
              placeholder={copy.clothing.placeholder}
              value={adjustments.clothing ?? ''}
              onChange={(e) => onChange('clothing', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        {/* {isGenerating && (
          <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader size="sm" color="blue" />
            <p className="text-sm font-medium text-blue-700">{copy.generating}</p>
          </div>
        )} */}

        <div className="pt-6 mt-6 border-t border-gray-100 flex flex-row gap-3">
          <button
            type="button"
            onClick={handleUpdateClick}
            disabled={disabled}
            className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copy.updateButton}
          </button>
          <button
            type="button"
            onClick={() => onContinue(adjustments)}
            disabled={disabled}
            className="flex-1 py-3 md:py-4 px-6 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-300 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copy.continueButton}
          </button>
        </div>
      </div>

      {comparison && (
        <AestheticUpdateComparisonModal
          opened
          original={comparison.original}
          preview={comparison.preview}
          onSelect={resolveChoice}
          onClose={() => setComparison(null)}
        />
      )}
    </>
  );
}
