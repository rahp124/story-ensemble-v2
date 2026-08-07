import { generateDesignerSceneImage } from '@/api/images';
import { logSystemPanelGeneration } from '@/lib/studyUsageData';
import { useStore } from '@/store';
import { Loader, Modal } from '@mantine/core';
import { useEffect, useState } from 'react';
import {
  AestheticsPhase,
  type AestheticComparisonChoice,
  type AestheticPreviewResult,
  type SceneAesthetics
} from './AestheticsPhase';
import { DEFAULT_CONTENT_SUBTITLES } from './DesignerContentPhase';
import { panelCardBorderStyle, panelCardStyle } from '@/lib/wizardPhaseTheme';
import type { StoryboardNodeData } from '@/types';
import { Node } from 'reactflow';
import { NodeType } from '@/rf-components';

const emptyAesthetics: SceneAesthetics = {};

interface StoryboardFrameAestheticModalProps {
  storyboardId: string;
  frameIndex: number | null;
  onClose: () => void;
}

export function StoryboardFrameAestheticModal({
  storyboardId,
  frameIndex,
  onClose
}: StoryboardFrameAestheticModalProps) {
  const opened = frameIndex !== null;

  const storyboardNode = useStore((state) =>
    state.nodes.find(
      (n): n is Node<StoryboardNodeData> =>
        n.id === storyboardId && n.type === NodeType.Storyboard
    )
  );

  const applyDesignerSceneUpdate = useStore((s) => s.applyDesignerSceneUpdate);
  const addStudyEvent = useStore((s) => s.addStudyEvent);

  const frame =
    frameIndex !== null
      ? storyboardNode?.data.storyboard.outline[frameIndex]
      : undefined;

  const [aesthetics, setAesthetics] = useState<SceneAesthetics>(emptyAesthetics);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (frame) {
      setAesthetics(frame.aestheticNotes ?? {});
    } else {
      setAesthetics(emptyAesthetics);
    }
  }, [frame?.aestheticNotes, frameIndex, frame]);

  const handleChange = (field: keyof SceneAesthetics, value: string) => {
    setAesthetics((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreview = async (notes: SceneAesthetics): Promise<AestheticPreviewResult | void> => {
    if (frameIndex === null || !frame) return;

    setIsGenerating(true);
    try {
      const { image, generation } = await generateDesignerSceneImage({
        currentImage: frame.image ?? '',
        currentCaption: frame.caption ?? '',
        frameType: frame.frameType,
        contentAnswers: frame.contentAnswers ?? {},
        reflectionAnswers: frame.reflectionAnswers ?? {},
        aestheticNotes: notes,
        stage: 'aesthetic'
      });
      logSystemPanelGeneration(addStudyEvent, {
        storyboardId,
        frameIndex,
        frameType: frame.frameType,
        stage: 'aesthetic',
        caption: frame.caption ?? '',
        captionChanged: false,
        imagePrompt: generation.imagePrompt,
        contentAnswers: generation.contentAnswers,
        reflectionAnswers: generation.reflectionAnswers,
        aestheticNotes: generation.aestheticNotes,
        referenceCaption: generation.referenceCaption,
        createFromScratch: generation.createFromScratch,
        hasReferenceImage: generation.hasReferenceImage
      });
      return { image, caption: frame.caption ?? '' };
    } catch (err) {
      console.error('[StoryboardFrameAestheticModal preview]', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewChoice = (
    choice: AestheticComparisonChoice,
    notes: SceneAesthetics,
    preview: AestheticPreviewResult
  ) => {
    if (choice !== 'updated' || frameIndex === null) return;
    addStudyEvent({
      initiator: 'user',
      type: 'EDITOR_AESTHETIC_PREVIEW',
      count: 1,
      data: { frameIndex, aestheticNotes: notes }
    });
    applyDesignerSceneUpdate(storyboardId, frameIndex, {
      stage: 'aesthetics',
      image: preview.image,
      aestheticNotes: notes
    });
  };

  const handleContinue = (notes: SceneAesthetics) => {
    if (frameIndex === null) return;
    addStudyEvent({
      initiator: 'user',
      type: 'EDITOR_AESTHETIC_SAVE',
      count: 1,
      data: { frameIndex, aestheticNotes: notes }
    });
    applyDesignerSceneUpdate(storyboardId, frameIndex, {
      stage: 'aesthetics',
      aestheticNotes: notes
    });
    onClose();
  };

  const frameTypeLabel =
    frame?.frameType === 'Action' ? 'Action / Solution' : frame?.frameType;
  const contentTitle =
    frameIndex !== null && frameTypeLabel
      ? `Scene ${frameIndex + 1} — ${frameTypeLabel}`
      : undefined;
  const contentSubtitle = frame?.frameType
    ? DEFAULT_CONTENT_SUBTITLES[frame.frameType]
    : undefined;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="90%"
      title={contentTitle}
      centered
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
              {isGenerating && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                  <Loader size="md" />
                </div>
              )}
              {frame?.image ? (
                <img
                  src={frame.image}
                  alt={`Scene ${(frameIndex ?? 0) + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <p className="text-sm text-gray-500">No image for this panel</p>
              )}
            </div>
            <div
              className="p-4 border-t"
              style={{
                ...panelCardStyle('content'),
                ...panelCardBorderStyle('content')
              }}
            >
              <p className="text-gray-700 italic leading-relaxed">
                "
                {frame?.caption ||
                  'Waiting for the AI to describe the scene...'}
                "
              </p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-7">
          {frameIndex !== null && (
            <AestheticsPhase
              sceneIndex={frameIndex}
              phaseTheme="content"
              title={contentTitle}
              subtitle={contentSubtitle}
              aesthetics={aesthetics}
              currentImage={frame?.image ?? ''}
              currentCaption={frame?.caption ?? ''}
              onChange={handleChange}
              onPreview={handlePreview}
              onPreviewChoice={handlePreviewChoice}
              onContinue={handleContinue}
              isGenerating={isGenerating}
              isLastScene
              continueLabel="Save & Close"
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
