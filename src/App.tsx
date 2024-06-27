import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  SelectionMode,
  Panel,
  useReactFlow,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useHotkeys } from 'react-hotkeys-hook';
import { NodeType, edgeTypes, nodeTypes } from './rf-components';
import { useCallback, useEffect, useState } from 'react';
import SelectionToolbar from './components/SelectionToolbar';

import { useStore } from './store';
import { ImageIcon, ImageOff } from 'lucide-react';
import {
  Accordion,
  Button,
  Card,
  Drawer,
  ScrollArea,
  Switch
} from '@mantine/core';
import { useShallow } from 'zustand/react/shallow';
import { useNodeGroups } from './lib/useNodeGroups';
import { useGroupFeedback } from './lib/useGroupFeedback';
import { GenerationModal } from './components/GenerationModal';
import { DependentGenerationModal } from './components/DependentGenerationModal';
import { NodeCountDisplayer } from './components/NodeCountDisplayer';

export default function App() {
  const {
    nodes,
    onNodesChange,
    edges,
    onEdgesChange,
    onConnect,
    onConnectStart,
    onConnectEnd,

    globalShowImage,
    setGlobalShowImage,

    undo,
    redo,

    selectedNodes,
    selectNodes,

    copy,
    paste
  } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      onNodesChange: state.onNodesChange,
      edges: state.edges,
      onEdgesChange: state.onEdgesChange,
      onConnect: state.onConnect,
      onConnectStart: state.onConnectStart,
      onConnectEnd: state.onConnectEnd,

      globalShowImage: state.globalShowImage,
      setGlobalShowImage: state.setGlobalShowImage,

      undo: state.undo,
      redo: state.redo,

      selectedNodes: state.nodes.filter(({ selected }) => selected),
      selectNodes: state.selectNodes,

      copy: state.copy,
      paste: state.paste
    }))
  );

  useHotkeys('mod+z', () => undo(), { preventDefault: true });
  useHotkeys('mod+y', () => redo(), { preventDefault: true });
  useHotkeys('mod+c', () => copy(), { preventDefault: true });
  useHotkeys('mod+v', () => paste(), { preventDefault: true });

  const [currentlySelecting, setCurrentlySelecting] = useState(false);
  const showSelectionTooltip = selectedNodes.length > 0 && !currentlySelecting;

  const { fitView, screenToFlowPosition } = useReactFlow();
  const hydrated = useStore.persist.hasHydrated();
  useEffect(() => {
    if (hydrated) fitView();
  }, [fitView, hydrated]);

  const { groupIdToNodeIds } = useNodeGroups();
  const { groupFeedback, generateGroupFeedback } = useGroupFeedback();
  const [generatingFeedback, setGeneratingFeedback] = useState(false);

  const [feedbackDrawerOpened, setFeedbackDrawerOpened] = useState(false);
  const [showGenerationModal, setShowGenerationModal] = useState(false);

  const [showDependentGenerationModal, setShowDependentGenerationModal] =
    useState(false);
  const [nodeToGenerate, setNodeToGenerate] = useState<
    'problem' | 'solution' | 'storyboard'
  >('problem');

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
        // Viewport
        panOnScroll
        selectionOnDrag
        nodeOrigin={[0.5, 0.5]}
        panOnDrag={false}
        selectionMode={SelectionMode.Partial}
        snapToGrid={true}
        defaultViewport={{
          x: 0,
          y: 0,
          zoom: 1
        }}
        minZoom={0.1}
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
            <Button onClick={() => setShowGenerationModal(true)}>
              Start brainstorming
            </Button>
            <Switch
              size="sm"
              checked={globalShowImage}
              onChange={(event) => {
                setGlobalShowImage(event.currentTarget.checked);
              }}
              onLabel={<ImageIcon className="w-3 h-3" />}
              offLabel={<ImageOff className="w-3 h-3" />}
            />
          </div>
        </Panel>
        <Panel position="top-right">
          <Button onClick={() => setFeedbackDrawerOpened(true)}>
            View feedback
          </Button>
        </Panel>
        <Controls position="bottom-right" />
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
            onMergePersonas={() => {}}
            onGenerateProblems={() => {
              setNodeToGenerate('problem');
              setShowDependentGenerationModal(true);
            }}
            onGenerateSolutions={() => {
              setNodeToGenerate('solution');
              setShowDependentGenerationModal(true);
            }}
            onGenerateStoryboard={() => {
              setNodeToGenerate('storyboard');
              setShowDependentGenerationModal(true);
            }}
            onDuplicate={() => {
              copy();
              paste();
            }}
          />
        )}
      </ReactFlow>
      <GenerationModal
        opened={showGenerationModal}
        onClose={() => setShowGenerationModal(false)}
      />
      <DependentGenerationModal
        opened={showDependentGenerationModal}
        onClose={() => setShowDependentGenerationModal(false)}
        nodeToGenerate={nodeToGenerate}
      />
      <Drawer
        opened={feedbackDrawerOpened}
        onClose={() => setFeedbackDrawerOpened(false)}
        title="Feedback"
        position="right"
        withOverlay={false}
      >
        <ScrollArea.Autosize scrollbars="y" maw="100%">
          <div className="flex flex-col gap-4 w-full">
            <Button
              loading={generatingFeedback}
              onClick={async () => {
                setGeneratingFeedback(true);
                await generateGroupFeedback();
                setGeneratingFeedback(false);
              }}
            >
              Generate feedback
            </Button>
            {Object.entries(groupIdToNodeIds).map(([groupId, nodeIds], idx) => {
              const nodeIdsArr = [...nodeIds];

              return (
                <Card key={groupId} withBorder>
                  <h3
                    className="font-bold text-md mb-2 cursor-pointer"
                    onClick={() => {
                      selectNodes(nodeIdsArr);
                      fitView({
                        nodes: [...nodeIds].map((id) => ({ id })),
                        duration: 1000,
                        padding: 1.1
                      });
                    }}
                  >
                    Group {idx + 1}
                  </h3>
                  <NodeCountDisplayer nodeIds={nodeIdsArr} />

                  {groupFeedback[groupId] && (
                    <Accordion className="mt-4">
                      {groupFeedback[groupId].map((feedback, idx) => (
                        <Accordion.Item key={idx} value={`${idx}`}>
                          <Accordion.Control>
                            {feedback.feedbackSummary}
                          </Accordion.Control>
                          <Accordion.Panel>
                            <NodeCountDisplayer
                              nodeIds={feedback.affectedNodes}
                            />

                            <p className="mt-4">{feedback.feedback}</p>

                            <Button
                              className="mt-2"
                              onClick={() => {
                                selectNodes(feedback.affectedNodes);
                                return fitView({
                                  nodes: feedback.affectedNodes.map((id) => ({
                                    id
                                  })),
                                  duration: 1000,
                                  padding: 1.1
                                });
                              }}
                            >
                              Go to nodes
                            </Button>
                          </Accordion.Panel>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea.Autosize>
      </Drawer>
    </div>
  );
}
