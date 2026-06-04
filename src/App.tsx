import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
  //MiniMap,
  //ControlButton,
  //useKeyPress
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useHotkeys } from 'react-hotkeys-hook';
import { EdgeType, NodeType } from './rf-components';
import { useCallback, useEffect, useRef, useState } from 'react';
//import { toSvg } from 'html-to-image';
//import SelectionToolbar from './components/SelectionToolbar';

import { useStore } from './store';
/*
import {
  Camera,
  ClipboardList,
  PlusIcon,
  // Redo,
  Trash,
  //  Undo,
  StickyNoteIcon,
} from 'lucide-react';
*/

//import { Button, Kbd, Menu, Tooltip } from '@mantine/core';
import { useShallow } from 'zustand/react/shallow';
import { ApiKeyModal } from './components/ApiKeyModal';
//import { TutorialModal } from './components/TutorialModal';
import PersonaNode from './rf-components/PersonaNode';
import ProblemNode from './rf-components/ProblemNode';
import SolutionNode from './rf-components/SolutionNode';
import StoryboardNode from './rf-components/StoryboardNode';
import { IterateModal } from './components/IterateModal';
//import { FirstGenerationModal } from './components/FirstGenerationModal';
import { DependentGenerationModal } from './components/DependentGenerationModal';
import { StoryWizard } from './components/StoryWizard';
import { UserLandingPage } from './components/UserLandingPage';
import { GenerateMoreModal } from './components/GenerateMoreModal';
//import { findDirectDependencies } from './lib/graphHelper';
import CommentNode from './rf-components/CommentNode';
import ProjectNode from './rf-components/ProjectNode';
//import { downloadObjectAsJson } from './lib/utils';
import ContextEdge from './rf-components/ContextEdge';

const nodeTypes = {
  [NodeType.Persona]: PersonaNode,
  [NodeType.Problem]: ProblemNode,
  [NodeType.Solution]: SolutionNode,
  [NodeType.Storyboard]: StoryboardNode,
  [NodeType.Comment]: CommentNode,
  [NodeType.Project]: ProjectNode
};

const edgeTypes = {
  [EdgeType.Context]: ContextEdge,
};

