import { useState } from 'react';
import { AestheticUpdateComparisonModal } from './AestheticUpdateComparisonModal';
import type { WizardPhaseTheme } from '@/lib/wizardPhaseTheme';
import { panelCardBorderStyle, panelCardStyle } from '@/lib/wizardPhaseTheme';

export type SceneAesthetics = {
  character?: string;
  action?: string;
  environment?: string;
  custom?: string;
};

export type AestheticPreviewResult = { image: string; caption: string };

export type AestheticComparisonChoice = 'original' | 'updated';

interface AestheticsPhaseProps {
  sceneIndex: number;
  aesthetics: SceneAesthetics;
  onChange: (field: keyof SceneAesthetics, value: string) => void;
  onPreview: (aesthetics: SceneAesthetics) => Promise<AestheticPreviewResult | void>;
  onPreviewChoice?: (
    choice: AestheticComparisonChoice,
    aesthetics: SceneAesthetics,
    preview: AestheticPreviewResult
  ) => void;
  onContinue: (aesthetics: SceneAesthetics) => void;
  isGenerating: boolean;
  isLastScene: boolean;
  phaseTheme?: WizardPhaseTheme;
  continueLabel?: string;
  currentImage?: string;
  currentCaption?: string;
  title?: string;
  subtitle?: string;
}

export function AestheticsPhase({
  sceneIndex,
  aesthetics,
  onChange,
  onPreview,
  onPreviewChoice,
  onContinue,
  isGenerating,
  isLastScene,
  phaseTheme = 'aesthetics',
  continueLabel,
  currentImage,
  currentCaption,
  title,
  subtitle
}: AestheticsPhaseProps) {
  const [comparison, setComparison] = useState<{
    original: AestheticPreviewResult;
    preview: AestheticPreviewResult;
  } | null>(null);

  const handleUpdateClick = async () => {
    const original: AestheticPreviewResult = {
      image: currentImage ?? '',
      caption: currentCaption ?? '',
    };
    try {
      const preview = await onPreview(aesthetics);
      if (preview?.image) {
        setComparison({ original, preview });
      }
    } catch (err) {
      console.error('[aesthetic preview]', err);
    }
  };

  const resolveChoice = (choice: AestheticComparisonChoice) => {
    if (!comparison) return;
    onPreviewChoice?.(choice, aesthetics, comparison.preview);
    if (choice === 'updated') {
      onChange('character', '');
      onChange('action', '');
      onChange('environment', '');
    }
    setComparison(null);
  };

  return (
    <>
      <div
        className="rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col"
        style={{ ...panelCardStyle(phaseTheme), ...panelCardBorderStyle(phaseTheme) }}
      >
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            {title ?? `Scene ${sceneIndex + 1} - Visual Aesthetics`}
          </h2>
          <p className="text-sm text-gray-700 mt-1">
            {subtitle ??
              "Here's how we visualized your response! If visual adjustments are needed, use Update Image to make any changes before continuing."}
          </p>
        </div>

        <div className="flex-grow space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Character adjustment (optional)</label>
            <p className="text-xs text-gray-700 mb-2">Describe how the character's appearance or facial expression should look differently.</p>
            <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none" placeholder="Optional" value={aesthetics.character ?? ''} onChange={(e)=>onChange('character', e.target.value)} disabled={isGenerating || !!comparison} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Action adjustment (optional)</label>
            <p className="text-xs text-gray-700 mb-2">Describe how the character's pose, gesture, or activity should be different.</p>
            <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none" placeholder="Optional" value={aesthetics.action ?? ''} onChange={(e)=>onChange('action', e.target.value)} disabled={isGenerating || !!comparison} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">Environment adjustment (optional)</label>
            <p className="text-xs text-gray-700 mb-2">Adjust background, lighting, or setting details.</p>
            <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none" placeholder="Optional" value={aesthetics.environment ?? ''} onChange={(e)=>onChange('environment', e.target.value)} disabled={isGenerating || !!comparison} />
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-gray-100 flex flex-row gap-3">
          <button
            type="button"
            onClick={handleUpdateClick}
            disabled={isGenerating || !!comparison}
            className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update Image
          </button>
          <button
            type="button"
            onClick={() => onContinue(aesthetics)}
            disabled={isGenerating || !!comparison}
            className="flex-1 py-3 md:py-4 px-6 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-300 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {continueLabel ?? (isLastScene ? 'Finish & Reveal Full Story' : 'Looks good to me!')}
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
