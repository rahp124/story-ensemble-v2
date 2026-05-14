import { useState, useRef } from 'react';
import { useStore } from '../store';
import { Loader } from '@mantine/core';
import { DynamicStoryWizard } from './DynamicStoryWizard';
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
  const [isFirstFrameGenerating, setIsFirstFrameGenerating] = useState(false);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [viewedFrameIndex, setViewedFrameIndex] = useState(0);
  const [accuracyScore, setAccuracyScore] = useState(50);
  const [sbId, setSbId] = useState<string | null>(null);

  // Speculative frame: fired when content phase completes, resolved before aesthetics "Continue"
  const speculativeRef = useRef<{
    frameIndex: number;
    promise: Promise<void>;
    resolved: boolean;
    hasAesthetics: boolean; // true only when restarted after Preview Update with real aesthetics
  } | null>(null);

  const {
    addProjectNode,
    generatePersonaNodes,
    generatePersonaImage,
    generateProblemNodes,
    generateSolutionNodes,
    createBlankStoryboardNode,
    consumeWarmUpPrefetch,
    preCacheImagePrompt,
    generateSingleStoryboardFrame,
    generateAndSetStoryboardTitle,
    invalidateFrameImageGen,
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
      const contextString = 'College student deciding on campus lunch';
      const prefetch = consumeWarmUpPrefetch();

      let personaIds: string[];

      if (prefetch) {
        // Persona generation was pre-fetched while the user filled the questionnaire.
        personaIds = prefetch.personaIds ?? await prefetch.personaIdsPromise;
        // Image gen is already in flight from the prefetch; let it run in background
        if (!prefetch.imagePromise && personaIds[0]) {
          void generatePersonaImage(personaIds[0]);
        }
      } else {
        // Fallback: no prefetch available — generate from scratch
        useStore.setState({ nodes: [], edges: [] });
        const designContextNodeId = addProjectNode({ designContext: contextString });
        personaIds = await generatePersonaNodes(contextString, 1, [designContextNodeId]);
        // Fire portrait gen in background — computeStoryboardFrame reads it from store when ready
        if (personaIds[0]) void generatePersonaImage(personaIds[0]);
      }

      const problemIds = await generateProblemNodes(contextString, personaIds, true);
      const ghostSolutionIds = await generateSolutionNodes(
        'The user finds a generic workaround to their problem.',
        problemIds,
        true
      );

      const storyboardId = createBlankStoryboardNode(personaIds, problemIds, ghostSolutionIds);

      // Node chain done — drop the full-screen loader and enter the scene loop immediately
      setWarmUpAnswers(answers);
      setSbId(storyboardId);
      setWizardState(INITIAL_WIZARD_STATE);
      setViewedFrameIndex(0);
      setIsGenerating(false);

      // personaImagePromise runs in background — store picks up the portrait when ready
      setIsFirstFrameGenerating(true);
      try {
        await generateSingleStoryboardFrame(storyboardId, 0, answers);
      } finally {
        setIsFirstFrameGenerating(false);
      }
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
      setIsFirstFrameGenerating(false);
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
    const updatedScenes = scenes.map((s, i) =>
      i === sceneIndex ? { ...s, content } : s
    );
    const updatedState: WizardState = { ...wizardState, scenes: updatedScenes, phase: 'aesthetics' };
    setWizardState(updatedState);

    // Speculatively generate the NEXT frame while the user works on aesthetics
    if (sceneIndex < 3 && sbId) {
      const nextIndex = sceneIndex + 1;
      const captions = (storyboardFrames ?? []).slice(0, nextIndex).map(f => f.caption ?? '');
      const ctx = buildFlatContext(warmUpAnswers, updatedState, nextIndex, true, captions);

      // Register the image-prompt in-flight synchronously so computeStoryboardFrame
      // below finds it in imagePromptInFlight and awaits the same request instead of
      // firing a duplicate GPT call.
      preCacheImagePrompt(sbId, nextIndex, ctx);

      const p = generateSingleStoryboardFrame(sbId, nextIndex, ctx)
        .then(() => {
          if (speculativeRef.current?.frameIndex === nextIndex) {
            speculativeRef.current.resolved = true;
          }
        })
        .catch(err => {
          console.warn('[speculative] frame generation failed, will regenerate on Continue:', err);
          if (speculativeRef.current?.frameIndex === nextIndex) {
            speculativeRef.current = null;
          }
        });

      speculativeRef.current = { frameIndex: nextIndex, promise: p, resolved: false, hasAesthetics: false };
    }
  };

  const onAestheticsChange = (field: keyof SceneAesthetics, value: string) => {
    // When the user starts typing aesthetics, any in-flight speculative for the
    // next frame was generated with stale (pre-aesthetics) context. Invalidate it
    // so its image write is discarded on arrival, and drop the ref so the Continue
    // handler regenerates fresh with the aesthetics included.
    const spec = speculativeRef.current;
    if (spec && sbId && spec.frameIndex === sceneIndex + 1 && !spec.hasAesthetics) {
      invalidateFrameImageGen(sbId, spec.frameIndex);
      speculativeRef.current = null;
    }

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
    await generateSingleStoryboardFrame(sbId, idx, ctx, { awaitImage: true });
  };

  const onAestheticPreview = async (aesthetics: SceneAesthetics) => {
    const updatedScenes = scenes.map((s, i) =>
      i === sceneIndex ? { ...s, aesthetics } : s
    );
    const nextState = { ...wizardState, scenes: updatedScenes };
    setWizardState(nextState);

    // Discard speculative — it was generated with the pre-preview caption.
    // invalidateFrameImageGen bumps the seq (so any in-flight round-1 write is
    // discarded on arrival) and clears any image/caption round 1 already wrote.
    speculativeRef.current = null;
    if (sceneIndex < 3 && sbId) {
      invalidateFrameImageGen(sbId, sceneIndex + 1);
    }

    setIsPreviewGenerating(true);
    try {
      const captions = (storyboardFrames ?? []).slice(0, sceneIndex).map(f => f.caption ?? '');
      const ctx = buildFlatContext(warmUpAnswers, nextState, sceneIndex, true, captions);
      await generateFrame(sceneIndex, ctx);

      // Restart speculative for the next frame using the updated caption from this preview.
      // Read directly from the store — the closure's storyboardFrames is stale here.
      if (sceneIndex < 3 && sbId) {
        const nextIndex = sceneIndex + 1;
        const freshNode = useStore.getState().nodes.find(n => n.id === sbId);
        const freshOutline = (freshNode?.data?.storyboard?.outline ?? []) as Array<{ caption: string }>;
        const updatedCaptions = freshOutline.slice(0, nextIndex).map(f => f.caption ?? '');
        const nextCtx = buildFlatContext(warmUpAnswers, nextState, nextIndex, true, updatedCaptions);

        preCacheImagePrompt(sbId, nextIndex, nextCtx);

        const p = generateSingleStoryboardFrame(sbId, nextIndex, nextCtx)
          .then(() => {
            if (speculativeRef.current?.frameIndex === nextIndex) {
              speculativeRef.current.resolved = true;
            }
          })
          .catch(err => {
            console.warn('[speculative after preview] frame generation failed:', err);
            if (speculativeRef.current?.frameIndex === nextIndex) {
              speculativeRef.current = null;
            }
          });

        speculativeRef.current = { frameIndex: nextIndex, promise: p, resolved: false, hasAesthetics: true };
      }
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
      if (sbId) {
        const captions = (storyboardFrames ?? []).map((f) => f.caption ?? '');
        const ctx = buildFlatContext(warmUpAnswers, updatedState, 3, true, captions);
        void generateAndSetStoryboardTitle(sbId, ctx).catch((err) =>
          console.error('[generateAndSetStoryboardTitle]', err)
        );
      }
      onComplete();
      return;
    }

    const nextIndex = sceneIndex + 1;
    const spec = speculativeRef.current;
    const hasSpec = spec !== null && spec.frameIndex === nextIndex;

    const currentAesthetics = updatedState.scenes[sceneIndex].aesthetics;
    const aestheticsEntered = !!(
      currentAesthetics.character?.trim() ||
      currentAesthetics.environment?.trim() ||
      currentAesthetics.custom?.trim()
    );

    // Instant transition — speculative frame already finished with correct aesthetics context
    if (hasSpec && spec.resolved && (!aestheticsEntered || spec.hasAesthetics)) {
      speculativeRef.current = null;
      setWizardState({ ...updatedState, sceneIndex: nextIndex, phase: 'content' });
      setViewedFrameIndex(nextIndex);
      setAccuracyScore(50);
      return;
    }

    setIsGenerating(true);
    try {
      if (hasSpec && (!aestheticsEntered || spec.hasAesthetics)) {
        // In-flight speculative has correct context — wait for it
        await spec.promise;

        // If the speculative failed it cleared itself; fall back to generating now
        if (speculativeRef.current === null) {
          const captions = (storyboardFrames ?? []).slice(0, nextIndex).map(f => f.caption ?? '');
          const ctx = buildFlatContext(warmUpAnswers, updatedState, nextIndex, false, captions);
          await generateFrame(nextIndex, ctx);
        }
      } else {
        // No speculative, or speculative lacks aesthetics — generate fresh with correct context.
        // If a stale speculative is still in-flight, let it settle first so its store write
        // doesn't stomp the correct result we're about to write.
        if (hasSpec) await spec.promise.catch(() => {});
        speculativeRef.current = null;
        const captions = (storyboardFrames ?? []).slice(0, nextIndex).map(f => f.caption ?? '');
        const ctx = buildFlatContext(warmUpAnswers, updatedState, nextIndex, false, captions);
        await generateFrame(nextIndex, ctx);
      }

      speculativeRef.current = null;
      setWizardState({ ...updatedState, sceneIndex: nextIndex, phase: 'content' });
      setViewedFrameIndex(nextIndex);
      setAccuracyScore(50);
    } catch (error) {
      console.error(error);
      speculativeRef.current = null;
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

                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {(() => {
                    const showSkeleton =
                      isFirstFrameGenerating ||
                      (isPreviewGenerating && viewedFrameIndex === sceneIndex);
                    const skeletonLabel = isPreviewGenerating
                      ? 'Regenerating scene…'
                      : 'Painting your scene…';
                    if (viewedFrame?.image && !showSkeleton) {
                      return (
                        <img
                          src={viewedFrame.image}
                          alt={`Scene ${viewedFrameIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      );
                    }
                    if (showSkeleton) {
                      return (
                        <div className="w-full h-full relative bg-gradient-to-br from-gray-100 via-gray-200 to-gray-150">
                          <div className="absolute inset-0 animate-pulse bg-gradient-to-tr from-blue-100/20 via-white/30 to-blue-100/20" />
                          <div className="absolute inset-0 p-5 flex flex-col gap-3">
                            <div className="flex-1 rounded-xl bg-gray-300/40 animate-pulse" />
                            <div className="h-3 rounded bg-gray-300/50 animate-pulse w-4/5" />
                            <div className="h-3 rounded bg-gray-300/40 animate-pulse w-3/5" />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-400 tracking-wide bg-white/60 px-3 py-1.5 rounded-full">
                              {skeletonLabel}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="flex flex-col items-center gap-2 text-gray-600">
                        <Loader size="md" />
                        <p className="text-xs">Loading scene...</p>
                      </div>
                    );
                  })()}
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
