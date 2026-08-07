import { useState } from 'react';
import { useStore } from '../store';
import type { DesignerStoryboard } from '@/data/designerStoryboards';
import { StudyOverviewPage } from './StudyOverviewPage';
import { DesignerVariantPicker } from './DesignerVariantPicker';
import { DesignerStoryboardResponsePage } from './DesignerStoryboardResponsePage';
import { PostStoryboardSurveyPage } from './PostStoryboardSurveyPage';
import { EnlargeableStoryboardImage } from './EnlargeableStoryboardImage';
import {
  DESIGNER_RESPONSE_FRAME_TYPES,
  getDesignerFrameResponseQuestions
} from '@/types/designerResponseQuestionnaire';

type DesignerPhase = 'select' | 'respond' | 'survey';

type DesignerFlowProps = {
  onStartOver: () => void;
};

function StoryboardPreview({ storyboard }: { storyboard: DesignerStoryboard }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
      <EnlargeableStoryboardImage
        src={storyboard.image}
        alt={storyboard.title}
        imgClassName="w-full h-auto rounded-lg"
      />
    </div>
  );
}

export function DesignerFlow({ onStartOver }: DesignerFlowProps) {
  const hasCompletedOverview = useStore((s) => s.hasCompletedOverview);
  const addStudyEvent = useStore((s) => s.addStudyEvent);
  const selectedStoryboard = useStore((s) =>
    s.designerSelectedVariantId
      ? s
          .getEffectiveDesignerStoryboards()
          .find((sb) => sb.id === s.designerSelectedVariantId)
      : undefined
  );

  const [phase, setPhase] = useState<DesignerPhase>('select');
  const [respondFrameIndex, setRespondFrameIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handlePick = ({ storyboardId }: { storyboardId: string }) => {
    const state = useStore.getState();
    const storyboard = state
      .getEffectiveDesignerStoryboards()
      .find((sb) => sb.id === storyboardId);
    if (!storyboard) return;

    useStore.setState({ nodes: [], edges: [] });
    const sbId = state.createDesignerStoryboardNode();
    state.setDesignerStoryboardFramePick(sbId, 0, {
      frameType: 'Context',
      image: storyboard.image,
      caption: ''
    });
    state.updateStoryboardTitle(sbId, storyboard.title);
    state.setDesignerSelectedVariantId(storyboardId);
    state.addStudyEvent({
      initiator: 'user',
      type: 'DESIGNER_VARIANT_SELECTED',
      count: 1,
      data: { variantId: storyboardId, storyboardId: sbId }
    });

    setRespondFrameIndex(0);
    setAnswers({});
    setPhase('respond');
  };

  const handleFrameContinue = (frameAnswers: Record<string, string>) => {
    const mergedAnswers = { ...answers, ...frameAnswers };
    setAnswers(mergedAnswers);

    if (respondFrameIndex === DESIGNER_RESPONSE_FRAME_TYPES.length - 1) {
      addStudyEvent({
        initiator: 'user',
        type: 'DESIGNER_RESPONSES_SUBMITTED',
        count: 1,
        data: { answers: mergedAnswers }
      });
      setPhase('survey');
      return;
    }

    setRespondFrameIndex((prev) => prev + 1);
  };

  if (!hasCompletedOverview) {
    return <StudyOverviewPage />;
  }

  const startOverButton = (
    <div className="fixed top-6 left-6 z-[60] flex items-center gap-3">
      <button
        onClick={onStartOver}
        className="bg-white border border-gray-200 shadow-lg px-6 py-3 rounded-xl font-bold text-gray-800 hover:bg-gray-50 transition-all flex items-center gap-2"
      >
        <span>✨</span> Start New Story
      </button>
    </div>
  );

  if (phase === 'select' || !selectedStoryboard) {
    return (
      <>
        <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
          <DesignerVariantPicker onPick={handlePick} />
        </div>
        {startOverButton}
      </>
    );
  }

  if (phase === 'respond') {
    const frameType = DESIGNER_RESPONSE_FRAME_TYPES[respondFrameIndex];
    const questions = getDesignerFrameResponseQuestions(frameType);

    return (
      <>
        <DesignerStoryboardResponsePage
          storyboardPreview={<StoryboardPreview storyboard={selectedStoryboard} />}
          frameIndex={respondFrameIndex}
          frameType={frameType}
          questions={questions}
          initialAnswers={answers}
          isLastFrame={respondFrameIndex === DESIGNER_RESPONSE_FRAME_TYPES.length - 1}
          onContinue={handleFrameContinue}
        />
        {startOverButton}
      </>
    );
  }

  return (
    <>
      <PostStoryboardSurveyPage
        storyboardPreview={<StoryboardPreview storyboard={selectedStoryboard} />}
      />
      {startOverButton}
    </>
  );
}
