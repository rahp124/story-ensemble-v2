import { nanoid } from 'nanoid';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Node,
  SelectionMode,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeType, edgeTypes, nodeTypes } from './rf-components';
import { useState } from 'react';
import SelectionToolbar from './components/SelectionToolbar';

import { useStore } from './store';
import { useRfCursorPosition } from './lib/useRfCursorPosition';
import { StoryboardNodeData } from './types';
import { Plus } from 'lucide-react';
import {
  Accordion,
  Button,
  Modal,
  MultiSelect,
  ScrollArea,
  Textarea
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export default function App() {
  const {
    nodes,
    selectedNodes,
    onNodesChange,
    edges,
    onEdgesChange,
    onConnect,
    onConnectStart,
    onConnectEnd,
    onSelectionChange,
    cursorNode,
    swapCursorNode,
    updateCursorNodePosition,
    placeCursorNode,
    personaDimensions,
    pinPersonaDimension,
    generatePersonaNodes,
    mergePersonaNodes,
    problemDimensions,
    pinProblemDimension,
    generateProblemNodes,
    solutionDimensions,
    pinSolutionDimension,
    generateSolutionNodes
  } = useStore();
  const { rfCursorPosition, updateRfCursorPosition } = useRfCursorPosition();

  const selectedPersonaNodes = selectedNodes.filter(
    (node) => node.type === NodeType.Persona
  );
  const selectedProblemNodes = selectedNodes.filter(
    (node) => node.type === NodeType.Problem
  );
  // const selectedSolutionNodes = selectedNodes.filter(
  //   (node) => node.type === NodeType.Solution
  // );

  /* Instructions Modal */
  const [instructionsModalTitle, setInstructionsModalTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [onSubmitInstructions, setOnSubmitInstructions] = useState<
    (instruction: string) => Promise<void>
  >(async () => {});
  const [instructionsModalOpened, setInstructionsModalOpened] =
    useDisclosure(false);

  const triggerInstructionsModal = (
    callback: (instruction: string) => Promise<void>,
    title?: string
  ) => {
    setOnSubmitInstructions(() => callback);
    setInstructionsModalTitle(title || 'Instructions for generation');
    setInstructionsModalOpened.open();
  };

  const instructionsModal = (
    <Modal
      title={<span className="font-bold">{instructionsModalTitle}</span>}
      opened={instructionsModalOpened}
      onClose={() => {
        setInstructionsModalOpened.close();
        setInstructions('');
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitInstructions(instructions);
          setInstructionsModalOpened.close();
        }}
      >
        <Textarea
          label="Instructions (optional)"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
        <Button type="submit" mt="md">
          Generate
        </Button>
      </form>
    </Modal>
  );

  /* Personas */
  const [personaContext, setPersonaContext] = useState(
    'Tech salesperson in a startup with high pressure to perform.'
  );
  const [generatingPersonaNodes, setGeneratingPersonaNodes] = useState(false);

  /* Problems */
  const [problemContext, setProblemContext] = useState(
    'Tech salesperson struggles to find qualified leads at crowded conferences.'
  );
  const [generatingProblemNodes, setGeneratingProblemNodes] = useState(false);

  /* Solutions */
  const [solutionContext, setSolutionContext] = useState(
    'Solutions for tech conferences organizers to improve networking experience.'
  );
  const [generatingSolutionNodes, setGeneratingSolutionNodes] = useState(false);

  const [currentlySelecting, setCurrentlySelecting] = useState(false);
  const showSelectionTooltip = selectedNodes.length > 0 && !currentlySelecting;

  // Generate storyboard
  async function experiment() {
    const newNode: Node<StoryboardNodeData> = {
      id: `storyboard-${nanoid()}`,
      type: NodeType.Storyboard,
      position: rfCursorPosition,
      data: { variations: [], dimensions: [] }
    };
    swapCursorNode(newNode);
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
        // Viewport
        panOnScroll
        selectionOnDrag={!cursorNode}
        panOnDrag={false}
        selectionMode={SelectionMode.Partial}
        snapToGrid={true}
        defaultViewport={{
          x: 0,
          y: 0,
          zoom: 1
        }}
        minZoom={0.3}
        proOptions={{ hideAttribution: true }}
        // Click and drop nodes
        onPaneClick={placeCursorNode}
        onNodeClick={placeCursorNode}
        onMouseMove={(event) => {
          // Get cursor position directly for performance
          const position = updateRfCursorPosition(event);

          if (!cursorNode) return;
          updateCursorNodePosition(position);
        }}
        // Selection menu logic
        onSelectionStart={() => {
          setCurrentlySelecting(true);
        }}
        onSelectionEnd={() => {
          setCurrentlySelecting(false);
        }}
      >
        <Panel position="top-left" className="w-[500px] max-h-[90vh]">
          <div className="border border-slate-500 bg-white rounded-lg p-4">
            <Accordion>
              <Accordion.Item value="personas">
                <Accordion.Control>
                  <h3 className="font-bold text-md">Personas</h3>
                </Accordion.Control>
                <Accordion.Panel>
                  <div className="flex flex-col gap-6 py-2">
                    <Textarea
                      label="Persona context"
                      autosize={true}
                      minRows={2}
                      maxRows={4}
                      value={personaContext}
                      onChange={(event) =>
                        setPersonaContext(event.currentTarget.value)
                      }
                    />
                    <Button.Group>
                      <Button
                        className="w-full"
                        variant="outline"
                        loading={generatingPersonaNodes}
                        onClick={async () => {
                          if (generatingPersonaNodes) return;

                          triggerInstructionsModal(
                            async (instructions: string) => {
                              setGeneratingPersonaNodes(true);
                              await generatePersonaNodes(
                                personaContext + instructions
                              );
                              setGeneratingPersonaNodes(false);
                            },
                            'Instructions for persona generation'
                          );
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate personas
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add persona dimension
                      </Button>
                    </Button.Group>
                    <ScrollArea.Autosize mah={400}>
                      <div className="flex flex-col gap-4">
                        {personaDimensions.map((dimension) => (
                          <MultiSelect
                            key={dimension.id}
                            label={dimension.name}
                            description={dimension.description}
                            placeholder="Pin dimension"
                            data={dimension.values}
                            value={dimension.currentValues}
                            onChange={(value) =>
                              pinPersonaDimension(dimension.id, value)
                            }
                            withCheckIcon={true}
                            checkIconPosition="right"
                          />
                        ))}
                        {personaDimensions.length === 0 && (
                          <p className="text-sm">
                            No persona dimensions generated.
                          </p>
                        )}
                      </div>
                    </ScrollArea.Autosize>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="problems">
                <Accordion.Control>
                  <span className="font-bold text-md">Problems</span>
                </Accordion.Control>
                <Accordion.Panel>
                  <div className="flex flex-col gap-6 py-2">
                    <Textarea
                      label="Problem context"
                      autosize={true}
                      minRows={2}
                      maxRows={4}
                      value={problemContext}
                      onChange={(event) =>
                        setProblemContext(event.currentTarget.value)
                      }
                    />
                    <Button.Group>
                      <Button
                        className="w-full"
                        variant="outline"
                        loading={generatingProblemNodes}
                        onClick={async () => {
                          if (generatingProblemNodes) return;

                          triggerInstructionsModal(
                            async (instructions: string) => {
                              setGeneratingProblemNodes(true);
                              await generateProblemNodes(
                                personaContext + instructions,
                                []
                              );
                              setGeneratingProblemNodes(false);
                            },
                            'Instructions for problem generation'
                          );
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate problems
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add problem dimension
                      </Button>
                    </Button.Group>
                    <ScrollArea.Autosize mah={400}>
                      <div className="flex flex-col gap-4">
                        {problemDimensions.map((dimension) => (
                          <MultiSelect
                            key={dimension.id}
                            label={dimension.name}
                            description={dimension.description}
                            placeholder="Pin dimension"
                            data={dimension.values}
                            value={dimension.currentValues}
                            onChange={(value) =>
                              pinProblemDimension(dimension.id, value)
                            }
                            withCheckIcon={true}
                            checkIconPosition="right"
                          />
                        ))}
                        {problemDimensions.length === 0 && (
                          <p className="text-sm">
                            No problem dimensions generated.
                          </p>
                        )}
                      </div>
                    </ScrollArea.Autosize>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="solutions">
                <Accordion.Control>
                  <span className="font-bold text-md">Solutions</span>
                </Accordion.Control>
                <Accordion.Panel>
                  <div className="flex flex-col gap-6 py-2">
                    <Textarea
                      label="Solution context"
                      autosize={true}
                      minRows={2}
                      maxRows={4}
                      value={solutionContext}
                      onChange={(event) =>
                        setSolutionContext(event.currentTarget.value)
                      }
                    />
                    <Button.Group>
                      <Button
                        className="w-full"
                        variant="outline"
                        loading={generatingSolutionNodes}
                        onClick={async () => {
                          if (generatingSolutionNodes) return;

                          triggerInstructionsModal(
                            async (instructions: string) => {
                              setGeneratingSolutionNodes(true);
                              await generateSolutionNodes(
                                personaContext + instructions,
                                []
                              );
                              setGeneratingSolutionNodes(false);
                            },
                            'Instructions for solution generation'
                          );
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate solutions
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add solution dimension
                      </Button>
                    </Button.Group>
                    <ScrollArea.Autosize mah={400}>
                      <div className="flex flex-col gap-4">
                        {solutionDimensions.map((dimension) => (
                          <MultiSelect
                            key={dimension.id}
                            label={dimension.name}
                            description={dimension.description}
                            placeholder="Pin dimension"
                            data={dimension.values}
                            value={dimension.currentValues}
                            onChange={(value) =>
                              pinSolutionDimension(dimension.id, value)
                            }
                            withCheckIcon={true}
                            checkIconPosition="right"
                          />
                        ))}
                        {solutionDimensions.length === 0 && (
                          <p className="text-sm">
                            No solution dimensions generated.
                          </p>
                        )}
                      </div>
                    </ScrollArea.Autosize>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="storyboards">
                <Accordion.Control>
                  <span className="font-bold text-md">Storyboards</span>
                </Accordion.Control>
                <Accordion.Panel>
                  <div className="flex flex-col gap-6 py-2">
                    <Button.Group>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => experiment()}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate storyboard
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add storyboard dimension
                      </Button>
                    </Button.Group>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </div>
        </Panel>
        <Controls />
        <Background variant={BackgroundVariant.Dots} />
        {instructionsModal}
        {showSelectionTooltip && (
          <SelectionToolbar
            selectedNodes={selectedNodes}
            onMergePersonas={() =>
              triggerInstructionsModal(async (instruction) => {
                await mergePersonaNodes(
                  selectedPersonaNodes,
                  personaContext + instruction
                );
              })
            }
            onGenerateProblems={() =>
              triggerInstructionsModal(async (instruction) => {
                await generateProblemNodes(
                  problemContext + instruction,
                  selectedPersonaNodes.map((node) => node.id)
                );
              }, `Instructions for problem generation (${selectedPersonaNodes.length} personas selected)`)
            }
            onGenerateSolutions={() =>
              triggerInstructionsModal(async (instruction) => {
                await generateSolutionNodes(
                  solutionContext + instruction,
                  selectedProblemNodes.map((node) => node.id)
                );
              }, `Instructions for solution generation (${selectedProblemNodes.length} problems selected)`)
            }
          />
        )}
      </ReactFlow>
    </div>
  );
}