export default function App() {
  const {
    nodes,
    //onNodesChange,
    edges,
    //onEdgesChange,
    //onConnect,
    //onConnectStart,
    //onConnectEnd,
    //onSelectionChange,

    // undo,
    // redo,

    selectedNodes,
    selectNodes,

    //setIterateModalOpen,
    //setIterateModalTab,

    copy,
    paste,

    addEmptyPersonaNode,
    addEmptyProblemNode,
    addEmptySolutionNode,
    addEmptyStoryboardNode,
    addCommentNode,

    //this used to be studyEvents and addStudyEvent, but I moved them to the store so that I can track events that happen in the modals as well (like dependent generation modal and iterate modal)
    addStudyEvent
  } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      onNodesChange: state.onNodesChange,
      edges: state.edges,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      onConnectStart: state.onConnectStart,
      onConnectEnd: state.onConnectEnd,
      onSelectionChange: state.onSelectionChange,

      undo: state.undo,
      redo: state.redo,

      selectedNodes: state.nodes.filter(({ selected }) => selected),
      selectNodes: state.selectNodes,

      setIterateModalOpen: state.setIterateModalOpen,
      setIterateModalTab: state.setIterateModalTab,

      copy: state.copy,
      paste: state.paste,

      addEmptyPersonaNode: state.addEmptyPersonaNode,
      addEmptyProblemNode: state.addEmptyProblemNode,
      addEmptySolutionNode: state.addEmptySolutionNode,
      addEmptyStoryboardNode: state.addEmptyStoryboardNode,
      addCommentNode: state.addCommentNode,

      studyEvents: state.studyEvents,
      addStudyEvent: state.addStudyEvent
    }))
  );

  // useHotkeys('mod+z', () => undo(), { preventDefault: true });
  // useHotkeys('mod+y', () => redo(), { preventDefault: true });
  useHotkeys('ctrl+c', () => copy(), { preventDefault: true });
  useHotkeys('ctrl+v', () => paste(), { preventDefault: true });
  useHotkeys('ctrl+s', () => setFirstGenerationModalOpened(true), { preventDefault: true });

  useHotkeys('ctrl+f', () => fitView(), { preventDefault: true });

  useHotkeys('ctrl+e', () => {
    addStudyEvent({
      initiator: 'user',
      type: 'ADD_EMPTY_COMMENT',
      count: 1,
      data: {}
    });
    addCommentNode()
  }, { preventDefault: true });

  useHotkeys('ctrl+1', () => {
    addStudyEvent({
      initiator: 'user',
      type: 'ADD_EMPTY_PERSONA',
      count: 1,
      data: {}
    });  
    addEmptyPersonaNode()
  }, { preventDefault: true });
  useHotkeys('ctrl+2', () => {
    addStudyEvent({
      initiator: 'user',
      type: 'ADD_EMPTY_PROBLEM',
      count: 1,
      data: {}
    });
    addEmptyProblemNode()
  }, { preventDefault: true });
  useHotkeys('ctrl+3', () => {
    addStudyEvent({
      initiator: 'user',
      type: 'ADD_EMPTY_SOLUTION',
      count: 1,
      data: {}
    });
    addEmptySolutionNode()
  }, { preventDefault: true });
  useHotkeys('ctrl+4', () => {
    addStudyEvent({
      initiator: 'user',
      type: 'ADD_EMPTY_STORYBOARD',
      count: 1,
      data: {}
    });
    addEmptyStoryboardNode()
  }, { preventDefault: true });

  //Thi sused to be currentlySelecting, setCurrentlySelecting
  //const [currentlySelecting, setCurrentlySelecting] = useState(false);
  //const showSelectionTooltip = selectedNodes.length > 0 && !currentlySelecting;

  const { fitView, screenToFlowPosition } = useReactFlow();
  const hydrated = useStore.persist.hasHydrated();
  useEffect(() => {
    if (hydrated) fitView();
  }, [fitView, hydrated]);
  // used to be firstGenerationModalOpened, setFirstGenerationModalOpened
  const [, setFirstGenerationModalOpened] =
    useState(false);

  const [dependentGenerationModalOpened, setDependentGenerationModalOpened] =
    useState(false);
  // used to be dependentNodeToGenerate, setDependentNodeToGenerate
  const [dependentNodeToGenerate] = useState<
    'Problem' | 'Solution' | 'Storyboard'
  >('Problem');

  const [generateMoreModalOpened, setGenerateMoreModalOpened] = useState(false);
  // used to be generateMoreNodeToGenerate, setGenerateMoreNodeToGenerate
  const [generateMoreNodeToGenerate] = useState<
    'Persona' | 'Problem' | 'Solution' | 'Storyboard'
  >('Persona');
  const [wizardOpened, setWizardOpened] = useState(nodes.length === 0);
  const hasCompletedLanding = useStore((s) => s.hasCompletedLanding);

  // ── Focus the final storyboard once the wizard finishes ───────────────────
  // Initialised to true so the existing post-hydration fitView handles initial
  // page loads (where the wizard isn't even opened) without double-fitting.
  // Reset to false whenever the wizard reopens; the next close fires the focus.
  const hasFocusedFinalStoryboardRef = useRef(true);
  useEffect(() => {
    if (wizardOpened) {
      hasFocusedFinalStoryboardRef.current = false;
    }
  }, [wizardOpened]);
  useEffect(() => {
    if (wizardOpened) return;
    if (hasFocusedFinalStoryboardRef.current) return;

    const storyboardNodes = nodes.filter((n) => n.type === NodeType.Storyboard);
    if (storyboardNodes.length === 0) {
      fitView();
      hasFocusedFinalStoryboardRef.current = true;
      return;
    }

    const target = storyboardNodes[storyboardNodes.length - 1];
    fitView({ nodes: [{ id: target.id }], padding: 0.2, duration: 600 });
    console.log(`[Canvas] Focused final storyboard node: ${target.id}`);
    hasFocusedFinalStoryboardRef.current = true;
  }, [wizardOpened, nodes, fitView]);

  const updateCenterPosition = useCallback(() => {
    const centerPosition = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });
    useStore.setState({ centerPosition });
  }, [screenToFlowPosition]);
  useEffect(() => {
    updateCenterPosition();
  }, [updateCenterPosition]);

  //const panActivationKeyCode = 'Space';
  //const isPanning = useKeyPress(panActivationKeyCode);
  /*
  async function downloadImage() {
    fitView();

    const image = await toSvg(
      document.querySelector('.react-flow__viewport')! as HTMLElement,
      {
        backgroundColor: 'white',
        pixelRatio: 2
      }
    );

    const a = document.createElement('a');

    a.setAttribute('href', image);
    a.setAttribute('download', 'screenshot.svg');
    document.body.appendChild(a); // required for firefox
    a.click();
    a.remove();
  }
  */

  const handleStartOver = () => {
    // 1. Wipe the AI's memory clean
    useStore.setState({ nodes: [], edges: [] }); 
    // 2. Bring the wizard back
    setWizardOpened(true); 
  };

  return (
    <div className="h-[100vh] w-[100vw]">
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodes={nodes}
        edges={edges}
        panOnScroll={true}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={false}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={true}
        elementsSelectable={true}
        preventScrolling={false}
        nodeOrigin={[0.5, 0.5]}
      >
        <Controls 
          showInteractive={false} 
          position="bottom-right" 
          className="mb-4 mr-4 bg-white border border-gray-200 shadow-md rounded-md"
        />
        <Background variant={BackgroundVariant.Dots} />
        {/* DELETED: Panel, Controls, MiniMap, SelectionToolbar */}
      </ReactFlow>

      {wizardOpened && !hasCompletedLanding && (
        <UserLandingPage onComplete={() => { /* store flip drives re-render */ }} />
      )}
      {wizardOpened && hasCompletedLanding && (
        <StoryWizard onComplete={() => setWizardOpened(false)} />
      )}
      {!wizardOpened && (
        <button 
          onClick={handleStartOver}
          className="fixed top-6 left-6 z-50 bg-white border border-gray-200 shadow-lg px-6 py-3 rounded-xl font-bold text-gray-800 hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <span>✨</span> Start New Story
        </button>
      )}
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
