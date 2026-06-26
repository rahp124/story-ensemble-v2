import { Loader } from '@mantine/core';
import SketchRefinementForm from './SketchRefinementForm';

export type SceneAesthetics = {
  character?: string;
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

interface AestheticsPhaseProps {
  sceneIndex: number;
  aesthetics: SceneAesthetics;
  content?: Record<string, string | undefined>;
  onContentChange?: (field: string, value: string) => void;
  sketchRefinement?: SceneSketchRefinement;
  onChange?: (field: keyof SceneAesthetics | keyof SceneSketchRefinement, value: string) => void;
  onPreview?: (aesthetics: SceneAesthetics | SceneSketchRefinement) => void;
  onContinue?: (aesthetics: SceneAesthetics | SceneSketchRefinement) => void;
  isGenerating: boolean;
  isLastScene: boolean;
  mode?: 'sketch' | 'aesthetic';
  continueLabel?: string;
}

export function AestheticsPhase({
  sceneIndex,
  aesthetics,
  content,
  onContentChange,
  sketchRefinement,
  onChange,
  onPreview,
  onContinue,
  isGenerating,
  isLastScene,
  mode,
  continueLabel,
}: AestheticsPhaseProps) {
  if (mode === 'sketch') {
    return (
      <SketchRefinePhase
        sceneIndex={sceneIndex}
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
      aesthetics={aesthetics}
      onChange={onChange as (field: keyof SceneAesthetics, value: string) => void}
      onPreview={onPreview as (aesthetics: SceneAesthetics) => void}
      onContinue={onContinue as (aesthetics: SceneAesthetics) => void}
      isGenerating={isGenerating}
      isLastScene={isLastScene}
      content={content}
      onContentChange={onContentChange}
      continueLabel={continueLabel}
    />
  );
}

// ============================================================================
// SKETCH REFINEMENT PHASE
// ============================================================================

interface SketchRefinePhaseProps {
  sceneIndex: number;
  refinement: SceneSketchRefinement;
  onChange: (field: keyof SceneSketchRefinement, value: string) => void;
  onPreview: (data: SceneSketchRefinement) => void;
  onContinue: (data: SceneSketchRefinement) => void;
  isGenerating: boolean;
  isLastScene: boolean;
}

function SketchRefinePhase({
  sceneIndex: _sceneIndex,
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
  aesthetics: SceneAesthetics;
  onChange: (field: keyof SceneAesthetics, value: string) => void;
  onPreview: (aesthetics: SceneAesthetics) => void;
  onContinue: (aesthetics: SceneAesthetics) => void;
  isGenerating: boolean;
  isLastScene: boolean;
  continueLabel?: string;
}

function AestheticPolishPhase({
  sceneIndex,
  aesthetics,
  onChange,
  onPreview,
  onContinue,
  isGenerating,
  isLastScene,
  continueLabel,
  content: _content,
  onContentChange: _onContentChange,
}: AestheticPolishPhaseProps & { content?: Record<string,string|undefined>; onContentChange?: (field:string,value:string)=>void }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6 lg:p-8 min-h-[500px] flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Scene {sceneIndex + 1} - Visual Aesthetics</h2>
        <p className="text-sm text-gray-500 mt-1">Describe visual adjustments for this panel. Use Preview Update to regenerate the current panel before continuing.</p>
      </div>

      <div className="flex-grow space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Character adjustment</label>
          <p className="text-xs text-gray-500 mb-2">Describe how the character should look or feel differently.</p>
          <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none" value={aesthetics.character ?? ''} onChange={(e)=>onChange('character', e.target.value)} disabled={isGenerating} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Environment adjustment</label>
          <p className="text-xs text-gray-500 mb-2">Adjust background, lighting, or setting details.</p>
          <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none" value={aesthetics.environment ?? ''} onChange={(e)=>onChange('environment', e.target.value)} disabled={isGenerating} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Custom notes</label>
          <p className="text-xs text-gray-500 mb-2">Any other directives (tone, props, composition overrides).</p>
          <textarea className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[70px] resize-none" value={aesthetics.custom ?? ''} onChange={(e)=>onChange('custom', e.target.value)} disabled={isGenerating} />
        </div>
      </div>

      {isGenerating && (
        <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader size="sm" color="blue" />
          <p className="text-sm font-medium text-blue-700">Regenerating scene...</p>
        </div>
      )}

      <div className="pt-6 md:pt-8 mt-6 md:mt-8 border-t border-gray-100 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => onPreview(aesthetics)}
          disabled={isGenerating}
          className="w-full py-3 px-6 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-xl border border-gray-300 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Update
        </button>
        <button type="button" onClick={() => onContinue(aesthetics)} disabled={isGenerating} className="w-full py-3 md:py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{continueLabel ?? (isLastScene ? 'Finish & Reveal Full Story' : 'Continue Without More Updates')}</button>
      </div>
    </div>
  );
}
