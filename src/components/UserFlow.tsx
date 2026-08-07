import { useState } from 'react';
import { useStore } from '../store';
import { StudyOverviewPage } from './StudyOverviewPage';
import { CharacterCreationPage } from './CharacterCreationPage';
import { StoryWizard } from './StoryWizard';
import {
  StoryboardEditorPage,
  type StoryboardFinalizeArtifact
} from './StoryboardEditorPage';
import { PostStoryboardSurveyPage } from './PostStoryboardSurveyPage';
import { ENABLE_ADMIN_SETUP } from '@/lib/featureFlags';

type UserFlowProps = {
  onStartOver: () => void;
};

export function UserFlow({ onStartOver }: UserFlowProps) {
  const nodes = useStore((s) => s.nodes);
  const hasCompletedOverview = useStore((s) => s.hasCompletedOverview);
  const hasCompletedCharacterCreation = useStore(
    (s) => s.hasCompletedCharacterCreation
  );
  const setAdminSetupOpen = useStore((s) => s.setAdminSetupOpen);

  const [wizardOpened, setWizardOpened] = useState(nodes.length === 0);
  const [storyboardArtifact, setStoryboardArtifact] =
    useState<StoryboardFinalizeArtifact | null>(null);

  return (
    <>
      {wizardOpened && !hasCompletedOverview && <StudyOverviewPage />}
      {wizardOpened && hasCompletedOverview && !hasCompletedCharacterCreation && (
        <CharacterCreationPage />
      )}
      {wizardOpened && hasCompletedOverview && hasCompletedCharacterCreation && (
        <StoryWizard onComplete={() => setWizardOpened(false)} />
      )}
      {!wizardOpened && storyboardArtifact && (
        <PostStoryboardSurveyPage artifact={storyboardArtifact} />
      )}
      {!wizardOpened && !storyboardArtifact && (
        <StoryboardEditorPage onFinalizeComplete={setStoryboardArtifact} />
      )}
      {!wizardOpened && (
        <div className="fixed top-6 left-6 z-[60] flex items-center gap-3">
          <button
            onClick={onStartOver}
            className="bg-white border border-gray-200 shadow-lg px-6 py-3 rounded-xl font-bold text-gray-800 hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <span>✨</span> Start New Story
          </button>
          {ENABLE_ADMIN_SETUP && (
            <button
              onClick={() => setAdminSetupOpen(true)}
              className="bg-white border border-gray-200 shadow-lg px-5 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Admin Setup
            </button>
          )}
        </div>
      )}
    </>
  );
}
