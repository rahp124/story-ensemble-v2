import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  SelectionMode,
  Panel,
  useReactFlow,
  MiniMap,
  ControlButton,
  useKeyPress
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useHotkeys } from 'react-hotkeys-hook';
import { displayConfigByNodeType, EdgeType, NodeType } from './rf-components';
import { useCallback, useEffect, useState } from 'react';
import { toSvg } from 'html-to-image';
import SelectionToolbar from './components/SelectionToolbar';

import { useStore } from './store';
import {
  Camera,
  ClipboardList,
  PlusIcon,
  // Redo,
  Trash,
  //  Undo,
  StickyNoteIcon,
} from 'lucide-react';

import { Button, Kbd, Menu, Tooltip } from '@mantine/core';
import { useShallow } from 'zustand/react/shallow';
import { ApiKeyModal } from './components/ApiKeyModal';
import { TutorialModal } from './components/TutorialModal';
import PersonaNode from './rf-components/PersonaNode';
import ProblemNode from './rf-components/ProblemNode';
import SolutionNode from './rf-components/SolutionNode';
import StoryboardNode from './rf-components/StoryboardNode';
import { IterateModal } from './components/IterateModal';
import { FirstGenerationModal } from './components/FirstGenerationModal';
import { DependentGenerationModal } from './components/DependentGenerationModal';
import { GenerateMoreModal } from './components/GenerateMoreModal';
import { findDirectDependencies } from './lib/graphHelper';
import CommentNode from './rf-components/CommentNode';
import ProjectNode from './rf-components/ProjectNode';
import { downloadObjectAsJson } from './lib/utils';
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
    onNodesChange,
    edges,
    onEdgesChange,
    onConnect,
    onConnectStart,
    onConnectEnd,
    onSelectionChange,

    // undo,
    // redo,

    selectedNodes,
    selectNodes,

    setIterateModalOpen,
    setIterateModalTab,

    copy,
    paste,

    addEmptyPersonaNode,
    addEmptyProblemNode,
    addEmptySolutionNode,
    addEmptyStoryboardNode,
    addCommentNode,

    studyEvents,
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


  const [currentlySelecting, setCurrentlySelecting] = useState(false);
  const showSelectionTooltip = selectedNodes.length > 0 && !currentlySelecting;

  const { fitView, screenToFlowPosition } = useReactFlow();
  const hydrated = useStore.persist.hasHydrated();
  useEffect(() => {
    if (hydrated) fitView();
  }, [fitView, hydrated]);

  const [firstGenerationModalOpened, setFirstGenerationModalOpened] =
    useState(false);

  const [dependentGenerationModalOpened, setDependentGenerationModalOpened] =
    useState(false);
  const [dependentNodeToGenerate, setDependentNodeToGenerate] = useState<
    'Problem' | 'Solution' | 'Storyboard'
  >('Problem');

  const [generateMoreModalOpened, setGenerateMoreModalOpened] = useState(false);
  const [generateMoreNodeToGenerate, setGenerateMoreNodeToGenerate] = useState<
    'Persona' | 'Problem' | 'Solution' | 'Storyboard'
  >('Persona');

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

  const panActivationKeyCode = 'Space';
  const isPanning = useKeyPress(panActivationKeyCode);

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

  return (
    <div className="h-[100vh] w-[100vw]">
      <ReactFlow
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onSelectionChange={onSelectionChange}
        isValidConnection={({ source, target }) => {
          if (!source || !target) return false;

          const isPersonaToProblem =
            source.startsWith('persona-') && target.startsWith('problem-');
          const isProblemToSolution =
            source.startsWith('problem-') && target.startsWith('solution-');
          const isSolutionToStoryboard =
            source.startsWith('solution-') && target.startsWith('storyboard-');

          return (
            isPersonaToProblem || isProblemToSolution || isSolutionToStoryboard
          );
        }}
        // Viewport
        panOnScroll
        selectionOnDrag
        panOnDrag={false}
        panActivationKeyCode={panActivationKeyCode}
        nodesDraggable={!isPanning}
        nodesConnectable={!isPanning}
        nodesFocusable={!isPanning}
        edgesFocusable={!isPanning}
        elementsSelectable={!isPanning}
        nodeOrigin={[0.5, 0.5]}
        selectionMode={SelectionMode.Partial}
        snapToGrid={true}
        defaultViewport={{
          x: 0,
          y: 0,
          zoom: 1
        }}
        minZoom={0}
        proOptions={{ hideAttribution: true }}
        // Selection menu logic
        onSelectionStart={() => {
          setCurrentlySelecting(true);
        }}
        onSelectionEnd={() => {
          setCurrentlySelecting(false);
        }}
        // Track viewport
        onMoveEnd={updateCenterPosition}
      >
        <Panel position="top-left">
          <div className="flex gap-4 items-center">
            <Tooltip label={<div style={{color: 'black'}}><Kbd>Ctrl</Kbd> + <Kbd>s</Kbd></div>} arrowSize={10} withArrow color={'#00000'}>
            <Button 
              onClick={() => {
                setFirstGenerationModalOpened(true);
              }}
              leftSection={<StickyNoteIcon className="size-5" />}
            >
              Start brainstorming
            </Button>
            </Tooltip>
            <Menu position="bottom-start" trigger="click-hover">
              <Menu.Target>
                <Button 
                variant="light"
                leftSection={<PlusIcon className="size-5" />}
                >
                  Add empty node
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Tooltip label={<div style={{color: 'black'}}><Kbd>Ctrl</Kbd> + <Kbd>1</Kbd></div>} position="right" withArrow color={'#00000'}>
                <Menu.Item
                  leftSection={<PlusIcon className="size-5" />}
                  onClick={() => {
                    addStudyEvent({
                      initiator: 'user',
                      type: 'ADD_EMPTY_PERSONA',
                      count: 1,
                      data: {}
                    });
                    addEmptyPersonaNode();
                  }}
                >
                  Persona {displayConfigByNodeType[NodeType.Persona].emoji}
                </Menu.Item>
                </Tooltip>
                <Tooltip label={<div style={{color: 'black'}}><Kbd>Ctrl</Kbd> + <Kbd>2</Kbd></div>} position="right" withArrow color={'#00000'}>
                <Menu.Item
                  leftSection={<PlusIcon className="size-5" />}
                  onClick={() => {
                    addStudyEvent({
                      initiator: 'user',
                      type: 'ADD_EMPTY_PROBLEM',
                      count: 1,
                      data: {}
                    });
                    addEmptyProblemNode();
                  }}
                >
                  Problem {displayConfigByNodeType[NodeType.Problem].emoji}
                </Menu.Item>
                </Tooltip>
                <Tooltip label={<div style={{color: 'black'}}><Kbd>Ctrl</Kbd> + <Kbd>3</Kbd></div>} position="right" withArrow color={'#00000'}>
                <Menu.Item
                  leftSection={<PlusIcon className="size-5" />}
                  onClick={() => {
                    addStudyEvent({
                      initiator: 'user',
                      type: 'ADD_EMPTY_SOLUTION',
                      count: 1,
                      data: {}
                    });
                    addEmptySolutionNode();
                  }}
                >
                  Solution {displayConfigByNodeType[NodeType.Solution].emoji}
                </Menu.Item>
                </Tooltip>
                <Tooltip label={<div style={{color: 'black'}}><Kbd>Ctrl</Kbd> + <Kbd>4</Kbd></div>} position="right" withArrow color={'#00000'}>
                <Menu.Item
                  leftSection={<PlusIcon className="size-5" />}
                  onClick={() => {
                    addStudyEvent({
                      initiator: 'user',
                      type: 'ADD_EMPTY_STORYBOARD',
                      count: 1,
                      data: {}
                    });
                    addEmptyStoryboardNode();
                  }}
                >
                  Storyboard{' '}
                  {displayConfigByNodeType[NodeType.Storyboard].emoji}
                </Menu.Item>
                </Tooltip>
                <Tooltip label={<div style={{color: 'black'}}><Kbd>Ctrl</Kbd> + <Kbd>e</Kbd></div>} position="right" withArrow color={'#00000'}>
                <Menu.Item
                  leftSection={<PlusIcon className="size-5" />}
                  onClick={() => {
                    addStudyEvent({
                      initiator: 'user',
                      type: 'ADD_EMPTY_COMMENT',
                      count: 1,
                      data: {}
                    });
                    addCommentNode();
                  }}
                >
                  Comment {displayConfigByNodeType[NodeType.Comment].emoji}
                </Menu.Item>
                </Tooltip>
              </Menu.Dropdown>
            </Menu>
          </div>
        </Panel>
        <Controls position="bottom-right" showInteractive={false}>
          {/* <ControlButton onClick={() => undo()}>
            <Undo />
          </ControlButton>
          <ControlButton onClick={() => redo()}>
            <Redo />
          </ControlButton> */}
          <Tooltip label="Download canvas screenshot" withArrow>
            <div>
              <ControlButton onClick={downloadImage}>
                <Camera />
              </ControlButton>
            </div>
          </Tooltip>
          <Tooltip label="Download study usage data" withArrow>
            <div>
              <ControlButton
                onClick={() => {
                  downloadObjectAsJson(studyEvents, 'study-usage-data');
                }}
              >
                <ClipboardList />
              </ControlButton>
            </div>
          </Tooltip>

          <Tooltip label="Reset canvas">
            <div>
              <ControlButton
                onClick={() => {
                  const confirmation = confirm(
                    'Are you want to reset the canvas? All data will be lost.'
                  );
                  if (confirmation) {
                    useStore.persist.clearStorage();
                    window.location.reload();
                  }
                }}
              >
                <Trash />
              </ControlButton>
            </div>
          </Tooltip>
        </Controls>
        <MiniMap
          pannable
          zoomable
          position="bottom-left"
          nodeColor={(node) => {
            if (node.type === NodeType.Persona) return '#fef9c3';
            else if (node.type === NodeType.Problem) return '#fee2e2';
            else if (node.type === NodeType.Solution) return '#dbeafe';
            else return '#e2e2e2';
          }}
          nodeStrokeColor={(node) => {
            if (node.selected) return '#ADD8E6';
            else return 'transparent';
          }}
          nodeStrokeWidth={20}
        />
        <Background variant={BackgroundVariant.Dots} />
        {showSelectionTooltip && (
          <SelectionToolbar
            selectedNodes={selectedNodes}
            onGenerateProblems={() => {
              setDependentNodeToGenerate('Problem');
              setDependentGenerationModalOpened(true);
            }}
            onGenerateSolutions={() => {
              setDependentNodeToGenerate('Solution');
              setDependentGenerationModalOpened(true);
            }}
            onGenerateStoryboard={() => {
              const solutionIds = selectedNodes.map((node) => node.id);

              const problemIds = findDirectDependencies(solutionIds, edges);
              const personaIds = findDirectDependencies(problemIds, edges);

              selectNodes([...personaIds, ...problemIds, ...solutionIds]);

              setDependentNodeToGenerate('Storyboard');
              setDependentGenerationModalOpened(true);
            }}
            onGenerateMorePersonas={() => {
              setGenerateMoreNodeToGenerate('Persona');
              setGenerateMoreModalOpened(true);
            }}
            onGenerateMoreProblems={() => {
              setGenerateMoreNodeToGenerate('Problem');
              setGenerateMoreModalOpened(true);
            }}
            onGenerateMoreSolutions={() => {
              setGenerateMoreNodeToGenerate('Solution');
              setGenerateMoreModalOpened(true);
            }}
            onGenerateMoreStoryboard={() => {
              setGenerateMoreNodeToGenerate('Storyboard');
              setGenerateMoreModalOpened(true);
            }}
            onFeedback={() => {
              setIterateModalTab('feedback');
              setIterateModalOpen(true);
            }}
            onRegenerate={() => {
              setIterateModalTab('regenerate');
              setIterateModalOpen(true);
            }}
            onEdit={() => {
              setIterateModalTab('edit');
              setIterateModalOpen(true);
            }}
            onDuplicate={() => {
              addStudyEvent({
                initiator: 'user',
                type: 'DUPLICATE_NODES',
                count: selectedNodes.length,
                data: {}
              });

              copy();
              paste();
            }}
          />
        )}
        <Panel position="top-right">
          <TutorialModal />
        </Panel>
      </ReactFlow>
      <FirstGenerationModal
        opened={firstGenerationModalOpened}
        onClose={() => setFirstGenerationModalOpened(false)}
      />
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
