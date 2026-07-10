import { useState } from 'react';
import { Loader } from '@mantine/core';
import SketchRefinementForm from './SketchRefinementForm';
import { AestheticUpdateComparisonModal } from './AestheticUpdateComparisonModal';
import type { WizardPhaseTheme } from '@/lib/wizardPhaseTheme';
import { panelCardBorderStyle, panelCardStyle } from '@/lib/wizardPhaseTheme';

export type SceneAesthetics = {
  character?: string;
  action?: string;
  environment?: string;
  custom?: string;
};

export type SceneSketchRefinement = {
  actors?: string;
  setting?: string;
  userGoal?: string;
  obstacle?: string;
  frameChange?: string;
  carryForward?: string;
  emotionState?: string;
};

export type AestheticPreviewResult = { image: string; caption: string };

export type AestheticComparisonChoice = 'original' | 'updated';

interface AestheticsPhaseProps {
  sceneIndex: number;
  aesthetics: SceneAesthetics;
  content?: Record<string, string | undefined>;
  onContentChange?: (field: string, value: string) => void;
  sketchRefinement?: SceneSketchRefinement;
  onChange?: (field: keyof SceneAesthetics | keyof SceneSketchRefinement, value: string) => void;
  onPreview?: (aesthetics: SceneAesthetics | SceneSketchRefinement) => void | Promise<AestheticPreviewResult | void>;
  onPreviewChoice?: (
    choice: AestheticComparisonChoice,
    aesthetics: SceneAesthetics,
    preview: AestheticPreviewResult
  ) => void;
  onContinue?: (aesthetics: SceneAesthetics | SceneSketchRefinement) => void;
  isGenerating: boolean;
  isLastScene: boolean;
  phaseTheme?: WizardPhaseTheme;
  mode?: 'sketch' | 'aesthetic';
  continueLabel?: string;
  currentImage?: string;
  currentCaption?: string;
}

export function AestheticsPhase({
  sceneIndex,
  aesthetics,
  content,
  onContentChange,
  sketchRefinement,
  onChange,
  onPreview,
  onPreviewChoice,
  onContinue,
  isGenerating,
  isLastScene,
  phaseTheme = 'aesthetics',
  mode,
  continueLabel,
  currentImage,
  currentCaption,
}: AestheticsPhaseProps) {
  if (mode === 'sketch') {
    return (
      <SketchRefinePhase
        sceneIndex={sceneIndex}
        phaseTheme={phaseTheme}
        refinement={sketchRefinement || {}}
        onChange={onChange as (field: keyof SceneSketchRefinement, value: string) => void}
        onPreview={onPreview as (data: SceneSketchRefinement) => void}
        onContinue={onContinue as (data: SceneSketchRefinement) => void}
        isGenerating={isGenerating}
        isLastScene={isLastScene}
        content={content}
        onContentChange={onContentChange}
      />
    );
  }

  return (
    <AestheticPolishPhase
      sceneIndex={sceneIndex}
      phaseTheme={phaseTheme}
      aesthetics={aesthetics}
      onChange={onChange as (field: keyof SceneAesthetics, value: string) => void}
      onPreview={onPreview as (aesthetics: SceneAesthetics) => Promise<AestheticPreviewResult | void>}
      onPreviewChoice={onPreviewChoice}
      onContinue={onContinue as (aesthetics: SceneAesthetics) => void}
      isGenerating={isGenerating}
      isLastScene={isLastScene}
      content={content}
      onContentChange={onContentChange}
      continueLabel={continueLabel}
      currentImage={currentImage}
      currentCaption={currentCaption}
    />
  );
}

// ============================================================================
// SKETCH REFINEMENT PHASE
// ============================================================================

interface SketchRefinePhaseProps {
  sceneIndex: number;
  phaseTheme: WizardPhaseTheme;
  refinement: SceneSketchRefinement;
  onChange: (field: keyof SceneSketchRefinement, value: string) => void;
  onPreview: (data: SceneSketchRefinement) => void;
  onContinue: (data: SceneSketchRefinement) => void;
  isGenerating: boolean;
  isLastScene: boolean;
}

function SketchRefinePhase({
  sceneIndex: _sceneIndex,
  phaseTheme,
  refinement,
  onChange,
  onPreview,
  onContinue,
  isGenerating,
  isLastScene,
  content,
  onContentChange,
}: SketchRefinePhaseProps & { content?: Record<string,string|undefined>; onContentChange?: (field:string,value:string)=>void }) {
  // Content is considered "locked" once the user has submitted generation answers
  // (require one of the story-reflection fields: mindset or frustration).
  const contentLocked = Boolean(content && (content.mindset || content.frustration));

  return (
    <SketchRefinementForm
      phaseTheme={phaseTheme}
      refinement={refinement}
      onChange={onChange}
      onPreview={onPreview}
      onContinue={onContinue}
      isGenerating={isGenerating}
      isLastScene={isLastScene}
      content={content}
      onContentChange={onContentChange}
      contentLocked={contentLocked}
    />
  );
}

// ============================================================================
// AESTHETIC POLISH PHASE (original)
// ============================================================================

interface AestheticPolishPhaseProps {
  sceneIndex: number;
  phaseTheme: WizardPhaseTheme;
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
  continueLabel?: string;
  currentImage?: string;
  currentCaption?: string;
}

function AestheticPolishPhase({
  sceneIndex,
  phaseTheme,
  aesthetics,
  onChange,
  onPreview,
  onPreviewChoice,
  onContinue,
  isGenerating,
  isLastScene,
  continueLabel,
  currentImage,
  currentCaption,
  content: _content,
  onContentChange: _onContentChange,
}: AestheticPolishPhaseProps & { content?: Record<string,string|undefined>; onContentChange?: (field:string,value:string)=>void }) {
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
    setComparison(null);
  };

  return (
    <>
      <div
        className="rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col"
        style={{ ...panelCardStyle(phaseTheme), ...panelCardBorderStyle(phaseTheme) }}
      >
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Scene {sceneIndex + 1} - Visual Aesthetics</h2>
          <p className="text-sm text-gray-700 mt-1">Describe visual adjustments for this panel. Use Update Image to make changes before continuing.</p>
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

        {isGenerating && (
          <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader size="sm" color="blue" />
            <p className="text-sm font-medium text-blue-700">Regenerating scene...</p>
          </div>
        )}

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
