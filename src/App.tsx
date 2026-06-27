import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ApiKeyModal } from './components/ApiKeyModal';
import { IterateModal } from './components/IterateModal';
import { DependentGenerationModal } from './components/DependentGenerationModal';
import { StoryWizard } from './components/StoryWizard';
import { UserLandingPage } from './components/UserLandingPage';
import { StudyOverviewPage } from './components/StudyOverviewPage';
import { AdminSetup } from './components/AdminSetup';
import { GenerateMoreModal } from './components/GenerateMoreModal';
import { StoryboardEditorPage } from './components/StoryboardEditorPage';
import { NodeType } from './rf-components';
import { useStore } from './store';

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
  const hasCompletedLanding = useStore((s) => s.hasCompletedLanding);
  const hasCompletedOverview = useStore((s) => s.hasCompletedOverview);
  const adminSetupOpen = useStore((s) => s.adminSetupOpen);
  const setAdminSetupOpen = useStore((s) => s.setAdminSetupOpen);

  const handleStartOver = () => {
    useStore.setState({ nodes: [], edges: [] });
    setWizardOpened(true);
  };

  return (
    <div className="h-[100vh] w-[100vw]">
      {wizardOpened && !hasCompletedLanding && (
        <UserLandingPage onComplete={() => { /* store flip drives re-render */ }} />
      )}
      {wizardOpened && hasCompletedLanding && !hasCompletedOverview && (
        <StudyOverviewPage />
      )}
      {wizardOpened && hasCompletedLanding && hasCompletedOverview && (
        <StoryWizard onComplete={() => setWizardOpened(false)} />
      )}
      {!wizardOpened && (
        <>
          <StoryboardEditorPage />
          <div className="fixed top-6 left-6 z-50 flex items-center gap-3">
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
        </>
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
