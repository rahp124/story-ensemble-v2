import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ApiKeyModal } from './components/ApiKeyModal';
import { IterateModal } from './components/IterateModal';
import { DependentGenerationModal } from './components/DependentGenerationModal';
import { StoryWizard } from './components/StoryWizard';
import { LoginPage } from './components/LoginPage';
import { UserLandingPage } from './components/UserLandingPage';
import { StudyOverviewPage } from './components/StudyOverviewPage';
import { CharacterCreationPage } from './components/CharacterCreationPage';
import { AdminSetup } from './components/AdminSetup';
import { GenerateMoreModal } from './components/GenerateMoreModal';
import {
  StoryboardEditorPage,
  type StoryboardFinalizeArtifact
} from './components/StoryboardEditorPage';
import { PostStoryboardSurveyPage } from './components/PostStoryboardSurveyPage';
import { NodeType } from './rf-components';
import { useStore } from './store';
import { fetchSession, logout } from './lib/accessSession';

type AccessStatus = 'loading' | 'authenticated' | 'anonymous';

export default function App() {
  const { nodes, selectedNodes, selectNodes } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      selectedNodes: state.nodes.filter(({ selected }) => selected),
      selectNodes: state.selectNodes
    }))
  );

  const [dependentGenerationModalOpened, setDependentGenerationModalOpened] =
    useState(false);
  const [dependentNodeToGenerate] = useState<
    'Problem' | 'Solution' | 'Storyboard'
  >('Problem');

  const [generateMoreModalOpened, setGenerateMoreModalOpened] = useState(false);
  const [generateMoreNodeToGenerate] = useState<
    'Persona' | 'Problem' | 'Solution' | 'Storyboard'
  >('Persona');

  const [wizardOpened, setWizardOpened] = useState(nodes.length === 0);
  const [storyboardArtifact, setStoryboardArtifact] =
    useState<StoryboardFinalizeArtifact | null>(null);
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('loading');

  const hasCompletedLanding = useStore((s) => s.hasCompletedLanding);
  const hasCompletedOverview = useStore((s) => s.hasCompletedOverview);
  const hasCompletedCharacterCreation = useStore((s) => s.hasCompletedCharacterCreation);
  const adminSetupOpen = useStore((s) => s.adminSetupOpen);
  const setAdminSetupOpen = useStore((s) => s.setAdminSetupOpen);
  const setAccessId = useStore((s) => s.setAccessId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await fetchSession();
        if (cancelled) return;
        if (session) {
          setAccessId(session.accessId);
          setAccessStatus('authenticated');
        } else {
          setAccessId(null);
          setAccessStatus('anonymous');
        }
      } catch {
        if (cancelled) return;
        setAccessId(null);
        setAccessStatus('anonymous');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setAccessId]);

  const handleLoginSuccess = (accessId: string) => {
    setAccessId(accessId);
    setAccessStatus('authenticated');
  };

  const handleStartOver = async () => {
    try {
      await logout();
    } catch {
      // Still reset local state even if logout request fails
    }
    useStore.setState({
      nodes: [],
      edges: [],
      studyEvents: [],
      accessId: null,
      hasCompletedLanding: false,
      hasCompletedOverview: false,
      hasCompletedCharacterCreation: false,
      characterProfile: null
    });
    setStoryboardArtifact(null);
    setWizardOpened(true);
    setAccessStatus('anonymous');
  };

  if (accessStatus === 'loading') {
    return (
      <div className="h-[100vh] w-[100vw] flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 text-slate-500">
        Checking access…
      </div>
    );
  }

  if (accessStatus === 'anonymous') {
    return <LoginPage onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-[100vh] w-[100vw]">
      {wizardOpened && !hasCompletedLanding && (
        <UserLandingPage onComplete={() => { /* store flip drives re-render */ }} />
      )}
      {wizardOpened && hasCompletedLanding && !hasCompletedOverview && (
        <StudyOverviewPage />
      )}
      {wizardOpened && hasCompletedLanding && hasCompletedOverview && !hasCompletedCharacterCreation && (
        <CharacterCreationPage />
      )}
      {wizardOpened && hasCompletedLanding && hasCompletedOverview && hasCompletedCharacterCreation && (
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
            onClick={handleStartOver}
            className="bg-white border border-gray-200 shadow-lg px-6 py-3 rounded-xl font-bold text-gray-800 hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <span>✨</span> Start New Story
          </button>
          <button
            onClick={() => setAdminSetupOpen(true)}
            className="bg-white border border-gray-200 shadow-lg px-5 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-all"
          >
            Admin Setup
          </button>
        </div>
      )}
      {adminSetupOpen && <AdminSetup />}
      <DependentGenerationModal
        opened={dependentGenerationModalOpened}
        onClose={() => {
          const multipleNodeTypesSelected =
            new Set(selectedNodes.map((node) => node.type)).size > 1;

          if (multipleNodeTypesSelected) {
            selectNodes(
              selectedNodes
                .filter((node) => node.type === NodeType.Solution)
                .map((node) => node.id)
            );
          }

          setDependentGenerationModalOpened(false);
        }}
        nodeToGenerate={dependentNodeToGenerate}
      />
      <GenerateMoreModal
        opened={generateMoreModalOpened}
        onClose={() => setGenerateMoreModalOpened(false)}
        nodeToGenerate={generateMoreNodeToGenerate}
      />
      <IterateModal />
      <ApiKeyModal />
    </div>
  );
}
