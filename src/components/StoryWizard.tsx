import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { useDisplayStore } from '@/lib/displayStore';
import { Loader } from '@mantine/core';
import { DynamicStoryWizard } from './DynamicStoryWizard';
import { ContentPhase, SceneContent } from './ContentPhase';
import { AestheticsPhase, SceneAesthetics, SceneSketchRefinement } from './AestheticsPhase';
import { StoryLockPhase } from './StoryLockPhase';
import { VisualStylePhase } from './VisualStylePhase';
import SketchFrameRenderer from './SketchFrameRenderer';
import { DesignerVariantPicker } from './DesignerVariantPicker';
import { DesignerContentPhase, type DesignerSceneAnswers } from './DesignerContentPhase';
import { StudyProgressStepper } from './StudyProgressStepper';
import { getDesignerVariant } from '@/data/designerStoryboards';
import { generateDesignerSceneImage } from '@/api/images';
import { ENABLE_DESIGNER_STORYBOARD_MODE } from '@/lib/designerMode';
import { logSystemPanelGeneration } from '@/lib/studyUsageData';
import { VisualStylePreferences } from '../types';
import type { SketchFrameData, FrameOutline } from '@/types';

// ─── Feature flags ─────────────────────────────────────────────────────────────

const ENABLE_SKETCH_MODE = true;

type SceneState = {
  content: SceneContent;
  aesthetics: SceneAesthetics;
  sketchRefinement?: SceneSketchRefinement;
};

type StoryboardFrame = {
  id: string;
  image?: string;
  caption: string;
  sketch?: SketchFrameData;
};

type WizardState = {
  sceneIndex: number;
  phase: 'variant-select' | 'panel-generate' | 'content' | 'aesthetics' | 'story-lock' | 'visual-style' | 'error';
  scenes: SceneState[];
  errorMessage?: string;
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
    flat[`scene${i}_action_adjust`] = aesthetics.action ?? '';
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
    flat[`scene${sceneIndex}_action_adjust`] = a.action ?? '';
    flat[`scene${sceneIndex}_env_adjust`]  = a.environment ?? '';
    flat[`scene${sceneIndex}_custom`]      = a.custom ?? '';
  }

  return flat;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DESIGNER_SCENE_FRAME_TYPES: FrameOutline['frameType'][] = [
  'Context',
  'Problem',
  'Action',
  'Resolution'
];

