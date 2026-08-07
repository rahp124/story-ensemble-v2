import { useState } from 'react';
import { useStore } from '@/store';
import {
  StoryboardPanelStrip,
  type PanelFrameState,
  type StoryboardPanelFrame
} from './StoryboardPanelStrip';
import { StoryboardFrameAestheticModal } from './StoryboardFrameAestheticModal';

interface StudyProgressStepperProps {
  /** Zero-based panel index in the designer flow (0..3). */
  sceneIndex: number;
  storyboardId: string | null;
  frames: StoryboardPanelFrame[];
  className?: string;
}

function getFrameState(
  index: number,
  sceneIndex: number,
  hasImage: boolean
): PanelFrameState {
  if (index < sceneIndex) {
    return hasImage ? 'complete' : 'upcoming';
  }
  if (index === sceneIndex) {
    return 'active';
  }
  return 'upcoming';
}

export function StudyProgressStepper({
  sceneIndex,
  storyboardId,
  frames,
  className = ''
}: StudyProgressStepperProps) {
  const addStudyEvent = useStore((s) => s.addStudyEvent);
  const [aestheticFrameIndex, setAestheticFrameIndex] = useState<number | null>(null);

  const frameStates = frames.map((frame, index) =>
    getFrameState(index, sceneIndex, Boolean(frame.image?.trim()))
  );

  const handleFrameClick = (frameIndex: number) => {
    if (frameStates[frameIndex] !== 'complete') return;

    addStudyEvent({
      initiator: 'user',
      type: 'OPEN_FRAME_AESTHETICS',
      count: 1,
      data: { frameIndex }
    });
    setAestheticFrameIndex(frameIndex);
  };

  return (
    <div className={`w-full ${className}`}>
      <StoryboardPanelStrip
        variant="progress"
        frames={frames}
        activeIndex={sceneIndex}
        frameStates={frameStates}
        clickableCompletedOnly
        onFrameClick={handleFrameClick}
      />

      {storyboardId && (
        <StoryboardFrameAestheticModal
          storyboardId={storyboardId}
          frameIndex={aestheticFrameIndex}
          onClose={() => setAestheticFrameIndex(null)}
        />
      )}
    </div>
  );
}
