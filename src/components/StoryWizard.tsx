import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Loader } from '@mantine/core';
import {
  AestheticsPhase,
  SceneAesthetics,
  type AestheticComparisonChoice,
  type AestheticPreviewResult
} from './AestheticsPhase';
import { DesignerContentPhase, type DesignerSceneAnswers } from './DesignerContentPhase';
import { ReflectionPhase } from './ReflectionPhase';
import { StudyProgressStepper } from './StudyProgressStepper';
import { panelCardBorderStyle, panelCardStyle, type WizardPhaseTheme } from '@/lib/wizardPhaseTheme';
import { generateDesignerSceneImage } from '@/api/images';
import { logSystemPanelGeneration } from '@/lib/studyUsageData';
import type { FrameOutline } from '@/types';

type StoryboardFrame = {
  id: string;
  image?: string;
  caption: string;
};

type WizardState = {
  sceneIndex: number;
  phase: 'panel-generate' | 'aesthetics' | 'reflection';
  scenes: { aesthetics: SceneAesthetics }[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DESIGNER_SCENE_FRAME_TYPES: FrameOutline['frameType'][] = [
  'Context',
  'Problem',
  'Action',
  'Resolution'
];

const INITIAL_WIZARD_STATE: WizardState = {
  sceneIndex: 0,
  phase: 'panel-generate',
  scenes: Array.from({ length: 4 }, () => ({ aesthetics: {} }))
};

// ─── Component ────────────────────────────────────────────────────────────────

export function StoryWizard({ onComplete }: { onComplete: () => void }) {
  const [wizardState, setWizardState] = useState<WizardState>(INITIAL_WIZARD_STATE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [sbId, setSbId] = useState<string | null>(null);

  const {
    createDesignerStoryboardNode,
    setDesignerStoryboardFramePick,
    applyDesignerSceneUpdate,
    priorExperience,
    nodes,
    addStudyEvent
  } = useStore();

  const { sceneIndex, phase, scenes } = wizardState;

  const storyboardNode = nodes.find(n => n.id === sbId);
  const storyboardFrames = storyboardNode?.data?.storyboard?.outline as
    | StoryboardFrame[]
    | undefined;

  const currentSceneFrame = storyboardFrames?.[sceneIndex];

  // Create a blank designer storyboard node up front so the per-panel
  // Generation → Aesthetics → Reflection loop can begin immediately at scene 0.
  useEffect(() => {
    if (sbId !== null) return;
    useStore.setState({ nodes: [], edges: [] });
    const id = createDesignerStoryboardNode();
    setSbId(id);
    setWizardState({ ...INITIAL_WIZARD_STATE, phase: 'panel-generate', sceneIndex: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const captionTheme: WizardPhaseTheme = phase === 'aesthetics' ? 'aesthetics' : 'content';

  const showLeftImagePanel = !(phase === 'panel-generate' && !currentSceneFrame?.image);

  const clearDesignerFrameSlot = (frameIndex: number) => {
    if (!sbId) return;
    setDesignerStoryboardFramePick(sbId, frameIndex, {
      frameType: DESIGNER_SCENE_FRAME_TYPES[frameIndex],
      image: '',
      caption: ''
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

  const onDesignerPanelGenerateFinalized = async (answers: DesignerSceneAnswers) => {
    if (!sbId || !designerFrame) return;
    console.log(`[DesignerMode] panel generate frame ${sceneIndex} (${designerFrame.frameType})`);
    setIsGenerating(true);
    try {
      const characterRef = useStore.getState().characterProfile?.image?.trim() ?? '';

      const { image, caption, generation } = await generateDesignerSceneImage({
        currentImage: '',
        currentCaption: '',
        referenceImage: characterRef || undefined,
        frameType: designerFrame.frameType,
        contentAnswers: answers,
        stage: 'content',
        createFromScratch: true,
        hasCharacterProfileReference: !!characterRef
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
      // Panel image is generated — advance to the Aesthetics page for this panel.
      setWizardState((prev) => ({ ...prev, phase: 'aesthetics' }));
    } catch (err) {
      console.error('[designer panel generate]', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const onDesignerPanelGenerateDebugSkip = (answers: DesignerSceneAnswers) => {
    if (!sbId || !designerFrame) return;
    const characterRef = useStore.getState().characterProfile?.image?.trim() ?? '';
    applyDesignerSceneUpdate(sbId, sceneIndex, {
      stage: 'content',
      image: characterRef,
      caption: designerFrame.caption ?? '',
      contentAnswers: answers
    });
    setWizardState((prev) => ({ ...prev, phase: 'aesthetics' }));
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

    // Reflection is the last step of the per-panel loop. After the final panel,
    // finish the wizard (revealing the summary editor); otherwise restart the
    // loop for the next panel at its Generation step.
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

    const nextIndex = sceneIndex + 1;
    clearDesignerFrameSlot(nextIndex);
    setWizardState(prev => ({ ...prev, sceneIndex: nextIndex, phase: 'panel-generate' }));
  };

  const onDesignerAestheticPreview = async (aesthetics: SceneAesthetics): Promise<AestheticPreviewResult | void> => {
    if (!sbId || !designerFrame) return;
    console.log(`[DesignerMode] aesthetic update frame ${sceneIndex} (${designerFrame.frameType})`);
    setIsPreviewGenerating(true);
    try {
      const characterRef = useStore.getState().characterProfile?.image?.trim() ?? '';
      const { image, generation } = await generateDesignerSceneImage({
        currentImage: designerFrame.image ?? '',
        currentCaption: designerFrame.caption ?? '',
        frameType: designerFrame.frameType,
        contentAnswers: designerFrame.contentAnswers ?? {},
        reflectionAnswers: designerFrame.reflectionAnswers ?? {},
        aestheticNotes: aesthetics,
        stage: 'aesthetic',
        hasCharacterProfileReference: !!characterRef
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
      return { image, caption: designerFrame.caption ?? '' };
    } catch (err) {
      console.error('[designer aesthetic preview]', err);
    } finally {
      setIsPreviewGenerating(false);
    }
  };

  const onDesignerAestheticPreviewChoice = (
    choice: AestheticComparisonChoice,
    aesthetics: SceneAesthetics,
    preview: AestheticPreviewResult
  ) => {
    if (choice !== 'updated' || !sbId || !designerFrame) return;
    applyDesignerSceneUpdate(sbId, sceneIndex, {
      stage: 'aesthetics',
      image: preview.image,
      aestheticNotes: aesthetics
    });
    addStudyEvent({
      initiator: 'user',
      type: 'DESIGNER_AESTHETIC_PREVIEW',
      count: 1,
      data: { sceneIndex, aestheticNotes: aesthetics }
    });
  };

  const onDesignerAestheticContinue = (aesthetics: SceneAesthetics) => {
    if (!sbId) return;
    applyDesignerSceneUpdate(sbId, sceneIndex, {
      stage: 'aesthetics',
      aestheticNotes: aesthetics
    });
    addStudyEvent({
      initiator: 'user',
      type: 'DESIGNER_AESTHETIC_CONTINUE',
      count: 1,
      data: { sceneIndex, aestheticNotes: aesthetics }
    });
    // Accepting the aesthetics advances to the Reflection page for this panel.
    setWizardState(prev => ({ ...prev, phase: 'reflection' }));
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (sbId === null) {
    // The mount effect is creating the designer storyboard node; show a loader
    // for the brief moment before the per-panel loop can render.
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 flex items-center justify-center p-4">
        <Loader size="lg" color="blue" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      <div className="w-full max-w-7xl mx-auto p-3 md:p-6 lg:p-8">

        {/* PROGRESS INDICATOR */}
        <div className="w-full mb-8 md:mb-10">
          <StudyProgressStepper
            sceneIndex={sceneIndex}
            storyboardId={sbId}
            frames={DESIGNER_SCENE_FRAME_TYPES.map((frameType, i) => {
              const frame = storyboardFrames?.[i];
              return {
                id: frame?.id ?? String(i),
                frameType,
                image: frame?.image,
                caption: frame?.caption ?? ''
              };
            })}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* LEFT: IMAGE + CAPTION */}
          {showLeftImagePanel && (
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  {(() => {
                    const isActiveGenerateScene = phase === 'panel-generate';
                    const showSkeleton =
                      (isGenerating && isActiveGenerateScene) || isPreviewGenerating;
                    const skeletonLabel =
                      isGenerating && isActiveGenerateScene
                        ? 'Generating panel…'
                        : 'Regenerating scene…';

                    if (currentSceneFrame?.image && !showSkeleton) {
                      return (
                        <img
                          src={currentSceneFrame.image}
                          alt={`Scene ${sceneIndex + 1}`}
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

                <div
                  className="p-4 border-t"
                  style={{
                    ...panelCardStyle(captionTheme),
                    ...panelCardBorderStyle(captionTheme)
                  }}
                >
                  <p className="text-gray-700 italic leading-relaxed">
                    "
                    {currentSceneFrame?.caption ||
                      'Waiting for the AI to describe the scene...'}
                    "
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT: GENERATION, AESTHETICS, OR REFLECTION PHASE */}
          <div className={showLeftImagePanel ? 'lg:col-span-7' : 'lg:col-span-12'}>
            {phase === 'panel-generate' && designerFrame ? (
              <DesignerContentPhase
                sceneIndex={sceneIndex}
                frameType={designerFrame.frameType}
                rewordAsImagined={priorExperience === 'no'}
                questionSet="generation"
                phaseTheme="content"
                initialContent={designerFrame.contentAnswers}
                isGenerating={isGenerating}
                onContentFinalized={onDesignerPanelGenerateFinalized}
                onDebugSkipGenerate={onDesignerPanelGenerateDebugSkip}
              />
            ) : phase === 'reflection' && designerFrame ? (
              <ReflectionPhase
                sceneIndex={sceneIndex}
                frameType={designerFrame.frameType}
                initialReflection={designerFrame.reflectionAnswers}
                isLastScene={sceneIndex === 3}
                phaseTheme="content"
                onReflectionFinalized={onDesignerReflectionFinalized}
              />
            ) : (
              <AestheticsPhase
                sceneIndex={sceneIndex}
                phaseTheme="aesthetics"
                aesthetics={scenes[sceneIndex].aesthetics}
                currentImage={currentSceneFrame?.image ?? ''}
                currentCaption={currentSceneFrame?.caption ?? ''}
                onChange={onAestheticsChange}
                onPreview={onDesignerAestheticPreview}
                onPreviewChoice={onDesignerAestheticPreviewChoice}
                onContinue={onDesignerAestheticContinue}
                isGenerating={isPreviewGenerating}
                isLastScene={sceneIndex === 3}
                continueLabel="Looks good to me!"
              />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
