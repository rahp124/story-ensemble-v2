import { useState } from 'react';
import { useStore } from '../store';
import { Loader } from '@mantine/core';
import { DynamicStoryWizard } from './DynamicStoryWizard';
import { formatInterviewForAI } from '@/lib/formatInterviewForAI';
import { STORY_QUESTIONS } from '@/types/questionnaire';
import { ContentPhase, SceneContent } from './ContentPhase';
import { AestheticsPhase, SceneAesthetics } from './AestheticsPhase';

// ─── Types ────────────────────────────────────────────────────────────────────

type SceneState = {
  content: SceneContent;
  aesthetics: SceneAesthetics;
};

type WizardState = {
  sceneIndex: number;
  phase: 'content' | 'aesthetics';
  scenes: SceneState[];
};

// ─── Context flattener ────────────────────────────────────────────────────────

function buildFlatContext(
  warmUpAnswers: Record<string, string>,
  state: WizardState,
  sceneIndex: number,
  includeCurrentAesthetics = false,
  previousCaptions: string[] = []
): Record<string, string> {
  const flat: Record<string, string> = { ...warmUpAnswers };
  const progressionParts: string[] = [];

  for (let i = 0; i < sceneIndex; i++) {
    const { content, aesthetics } = state.scenes[i];
    flat[`scene${i}_familiarity`] = content.familiarity ?? '';
    flat[`scene${i}_mindset`]     = content.mindset ?? '';
    flat[`scene${i}_frustration`] = content.frustration ?? '';
    flat[`scene${i}_char_adjust`] = aesthetics.character ?? '';
    flat[`scene${i}_env_adjust`]  = aesthetics.environment ?? '';
    flat[`scene${i}_custom`]      = aesthetics.custom ?? '';

    const caption = previousCaptions[i];
    if (caption) flat[`frame${i + 1}_caption`] = caption;

    progressionParts.push(
      `Frame ${i + 1} already showed: mindset="${content.mindset ?? ''}", frustration="${content.frustration ?? ''}"${caption ? `, visual: "${caption}"` : ''}.`
    );
  }

  if (progressionParts.length > 0) {
    flat['story_progression'] =
      progressionParts.join(' ') +
      ' The next frame MUST show a new situation, location, or action — do NOT redraw anything from story_progression.';
  }

  const curr = state.scenes[sceneIndex].content;
  flat[`scene${sceneIndex}_familiarity`] = curr.familiarity ?? '';
  flat[`scene${sceneIndex}_mindset`]     = curr.mindset ?? '';
  flat[`scene${sceneIndex}_frustration`] = curr.frustration ?? '';

  if (includeCurrentAesthetics) {
    const a = state.scenes[sceneIndex].aesthetics;
    flat[`scene${sceneIndex}_char_adjust`] = a.character ?? '';
    flat[`scene${sceneIndex}_env_adjust`]  = a.environment ?? '';
    flat[`scene${sceneIndex}_custom`]      = a.custom ?? '';
  }

  return flat;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_WIZARD_STATE: WizardState = {
  sceneIndex: 0,
  phase: 'content',
  scenes: Array.from({ length: 4 }, () => ({ content: {}, aesthetics: {} }))
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StoryWizard({ onComplete }: { onComplete: () => void }) {
  const [wizardState, setWizardState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [warmUpAnswers, setWarmUpAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [viewedFrameIndex, setViewedFrameIndex] = useState(0);
  const [accuracyScore, setAccuracyScore] = useState(50);
  const [sbId, setSbId] = useState<string | null>(null);

  const {
    addProjectNode,
    generatePersonaNodes,
    generatePersonaImage,
    generateProblemNodes,
    generateSolutionNodes,
    generateStoryboardNode,
    generateSingleStoryboardFrame,
    nodes
  } = useStore();

  const { sceneIndex, phase, scenes } = wizardState;

  const storyboardNode = nodes.find(n => n.id === sbId);
  const storyboardFrames = storyboardNode?.data?.storyboard?.outline as
    | Array<{ id: string; image?: string; caption: string }>
    | undefined;

  const viewedFrame = storyboardFrames?.[viewedFrameIndex];
  const framesGenerated = sceneIndex + 1;

  // ─── Warm-up submit (existing behavior, unchanged) ───────────────────────────

  const handleDynamicSubmit = async (answers: Record<string, string>) => {
    setIsGenerating(true);
    try {
      useStore.setState({ nodes: [], edges: [] });

      const contextString = 'College student deciding on campus lunch';
      const designContextNodeId = addProjectNode({ designContext: contextString });

      const personaIds = await generatePersonaNodes(contextString, 1, [designContextNodeId]);
      if (personaIds[0]) {
        await generatePersonaImage(personaIds[0]);
      }

      const problemIds = await generateProblemNodes(contextString, personaIds, true);
      const ghostSolutionIds = await generateSolutionNodes(
        'The user finds a generic workaround to their problem.',
        problemIds,
        true
      );

      const interview = formatInterviewForAI(answers, STORY_QUESTIONS);
      const storyboardIds = await generateStoryboardNode(
        contextString,
        personaIds,
        problemIds,
        ghostSolutionIds,
        interview,
        { autoGenerateImages: false }
      );

      const storyboardId = storyboardIds[0];
      await generateSingleStoryboardFrame(storyboardId, 0, answers);

      setWarmUpAnswers(answers);
      setSbId(storyboardId);
      setWizardState(INITIAL_WIZARD_STATE);
      setViewedFrameIndex(0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── State-only transitions (no generation yet) ──────────────────────────────

  const onContentChange = (field: keyof SceneContent, value: string) => {
    setWizardState(prev => {
      const updated = [...prev.scenes];
      updated[prev.sceneIndex] = {
        ...updated[prev.sceneIndex],
        content: { ...updated[prev.sceneIndex].content, [field]: value }
      };
      return { ...prev, scenes: updated };
    });
  };

  const onContentSubmit = (content: SceneContent) => {
    setWizardState(prev => {
      const updated = [...prev.scenes];
      updated[prev.sceneIndex] = { ...updated[prev.sceneIndex], content };
      return { ...prev, scenes: updated, phase: 'aesthetics' };
    });
  };

  const onAestheticsChange = (field: keyof SceneAesthetics, value: string) => {
    setWizardState(prev => {
      const updated = [...prev.scenes];
      updated[prev.sceneIndex] = {
        ...updated[prev.sceneIndex],
        aesthetics: { ...updated[prev.sceneIndex].aesthetics, [field]: value }
      };
      return { ...prev, scenes: updated };
    });
  };

  const generateFrame = async (idx: number, ctx: Record<string, string>) => {
    if (!sbId) return;
    await generateSingleStoryboardFrame(sbId, idx, ctx);
  };

  const onAestheticPreview = async (aesthetics: SceneAesthetics) => {
    const updatedScenes = scenes.map((s, i) =>
      i === sceneIndex ? { ...s, aesthetics } : s
    );
    const nextState = { ...wizardState, scenes: updatedScenes };
    setWizardState(nextState);

    setIsPreviewGenerating(true);
    try {
      const captions = (storyboardFrames ?? []).slice(0, sceneIndex).map(f => f.caption ?? '');
      const ctx = buildFlatContext(warmUpAnswers, nextState, sceneIndex, true, captions);
      await generateFrame(sceneIndex, ctx);
    } catch (error) {
      console.error(error);
    } finally {
      setIsPreviewGenerating(false);
    }
  };

  const onAestheticContinue = async (aesthetics: SceneAesthetics) => {
    const updatedScenes = scenes.map((s, i) =>
      i === sceneIndex ? { ...s, aesthetics } : s
    );
    const updatedState = { ...wizardState, scenes: updatedScenes };

    if (sceneIndex === 3) {
      onComplete();
      return;
    }

    const nextIndex = sceneIndex + 1;
    setIsGenerating(true);
    try {
      const captions = (storyboardFrames ?? []).slice(0, nextIndex).map(f => f.caption ?? '');
      const ctx = buildFlatContext(warmUpAnswers, updatedState, nextIndex, false, captions);
      await generateFrame(nextIndex, ctx);
      setWizardState({ ...updatedState, sceneIndex: nextIndex, phase: 'content' });
      setViewedFrameIndex(nextIndex);
      setAccuracyScore(50);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Render path 1: warm-up ──────────────────────────────────────────────────

  if (sbId === null) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <DynamicStoryWizard
          onGenerateStoryboard={handleDynamicSubmit}
          isGenerating={isGenerating}
        />
      </div>
    );
  }

  // ─── Render path 2: scene loop ───────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto p-3 md:p-6 lg:p-8">

        {/* PROGRESS BAR */}
        <div className="w-full mb-6 md:mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${Math.max(5, ((sceneIndex + (phase === 'aesthetics' ? 0.5 : 0)) / 4) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Scene {sceneIndex + 1} of 4 — {phase === 'content' ? 'Content' : 'Aesthetics'}
          </span>
        </div>

        {isGenerating ? (
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 flex flex-col items-center justify-center gap-4">
              <Loader size="lg" color="blue" />
              <p className="text-sm font-medium text-blue-700">AI is drawing your scene based on your answers...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            {/* LEFT: IMAGE + CAPTION + ACCURACY */}
            <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">

              {/* IMAGE CAROUSEL */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative group">
                {framesGenerated > 1 && (
                  <>
                    <button
                      onClick={() => setViewedFrameIndex(Math.max(0, viewedFrameIndex - 1))}
                      disabled={viewedFrameIndex === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow hover:bg-white z-10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewedFrameIndex(Math.min(framesGenerated - 1, viewedFrameIndex + 1))}
                      disabled={viewedFrameIndex === framesGenerated - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow hover:bg-white z-10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                  {viewedFrame?.image ? (
                    <img
                      src={viewedFrame.image}
                      alt={`Scene ${viewedFrameIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                      <Loader size="md" />
                      <p className="text-xs">Loading scene...</p>
                    </div>
                  )}
                </div>

                {framesGenerated > 1 && (
                  <div className="flex justify-center gap-2 py-3 bg-gray-50 border-t border-gray-100">
                    {Array.from({ length: framesGenerated }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setViewedFrameIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === viewedFrameIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* CAPTION */}
              <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                <p className="text-gray-700 italic text-sm leading-relaxed">
                  "{viewedFrame?.caption || 'Waiting for the AI to describe the scene...'}"
                </p>
              </div>

              {/* ACCURACY SLIDER — only for current scene */}
              {viewedFrameIndex === sceneIndex && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-5">
                  <label className="block text-sm font-semibold text-gray-800 mb-4">
                    How accurate is this scene to what you imagined?
                  </label>
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Not Very</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={accuracyScore}
                      onChange={(e) => setAccuracyScore(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <span className="text-xs font-medium text-gray-500 whitespace-nowrap">Very</span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-500">{accuracyScore}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: CONTENT OR AESTHETICS PHASE */}
            <div className="lg:col-span-7">
              {phase === 'content' ? (
                <ContentPhase
                  sceneIndex={sceneIndex}
                  content={scenes[sceneIndex].content}
                  onChange={onContentChange}
                  onSubmit={onContentSubmit}
                />
              ) : (
                <AestheticsPhase
                  sceneIndex={sceneIndex}
                  aesthetics={scenes[sceneIndex].aesthetics}
                  onChange={onAestheticsChange}
                  onPreview={onAestheticPreview}
                  onContinue={onAestheticContinue}
                  isGenerating={isPreviewGenerating}
                  isLastScene={sceneIndex === 3}
                />
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
