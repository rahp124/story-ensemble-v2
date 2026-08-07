import { useState } from 'react';
import { useStore } from '../store';
import type { DesignerStoryboard } from '@/data/designerStoryboards';
import { StudyOverviewPage } from './StudyOverviewPage';
import { DesignerVariantPicker } from './DesignerVariantPicker';
import { DesignerStoryboardResponsePage } from './DesignerStoryboardResponsePage';
import { PostStoryboardSurveyPage } from './PostStoryboardSurveyPage';

type DesignerPhase = 'select' | 'respond' | 'survey';

function StoryboardPreview({ storyboard }: { storyboard: DesignerStoryboard }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
      <img
        src={storyboard.image}
        alt={storyboard.title}
        className="w-full h-auto rounded-lg"
      />
    </div>
  );
}

export function DesignerFlow() {
  const hasCompletedOverview = useStore((s) => s.hasCompletedOverview);
  const selectedStoryboard = useStore((s) =>
    s.designerSelectedVariantId
      ? s
          .getEffectiveDesignerStoryboards()
          .find((sb) => sb.id === s.designerSelectedVariantId)
      : undefined
  );

  const [phase, setPhase] = useState<DesignerPhase>('select');

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

    setPhase('respond');
  };

  if (!hasCompletedOverview) {
    return <StudyOverviewPage />;
  }

  if (phase === 'select' || !selectedStoryboard) {
    return (
      <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
        <DesignerVariantPicker onPick={handlePick} />
      </div>
    );
  }

  if (phase === 'respond') {
    return (
      <DesignerStoryboardResponsePage
        storyboardPreview={<StoryboardPreview storyboard={selectedStoryboard} />}
        onComplete={() => setPhase('survey')}
      />
    );
  }

  return (
    <PostStoryboardSurveyPage
      storyboardPreview={<StoryboardPreview storyboard={selectedStoryboard} />}
    />
  );
}
