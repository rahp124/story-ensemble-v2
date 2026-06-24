import { generateDesignerSceneImage } from '@/api/images';
import { useStore } from '@/store';
import { Loader, Modal } from '@mantine/core';
import { useEffect, useState } from 'react';
import {
  AestheticsPhase,
  type SceneAesthetics,
  type SceneSketchRefinement
} from './AestheticsPhase';
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

  const handlePreview = async (notes: SceneAesthetics) => {
    if (frameIndex === null || !frame) return;

    setIsGenerating(true);
    try {
      const { image } = await generateDesignerSceneImage({
        currentImage: frame.image ?? '',
        currentCaption: frame.caption ?? '',
        frameType: frame.frameType,
        contentAnswers: frame.contentAnswers ?? {},
        reflectionAnswers: frame.reflectionAnswers ?? {},
        aestheticNotes: notes,
        stage: 'aesthetic'
      });
      applyDesignerSceneUpdate(storyboardId, frameIndex, {
        stage: 'aesthetics',
        image,
        aestheticNotes: notes
      });
    } catch (err) {
      console.error('[StoryboardFrameAestheticModal preview]', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContinue = (notes: SceneAesthetics) => {
    if (frameIndex === null) return;
    applyDesignerSceneUpdate(storyboardId, frameIndex, {
      stage: 'aesthetics',
      aestheticNotes: notes
    });
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="90%"
      title={
        frameIndex !== null
          ? `Scene ${frameIndex + 1} — Visual Aesthetics`
          : undefined
      }
      centered
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <div className="bg-gray-100 rounded-xl border border-gray-200 overflow-hidden aspect-square flex items-center justify-center relative">
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
        </div>
        <div className="lg:col-span-7">
          {frameIndex !== null && (
            <AestheticsPhase
              sceneIndex={frameIndex}
              mode="aesthetic"
              aesthetics={aesthetics}
              onChange={
                handleChange as (
                  field: keyof SceneAesthetics | keyof SceneSketchRefinement,
                  value: string
                ) => void
              }
              onPreview={
                handlePreview as (
                  aesthetics: SceneAesthetics | SceneSketchRefinement
                ) => void
              }
              onContinue={
                handleContinue as (
                  aesthetics: SceneAesthetics | SceneSketchRefinement
                ) => void
              }
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