const INITIAL_WIZARD_STATE: WizardState = {
  sceneIndex: 0,
  phase: ENABLE_DESIGNER_STORYBOARD_MODE ? 'variant-select' : 'content',
  scenes: Array.from({ length: 4 }, () => ({ content: {}, aesthetics: {} }))
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StoryWizard({ onComplete }: { onComplete: () => void }) {
  const [wizardState, setWizardState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [warmUpAnswers, setWarmUpAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [iterativeAfterStyle, setIterativeAfterStyle] = useState(false);
  const [isFirstFrameGenerating, setIsFirstFrameGenerating] = useState(false);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [viewedFrameIndex, setViewedFrameIndex] = useState(0);
  const [sbId, setSbId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [useGeneratedPanelsFlow, setUseGeneratedPanelsFlow] = useState(false);
  const [sketchGenerationError, setSketchGenerationError] = useState<string | null>(null);

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
    createDesignerStoryboardNode,
    setDesignerStoryboardFramePick,
    applyDesignerSceneUpdate,
    getEffectiveDesignerStoryboards,
    consumeWarmUpPrefetch,
    preCacheImagePrompt,
    generateSingleStoryboardFrame,
    generateInitialSketchStoryboard,
    refineSketchStoryboardFrame,
    generateFinalStoryboardImages, // Used to trigger final render when implemented in canvas
    updateVisualStylePreferences,
    generateAndSetStoryboardTitle,
    invalidateFrameImageGen,
    priorExperience,
    nodes,
    addStudyEvent
  } = useStore();

  const { setRegeneratingNode } = useDisplayStore((state) => ({
    setRegeneratingNode: state.setRegeneratingNode
  }));

  const { sceneIndex, phase, scenes } = wizardState;

  const storyboardNode = nodes.find(n => n.id === sbId);
  const storyboardFrames = storyboardNode?.data?.storyboard?.outline as
    | StoryboardFrame[]
    | undefined;

  const viewedFrame = storyboardFrames?.[viewedFrameIndex];
  const framesGenerated = sceneIndex + 1;

  // ─── Warm-up submit (existing behavior, unchanged) ───────────────────────────

  const handleDynamicSubmit = async (answers: Record<string, string>) => {
    if (ENABLE_DESIGNER_STORYBOARD_MODE) {
      console.warn('[DesignerMode] handleDynamicSubmit invoked while designer mode active — ignoring');
      return;
    }
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

      // Generate initial sketches or first frame
      if (ENABLE_SKETCH_MODE) {
        // Generate all 4 sketch frames at once for quick preview
        setIsFirstFrameGenerating(true);
        setSketchGenerationError(null);
        try {
          await generateInitialSketchStoryboard(storyboardId, answers);
          console.log('[Sketch] Initial sketches generated successfully');
        } catch (error) {
          console.error('[SKETCH MODE] Failed to generate initial sketch storyboard', error);
          setWizardState({
            sceneIndex: 0,
            phase: 'error',
            scenes: Array.from({ length: 4 }, () => ({ content: {}, aesthetics: {} })),
            errorMessage: 'Sketch storyboard generation failed. Check console logs.'
          });
          setIsFirstFrameGenerating(false);
          return;
        } finally {
          setIsFirstFrameGenerating(false);
        }
      } else {
        // Fall back to existing behavior: generate high-fidelity image for frame 0
        setIsFirstFrameGenerating(true);
        try {
          await generateSingleStoryboardFrame(storyboardId, 0, answers);
        } finally {
          setIsFirstFrameGenerating(false);
        }
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

  const onContentDebugSubmit = (content: SceneContent) => {
    const updatedScenes = scenes.map((s, i) =>
      i === sceneIndex ? { ...s, content } : s
    );
    const updatedState: WizardState = { ...wizardState, scenes: updatedScenes };
    if (sceneIndex < 3) {
      const nextIndex = sceneIndex + 1;
      setWizardState({ ...updatedState, sceneIndex: nextIndex, phase: 'content' });
      setViewedFrameIndex(nextIndex);
      return;
    }
    setWizardState({ ...updatedState, phase: 'story-lock', sceneIndex: 0 });
  };

  const onContentSubmit = (content: SceneContent) => {
    const updatedScenes = scenes.map((s, i) =>
      i === sceneIndex ? { ...s, content } : s
    );
    const updatedState: WizardState = { ...wizardState, scenes: updatedScenes };
    setWizardState(updatedState);
    if (sceneIndex < 3 && sbId) {
      const nextIndex = sceneIndex + 1;
      const captions = (storyboardFrames ?? []).slice(0, nextIndex).map(f => f.caption ?? '');
      const ctx = buildFlatContext(warmUpAnswers, updatedState, nextIndex, false, captions);

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

      setWizardState({ ...updatedState, sceneIndex: nextIndex, phase: 'content' });
      setViewedFrameIndex(nextIndex);
      return;
    }

    setWizardState({ ...updatedState, phase: 'story-lock', sceneIndex: 0 });
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

  const generateFrame = async (
    idx: number,
    ctx: Record<string, string>,
    options?: { awaitImage?: boolean; imageOnly?: boolean; forcePromptRegeneration?: boolean }
  ) => {
    if (!sbId) return;
    await generateSingleStoryboardFrame(sbId, idx, ctx, {
      awaitImage: true,
      ...options
    });
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
      await generateFrame(sceneIndex, ctx, { forcePromptRegeneration: true });

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

    // After visual style is saved, aesthetics becomes an iterative per-panel pass.
    if (iterativeAfterStyle) {
      if (sceneIndex === 3) {
        setIterativeAfterStyle(false);
        onComplete();
        return;
      }

      const nextIndex = sceneIndex + 1;
      setWizardState({ ...updatedState, sceneIndex: nextIndex, phase: 'aesthetics' });
      setViewedFrameIndex(nextIndex);
      return;
    }

    if (sceneIndex === 3) {
      if (sbId) {
        const captions = (storyboardFrames ?? []).map((f) => f.caption ?? '');
        const ctx = buildFlatContext(warmUpAnswers, updatedState, 3, true, captions);
        void generateAndSetStoryboardTitle(sbId, ctx).catch((err) =>
          console.error('[generateAndSetStoryboardTitle]', err)
        );
      }

      // Move to story-lock so the user can review all frames and then select Visual Style.
      setWizardState({ ...updatedState, phase: 'story-lock', sceneIndex: 0 });
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
    } catch (error) {
      console.error(error);
      speculativeRef.current = null;
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── Sketch refinement handlers (sketch mode only) ────────────────────────────

  const onSketchRefinementChange = (field: keyof SceneSketchRefinement, value: string) => {
    setWizardState(prev => {
      const updated = [...prev.scenes];
      const refinement = updated[prev.sceneIndex].sketchRefinement ?? {};
      updated[prev.sceneIndex] = {
        ...updated[prev.sceneIndex],
        sketchRefinement: { ...refinement, [field]: value }
      };
      return { ...prev, scenes: updated };
    });
  };

  const onSketchPreview = async (refinement: SceneSketchRefinement) => {
    const updatedScenes = scenes.map((s, i) =>
      i === sceneIndex ? { ...s, sketchRefinement: refinement } : s
    );
    const nextState = { ...wizardState, scenes: updatedScenes };
    setWizardState(nextState);

    setIsPreviewGenerating(true);
    try {
      if (!sbId) return;

      // Build user feedback from refinement fields
      const feedbackParts: string[] = [];
      if (refinement.actors?.trim()) feedbackParts.push(`Characters/actors: ${refinement.actors}`);
      if (refinement.setting?.trim()) feedbackParts.push(`Setting: ${refinement.setting}`);
      if (refinement.userGoal?.trim()) feedbackParts.push(`User goal: ${refinement.userGoal}`);
      if (refinement.obstacle?.trim()) feedbackParts.push(`Obstacle/friction: ${refinement.obstacle}`);
      if (refinement.frameChange?.trim()) feedbackParts.push(`Change in frame: ${refinement.frameChange}`);
      if (refinement.emotionState?.trim()) {
        feedbackParts.push(`MAIN ACTOR EMOTION/STATE OVERRIDE: ${refinement.emotionState}`);
        feedbackParts.push('This is a hard override. Update the main actor\'s emotion/state accordingly.');
      }
      if (refinement.emotionState?.trim()) {
        feedbackParts.push(`MAIN ACTOR EMOTION/STATE OVERRIDE: ${refinement.emotionState}`);
        feedbackParts.push('This is a hard override. Update the main actor\'s emotion/state accordingly.');
      }
      if (refinement.carryForward?.trim()) feedbackParts.push(`Carry forward: ${refinement.carryForward}`);

      const userFeedback = feedbackParts.join('\n');
      if (!userFeedback.trim()) {
        console.log('[sketch preview] no refinement feedback provided');
        return;
      }

      await refineSketchStoryboardFrame(sbId, sceneIndex, userFeedback);
    } catch (error) {
      console.error('[sketch preview error]', error);
    } finally {
      setIsPreviewGenerating(false);
    }
  };

  const onSketchContinue = async (refinement: SceneSketchRefinement) => {
    const updatedScenes = scenes.map((s, i) =>
      i === sceneIndex ? { ...s, sketchRefinement: refinement } : s
    );
    const updatedState = { ...wizardState, scenes: updatedScenes };

    if (sceneIndex === 3) {
      // Move to story lock phase instead of completing immediately
      setWizardState({ ...updatedState, phase: 'story-lock', sceneIndex: 0 });
      return;
    }

    setIsGenerating(true);
    try {
      const nextIndex = sceneIndex + 1;
      setWizardState({ ...updatedState, sceneIndex: nextIndex, phase: 'content' });
      setViewedFrameIndex(nextIndex);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Keep sketch-only handlers referenced so the file passes noUnusedLocals while sketch mode is off.
  void onSketchRefinementChange;
  void onSketchPreview;
  void onSketchContinue;

  const onStoryLocked = () => {
    if (!sbId) return;
    const lockedCaptions = storyboardFrames?.map((frame, index) => `Frame ${index + 1}: "${frame.caption}"`).join(' | ');
    if (lockedCaptions) {
      console.log('[story lock] final locked captions:', lockedCaptions);
    }
    // Move to visual style selection phase
    setWizardState(prev => ({
      ...prev,
      phase: 'visual-style'
    }));
  };

  const onVisualStyleSaved = async (preferences: VisualStylePreferences) => {
    if (!sbId) return;
    // Save preferences and enter an iterative per-panel refinement pass
    updateVisualStylePreferences(sbId, preferences);
    console.log('[visual style preferences saved, entering iterative refinement]', preferences);
    setIsGenerating(true);
    setRegeneratingNode(sbId, true);
    try {
      await generateFinalStoryboardImages(sbId);
    } catch (err) {
      console.error('[generateFinalStoryboardImages]', err);
    } finally {
      setRegeneratingNode(sbId, false);
      setIsGenerating(false);
    }
    // Mark that we want to iterate on each panel with aesthetics before final rendering
    setIterativeAfterStyle(true);
    setWizardState(prev => ({ ...prev, phase: 'aesthetics', sceneIndex: 0 }));
    setViewedFrameIndex(0);
  };

  // ─── Designer storyboard mode handlers ────────────────────────────────────────

  const designerFrame = (
    storyboardFrames as Array<{
      frameType: FrameOutline['frameType'];
      image?: string;
      caption: string;
      contentAnswers?: Record<string, string>;
      reflectionAnswers?: Record<string, string>;
      aestheticNotes?: { character?: string; action?: string; environment?: string; custom?: string };
    }> | undefined
  )?.[sceneIndex];

  useEffect(() => {
    if (ENABLE_DESIGNER_STORYBOARD_MODE && phase === 'variant-select') {
      console.log('[DesignerMode] entering full storyboard variant-select');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sceneIndex]);

  const clearDesignerFrameSlot = (frameIndex: number) => {
    if (!sbId) return;
    setDesignerStoryboardFramePick(sbId, frameIndex, {
      frameType: DESIGNER_SCENE_FRAME_TYPES[frameIndex],
      image: '',
      caption: ''
    });
  };

  const onDesignerPick = ({ variantId }: { variantId: string }) => {
    // Use the effective storyboards (admin overrides applied) so the seeded node
    // reflects any uploaded panels; fall back to the base manifest variant.
    const variant =
      getEffectiveDesignerStoryboards().find((v) => v.id === variantId) ??
      getDesignerVariant(variantId);
    if (!variant) {
      console.warn(`[DesignerMode] unknown storyboard variant: ${variantId}`);
      return;
    }

    let id = sbId;
    if (id === null) {
      // Designer mode owns the canvas — wipe any persisted nodes/edges from a prior
      // standard-mode session before minting the standalone designer storyboard.
      console.log('[DesignerMode] starting fresh designer session — clearing prior canvas state');
      useStore.setState({ nodes: [], edges: [] });
      id = createDesignerStoryboardNode();
      setSbId(id);
      console.log(`[DesignerMode] created standalone storyboard node: ${id}`);
      console.log('[DesignerMode] skipping standard persona/problem/solution generation');
    }

    // Seed all 4 panels from the chosen full storyboard variant.
    console.log(`[DesignerMode] selected full storyboard variant: ${variantId}`);
    setSelectedVariantId(variantId);
    variant.frames.forEach((frame, index) => {
      setDesignerStoryboardFramePick(id!, index, frame);
    });

    // Begin the per-scene Content + Reflection loop at scene 0.
    addStudyEvent({
      initiator: 'user',
      type: 'DESIGNER_VARIANT_SELECTED',
      count: 1,
      data: { variantId, pickType: 'full' }
    });
    setWizardState(prev => ({ ...prev, phase: 'content', sceneIndex: 0 }));
    setViewedFrameIndex(0);
  };

  const onDesignerPanelPick = ({ variantId }: { variantId: string }) => {
    const variant =
      getEffectiveDesignerStoryboards().find((v) => v.id === variantId) ??
      getDesignerVariant(variantId);
    const frame = variant?.frames[sceneIndex];
    if (!variant || !frame || !sbId) {
      console.warn(`[DesignerMode] panel pick failed for variant ${variantId} at scene ${sceneIndex}`);
      return;
    }

    console.log(`[DesignerMode] confirmed panel ${frame.frameType} from variant ${variantId}`);
    setDesignerStoryboardFramePick(sbId, sceneIndex, frame);
    addStudyEvent({
      initiator: 'user',
      type: 'DESIGNER_VARIANT_SELECTED',
      count: 1,
      data: { variantId, pickType: 'panel', sceneIndex }
    });
    setWizardState((prev) => ({ ...prev, phase: 'content' }));
    setViewedFrameIndex(sceneIndex);
  };

  const onGenerateNewPanel = () => {
    setUseGeneratedPanelsFlow(true);

    if (sbId === null) {
      console.log('[DesignerMode] starting blank storyboard — clearing prior canvas state');
      useStore.setState({ nodes: [], edges: [] });
      const id = createDesignerStoryboardNode();
      setSbId(id);
    } else {
      clearDesignerFrameSlot(sceneIndex);
    }

    setWizardState((prev) => ({ ...prev, phase: 'panel-generate' }));
    setViewedFrameIndex(sceneIndex);
    addStudyEvent({
      initiator: 'user',
      type: 'DESIGNER_START_FROM_SCRATCH',
      count: 1,
      data: { sceneIndex }
    });
  };

  const onDesignerPanelGenerateFinalized = async (answers: DesignerSceneAnswers) => {
    if (!sbId || !designerFrame) return;
    console.log(`[DesignerMode] panel generate frame ${sceneIndex} (${designerFrame.frameType})`);
    setIsGenerating(true);
    try {
      const prevImage =
        sceneIndex > 0
          ? (storyboardFrames?.[sceneIndex - 1]?.image?.trim() ?? '')
          : '';
      const prevCaption =
        sceneIndex > 0
          ? (storyboardFrames?.[sceneIndex - 1]?.caption?.trim() ?? '')
          : '';

      const { image, caption, generation } = await generateDesignerSceneImage({
        currentImage: '',
        currentCaption: '',
        referenceImage: prevImage || undefined,
        referenceCaption: prevCaption || undefined,
        frameType: designerFrame.frameType,
        contentAnswers: answers,
        stage: 'content',
        createFromScratch: true
      });
      addStudyEvent({
        initiator: 'user',
        type: 'DESIGNER_PANEL_GENERATE',
        count: 1,
        data: { sceneIndex, frameType: designerFrame.frameType, answers }
      });
      applyDesignerSceneUpdate(sbId, sceneIndex, {
        stage: 'content',
        image,
        caption,
        contentAnswers: answers
      });
      logSystemPanelGeneration(addStudyEvent, {
        storyboardId: sbId,
        frameIndex: sceneIndex,
        frameType: designerFrame.frameType,
        stage: 'content',
        caption: caption ?? '',
        captionChanged: true,
        imagePrompt: generation.imagePrompt,
        contentAnswers: generation.contentAnswers,
        reflectionAnswers: generation.reflectionAnswers,
        aestheticNotes: generation.aestheticNotes,
        referenceCaption: generation.referenceCaption,
        createFromScratch: generation.createFromScratch,
        hasReferenceImage: generation.hasReferenceImage
      });
      setWizardState((prev) => ({ ...prev, phase: 'content' }));
    } catch (err) {
      console.error('[designer panel generate]', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const onDesignerContentFinalized = async (answers: DesignerSceneAnswers) => {
    if (!sbId || !designerFrame) return;
    console.log(`[DesignerMode] content update frame ${sceneIndex} (${designerFrame.frameType})`);
    const mergedAnswers = useGeneratedPanelsFlow
      ? { ...designerFrame.contentAnswers, ...answers }
      : answers;
    setIsGenerating(true);
    try {
      const { image, caption, generation } = await generateDesignerSceneImage({
        currentImage: designerFrame.image ?? '',
        currentCaption: designerFrame.caption ?? '',
        frameType: designerFrame.frameType,
        contentAnswers: mergedAnswers,
        stage: 'content'
      });
      addStudyEvent({
        initiator: 'user',
        type: 'DESIGNER_CONTENT_UPDATE',
        count: 1,
        data: { sceneIndex, frameType: designerFrame.frameType, answers: mergedAnswers }
      });
      applyDesignerSceneUpdate(sbId, sceneIndex, {
        stage: 'content',
        image,
        caption,
        contentAnswers: mergedAnswers
      });
      logSystemPanelGeneration(addStudyEvent, {
        storyboardId: sbId,
        frameIndex: sceneIndex,
        frameType: designerFrame.frameType,
        stage: 'content',
        caption: caption ?? '',
        captionChanged: (caption ?? '') !== (designerFrame.caption ?? ''),
        imagePrompt: generation.imagePrompt,
        contentAnswers: generation.contentAnswers,
        reflectionAnswers: generation.reflectionAnswers,
        aestheticNotes: generation.aestheticNotes,
        referenceCaption: generation.referenceCaption,
        createFromScratch: generation.createFromScratch,
        hasReferenceImage: generation.hasReferenceImage
      });
    } catch (err) {
      console.error('[designer content update]', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const onDesignerReflectionFinalized = (answers: DesignerSceneAnswers) => {
    if (!sbId) return;
    applyDesignerSceneUpdate(sbId, sceneIndex, {
      stage: 'content',
      reflectionAnswers: answers
    });
    addStudyEvent({
      initiator: 'user',
      type: 'DESIGNER_REFLECTION_COMPLETE',
      count: 1,
      data: { sceneIndex, answers }
    });

    if (sceneIndex === 3) {
      setWizardState(prev => ({ ...prev, phase: 'aesthetics', sceneIndex: 0 }));
      setViewedFrameIndex(0);
      return;
    }

    const nextIndex = sceneIndex + 1;
    const nextPhase = useGeneratedPanelsFlow ? 'panel-generate' : 'variant-select';
    if (useGeneratedPanelsFlow) {
      clearDesignerFrameSlot(nextIndex);
    }
    setWizardState(prev => ({ ...prev, sceneIndex: nextIndex, phase: nextPhase }));
    setViewedFrameIndex(nextIndex);
  };

  const onDesignerAestheticPreview = async (aesthetics: SceneAesthetics) => {
    if (!sbId || !designerFrame) return;
    console.log(`[DesignerMode] aesthetic update frame ${sceneIndex} (${designerFrame.frameType})`);
    setIsPreviewGenerating(true);
    try {
      const { image, generation } = await generateDesignerSceneImage({
        currentImage: designerFrame.image ?? '',
        currentCaption: designerFrame.caption ?? '',
        frameType: designerFrame.frameType,
        contentAnswers: designerFrame.contentAnswers ?? {},
        reflectionAnswers: designerFrame.reflectionAnswers ?? {},
        aestheticNotes: aesthetics,
        stage: 'aesthetic'
      });
      addStudyEvent({
        initiator: 'user',
        type: 'DESIGNER_AESTHETIC_PREVIEW',
        count: 1,
        data: { sceneIndex, aestheticNotes: aesthetics }
      });
      applyDesignerSceneUpdate(sbId, sceneIndex, {
        stage: 'aesthetics',
        image,
        aestheticNotes: aesthetics
      });
      logSystemPanelGeneration(addStudyEvent, {
        storyboardId: sbId,
        frameIndex: sceneIndex,
        frameType: designerFrame.frameType,
        stage: 'aesthetic',
        caption: designerFrame.caption ?? '',
        captionChanged: false,
        imagePrompt: generation.imagePrompt,
        contentAnswers: generation.contentAnswers,
        reflectionAnswers: generation.reflectionAnswers,
        aestheticNotes: generation.aestheticNotes,
        referenceCaption: generation.referenceCaption,
        createFromScratch: generation.createFromScratch,
        hasReferenceImage: generation.hasReferenceImage
      });
    } catch (err) {
      console.error('[designer aesthetic preview]', err);
    } finally {
      setIsPreviewGenerating(false);
    }
  };

  const onDesignerAestheticContinue = (aesthetics: SceneAesthetics) => {
    if (!sbId) return;
    applyDesignerSceneUpdate(sbId, sceneIndex, {
      stage: 'aesthetics',
      aestheticNotes: aesthetics
    });

    if (sceneIndex === 3) {
      addStudyEvent({
        initiator: 'user',
        type: 'WIZARD_COMPLETE',
        count: 1,
        data: { storyboardId: sbId }
      });
      onComplete();
      return;
    }
    addStudyEvent({
      initiator: 'user',
      type: 'DESIGNER_AESTHETIC_CONTINUE',
      count: 1,
      data: { sceneIndex, aestheticNotes: aesthetics }
    });
    const nextIndex = sceneIndex + 1;
    setWizardState(prev => ({ ...prev, sceneIndex: nextIndex, phase: 'aesthetics' }));
    setViewedFrameIndex(nextIndex);
  };

  // ─── Render path 1: warm-up / variant select ─────────────────────────────────

  if (ENABLE_DESIGNER_STORYBOARD_MODE && phase === 'variant-select') {
    const frameType = DESIGNER_SCENE_FRAME_TYPES[sceneIndex];
    const isInitialPick = sceneIndex === 0;

    return (
      <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
        <DesignerVariantPicker
          frameType={frameType}
          seededVariantId={isInitialPick ? undefined : selectedVariantId ?? undefined}
          rewordAsImagined={priorExperience === 'no'}
          onPick={isInitialPick ? onDesignerPick : onDesignerPanelPick}
          onStartFromScratch={onGenerateNewPanel}
        />
      </div>
    );
  }

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

        {/* ERROR PHASE */}
        {phase === 'error' && (
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 flex flex-col items-center gap-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-red-900 mb-2">Generation Error</h2>
                <p className="text-sm text-red-700 mb-4">{wizardState.errorMessage || 'An unexpected error occurred.'}</p>
                <p className="text-xs text-red-600 mb-6">Check browser console for detailed error logs.</p>
              </div>
              <button
                onClick={() => {
                  setSbId(null);
                  setWizardState(INITIAL_WIZARD_STATE);
                  setSketchGenerationError(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Back to Start
              </button>
            </div>
          </div>
        )}

        {/* SKETCH MODE ERROR ALERT */}
        {ENABLE_SKETCH_MODE && sketchGenerationError && phase !== 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="text-red-600 flex-shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">Sketch generation failed</p>
                <p className="text-sm text-red-700 mt-1">{sketchGenerationError}</p>
              </div>
            </div>
          </div>
        )}

        {phase !== 'error' && (
          <>
        {/* PROGRESS INDICATOR */}
        {ENABLE_DESIGNER_STORYBOARD_MODE ? (
          <div className="w-full mb-8 md:mb-10">
            <StudyProgressStepper
              phase={phase === 'aesthetics' ? 'aesthetics' : 'content'}
              sceneIndex={sceneIndex}
              totalScenes={4}
            />
          </div>
        ) : (
          <div className="w-full mb-6 md:mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${phase === 'visual-style' ? 100 : phase === 'story-lock' ? 100 : Math.max(5, ((sceneIndex + (phase === 'aesthetics' ? 0.5 : 0)) / 4) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              {phase === 'visual-style'
                ? 'Visual Style Direction'
                : phase === 'story-lock'
                ? 'Story Complete — Ready to Lock'
                : `Scene ${sceneIndex + 1} of 4 — ${
                    phase === 'content'
                      ? 'Content'
                      : 'Story reflection'
                  }`}
            </span>
          </div>
        )}

        {isGenerating && !ENABLE_DESIGNER_STORYBOARD_MODE ? (
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 flex flex-col items-center justify-center gap-4">
              <Loader size="lg" color="blue" />
              <p className="text-sm font-medium text-blue-700">AI is drawing your scene based on your answers...</p>
            </div>
          </div>
        ) : phase === 'story-lock' ? (
          <StoryLockPhase
            storyboardFrames={storyboardFrames}
            isGenerating={isGenerating}
            onLockStory={onStoryLocked}
          />
        ) : phase === 'visual-style' ? (
          <VisualStylePhase
            initialPreferences={storyboardNode?.data?.storyboard?.visualStylePreferences}
            isGenerating={isGenerating}
            onSave={onVisualStyleSaved}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            {/* LEFT: IMAGE + CAPTION */}
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
                    const isActiveGenerateScene =
                      ENABLE_DESIGNER_STORYBOARD_MODE &&
                      phase === 'panel-generate' &&
                      viewedFrameIndex === sceneIndex;
                    const showSkeleton =
                      (isGenerating && isActiveGenerateScene) ||
                      isFirstFrameGenerating ||
                      (isPreviewGenerating && viewedFrameIndex === sceneIndex);
                    const skeletonLabel =
                      isGenerating && isActiveGenerateScene
                        ? 'Generating panel…'
                        : isPreviewGenerating
                          ? 'Regenerating scene…'
                          : 'Painting your scene…';

                    if (isActiveGenerateScene && !showSkeleton) {
                      return (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400 bg-gray-50 p-8">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.5"
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-xs text-center max-w-[200px]">
                            Your panel will appear here after you answer the questions
                          </p>
                        </div>
                      );
                    }

                    // Priority 1: High-fidelity image data (show this after visual-style render)
                    if (viewedFrame?.image && !showSkeleton) {
                      return (
                        <img
                          src={viewedFrame.image}
                          alt={`Scene ${viewedFrameIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      );
                    }

                    // Priority 2: Sketch mode fallback (only when no image is available)
                    if (ENABLE_SKETCH_MODE && viewedFrame?.sketch && !showSkeleton) {
                      return (
                        <div className="w-full h-full bg-white">
                          <SketchFrameRenderer frame={viewedFrame.sketch} />
                        </div>
                      );
                    }

                    // Priority 3: Loading/placeholder state
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
                  "
                  {ENABLE_DESIGNER_STORYBOARD_MODE &&
                  phase === 'panel-generate' &&
                  viewedFrameIndex === sceneIndex
                    ? 'Answer the questions to generate your panel...'
                    : viewedFrame?.caption || 'Waiting for the AI to describe the scene...'}
                  "
                </p>
              </div>

            </div>

            {/* RIGHT: CONTENT OR AESTHETICS PHASE */}
            <div className="lg:col-span-7">
              {ENABLE_DESIGNER_STORYBOARD_MODE ? (
                (phase === 'panel-generate' || phase === 'content') && designerFrame ? (
                  <DesignerContentPhase
                    sceneIndex={sceneIndex}
                    frameType={designerFrame.frameType}
                    rewordAsImagined={priorExperience === 'no'}
                    questionSet={phase === 'panel-generate' ? 'generation' : 'content'}
                    isFinalContentRound={phase === 'content'}
                    initialContent={designerFrame.contentAnswers}
                    initialReflection={designerFrame.reflectionAnswers}
                    isGenerating={isGenerating}
                    isLastScene={sceneIndex === 3}
                    onContentFinalized={
                      phase === 'panel-generate'
                        ? onDesignerPanelGenerateFinalized
                        : onDesignerContentFinalized
                    }
                    onReflectionFinalized={onDesignerReflectionFinalized}
                  />
                ) : (
                  <AestheticsPhase
                    sceneIndex={sceneIndex}
                    mode="aesthetic"
                    aesthetics={scenes[sceneIndex].aesthetics}
                    onChange={onAestheticsChange as (field: keyof SceneAesthetics | keyof SceneSketchRefinement, value: string) => void}
                    onPreview={onDesignerAestheticPreview as (aesthetics: SceneAesthetics | SceneSketchRefinement) => void}
                    onContinue={onDesignerAestheticContinue as (aesthetics: SceneAesthetics | SceneSketchRefinement) => void}
                    isGenerating={isPreviewGenerating}
                    isLastScene={sceneIndex === 3}
                  />
                )
              ) : phase === 'content' ? (
                <ContentPhase
                  sceneIndex={sceneIndex}
                  content={scenes[sceneIndex].content}
                  onChange={onContentChange}
                  onSubmit={onContentSubmit}
                  onDebugSubmit={onContentDebugSubmit}
                />
              ) : (
                <AestheticsPhase
                  sceneIndex={sceneIndex}
                  mode="aesthetic"
                  sketchRefinement={scenes[sceneIndex].sketchRefinement}
                  aesthetics={scenes[sceneIndex].aesthetics}
                  content={scenes[sceneIndex].content}
                  onContentChange={(field, value) => onContentChange(field as keyof SceneContent, value)}
                  onChange={onAestheticsChange as (field: keyof SceneAesthetics | keyof SceneSketchRefinement, value: string) => void}
                  onPreview={onAestheticPreview as (aesthetics: SceneAesthetics | SceneSketchRefinement) => void}
                  onContinue={onAestheticContinue as (aesthetics: SceneAesthetics | SceneSketchRefinement) => void}
                  isGenerating={isPreviewGenerating}
                  isLastScene={sceneIndex === 3}
                />
              )}
            </div>

          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
