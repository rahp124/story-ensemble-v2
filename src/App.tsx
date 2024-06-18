import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  SelectionMode,
  Panel,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeType, edgeTypes, nodeTypes } from './rf-components';
import { useEffect, useState } from 'react';
import SelectionToolbar from './components/SelectionToolbar';

import { useStore } from './store';
import { useRfCursorPosition } from './lib/useRfCursorPosition';
import { ImageIcon, ImageOff, Plus } from 'lucide-react';
import {
  Accordion,
  Button,
  Modal,
  MultiSelect,
  ScrollArea,
  Switch,
  Textarea
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PersonaNodeData, ProblemNodeData } from './types';

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
    updateCursorNodePosition,
    placeCursorNode,
    globalShowImage,
    setGlobalShowImage,
    personaDimensions,
    pinPersonaDimension,
    generatePersonaDimensions,
    generatePersonaNodes,
    mergePersonaNodes,
    problemDimensions,
    pinProblemDimension,
    generateProblemDimensions,
    generateProblemNodes,
    solutionDimensions,
    pinSolutionDimension,
    generateSolutionDimensions,
    generateSolutionNodes,
    storyboardDimensions,
    generateStoryboardDimensions,
    generateStoryboardNode,
    pinStoryboardDimension
  } = useStore();
  const { undo, redo } = useStore.temporal.getState();

  useEffect(() => {
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.key === 'z') {
        undo();
      }
      if (event.ctrlKey && event.key === 'y') {
        redo();
      }
    });
  });

  const { updateRfCursorPosition } = useRfCursorPosition();

  const selectedPersonaNodes: Node<PersonaNodeData>[] = selectedNodes.filter(
    (node) => node.type === NodeType.Persona
  );
  const selectedProblemNodes: Node<ProblemNodeData>[] = selectedNodes.filter(
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
    'Tech salesperson responsible for finding leads and making sales at in-person events.'
  );
  const [generatingPersonaNodes, setGeneratingPersonaNodes] = useState(false);
  const [generatingPersonaDimensions, setGeneratingPersonaDimensions] =
    useState(false);

  /* Problems */
  const [problemContext, setProblemContext] = useState(
    'Tech salesperson struggles to find qualified leads at crowded conferences.'
  );
  const [generatingProblemNodes, setGeneratingProblemNodes] = useState(false);
  const [generatingProblemDimensions, setGeneratingProblemDimensions] =
    useState(false);

  /* Solutions */
  const [solutionContext, setSolutionContext] = useState(
    'Solutions for tech conferences organizers to improve networking experience.'
  );
  const [generatingSolutionNodes, setGeneratingSolutionNodes] = useState(false);
  const [generatingSolutionDimensions, setGeneratingSolutionDimensions] =
    useState(false);

  /* Storyboard */
  const [storyboardContext, setStoryboardContext] =
    useState(`Problem: Tech salesperson struggles to find qualified leads at crowded conferences.

Solution: Solutions for tech conferences organizers to improve networking experience.
Organizers create an event engagement app that encourages people to register to connect at in-person events.

Storyboard Outline: Salesperson is overwhelmed by the conference. Registers for the app. Makes meaningful connections leading to sales.`);
  const [generatingStoryboardDimensions, setGeneratingStoryboardDimensions] =
    useState(false);
  const [generatingStoryboardNodes, setGeneratingStoryboardNodes] =
    useState(false);

  const [currentlySelecting, setCurrentlySelecting] = useState(false);
  const showSelectionTooltip = selectedNodes.length > 0 && !currentlySelecting;

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
          <div className="border border-slate-500 bg-white rounded-lg p-0.5">
            <div className="flex justify-between items-center px-4 py-2">
              {' '}
              <h3 className="font-bold text-md">StoryEnsemble</h3>
              <Switch
                size="sm"
                checked={globalShowImage}
                onChange={(event) =>
                  setGlobalShowImage(event.currentTarget.checked)
                }
                onLabel={<ImageIcon className="w-3 h-3" />}
                offLabel={<ImageOff className="w-3 h-3" />}
              />
            </div>
            <Accordion>
              <Accordion.Item value="personas">
                <Accordion.Control>
                  <h3 className="font-bold text-sm">Personas</h3>
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
                        variant="outline"
                        className="w-full"
                        loading={generatingPersonaDimensions}
                        onClick={async () => {
                          if (generatingPersonaDimensions) return;

                          setGeneratingPersonaDimensions(true);
                          await generatePersonaDimensions(personaContext);
                          setGeneratingPersonaDimensions(false);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Persona dimensions
                      </Button>
                      {personaDimensions.length > 0 && (
                        <Button
                          className="w-full"
                          variant="outline"
                          loading={generatingPersonaNodes}
                          onClick={async () => {
                            if (generatingPersonaNodes) return;

                            setGeneratingPersonaNodes(true);
                            await generatePersonaNodes(personaContext);
                            setGeneratingPersonaNodes(false);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Personas
                        </Button>
                      )}
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
                      </div>
                    </ScrollArea.Autosize>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="problems">
                <Accordion.Control>
                  <span className="font-bold text-sm">Problems</span>
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
                        variant="outline"
                        className="w-full"
                        loading={generatingProblemDimensions}
                        onClick={async () => {
                          if (generatingProblemDimensions) return;

                          setGeneratingProblemDimensions(true);
                          await generateProblemDimensions(problemContext);
                          setGeneratingProblemDimensions(false);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Problem dimensions
                      </Button>
                      {problemDimensions.length > 0 && (
                        <Button
                          className="w-full"
                          variant="outline"
                          loading={generatingProblemNodes}
                          onClick={async () => {
                            if (generatingProblemNodes) return;

                            setGeneratingProblemNodes(true);
                            await generateProblemNodes(personaContext, []);
                            setGeneratingProblemNodes(false);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Problems
                        </Button>
                      )}
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
                      </div>
                    </ScrollArea.Autosize>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="solutions">
                <Accordion.Control>
                  <span className="font-bold text-sm">Solutions</span>
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
                        variant="outline"
                        className="w-full"
                        loading={generatingSolutionDimensions}
                        onClick={async () => {
                          if (generatingSolutionDimensions) return;

                          setGeneratingSolutionDimensions(true);
                          await generateSolutionDimensions(solutionContext);
                          setGeneratingSolutionDimensions(false);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Solution dimensions
                      </Button>
                      {solutionDimensions.length > 0 && (
                        <Button
                          className="w-full"
                          variant="outline"
                          loading={generatingSolutionNodes}
                          onClick={async () => {
                            if (generatingSolutionNodes) return;

                            setGeneratingSolutionNodes(true);
                            await generateSolutionNodes(solutionContext, []);
                            setGeneratingSolutionNodes(false);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Solutions
                        </Button>
                      )}
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
                      </div>
                    </ScrollArea.Autosize>
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="storyboards" className="border-none">
                <Accordion.Control>
                  <span className="font-bold text-sm">Storyboards</span>
                </Accordion.Control>
                <Accordion.Panel>
                  <div className="flex flex-col gap-6 py-2">
                    <Textarea
                      label="Storyboard context"
                      autosize={true}
                      minRows={2}
                      maxRows={4}
                      value={storyboardContext}
                      onChange={(event) =>
                        setStoryboardContext(event.currentTarget.value)
                      }
                    />
                    <Button.Group>
                      <Button
                        className="w-full"
                        variant="outline"
                        loading={generatingStoryboardDimensions}
                        onClick={async () => {
                          if (generatingStoryboardDimensions) return;

                          triggerInstructionsModal(
                            async (instructions: string) => {
                              setGeneratingStoryboardDimensions(true);
                              await generateStoryboardDimensions(
                                personaContext + instructions
                              );
                              setGeneratingStoryboardDimensions(false);
                            },
                            'Instructions for storyboard dimension generation'
                          );
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Storyboard dimensions
                      </Button>
                      <Button
                        className="w-full"
                        variant="outline"
                        loading={generatingStoryboardNodes}
                        onClick={async () => {
                          if (generatingStoryboardNodes) return;

                          triggerInstructionsModal(
                            async (instructions: string) => {
                              setGeneratingStoryboardNodes(true);
                              await generateStoryboardNode(
                                storyboardContext + instructions,
                                [],
                                [],
                                []
                              );
                              setGeneratingStoryboardNodes(false);
                            },
                            'Instructions for storyboard generation'
                          );
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Generate storyboards
                      </Button>
                    </Button.Group>
                    <ScrollArea.Autosize mah={400}>
                      <div className="flex flex-col gap-4">
                        {storyboardDimensions.map((dimension) => (
                          <MultiSelect
                            key={dimension.id}
                            label={dimension.name}
                            description={dimension.description}
                            placeholder="Pin dimension"
                            data={dimension.values}
                            value={dimension.currentValues}
                            onChange={(value) =>
                              pinStoryboardDimension(dimension.id, value)
                            }
                            withCheckIcon={true}
                            checkIconPosition="right"
                          />
                        ))}
                        {storyboardDimensions.length === 0 && (
                          <p className="text-sm">
                            No storyboard dimensions generated.
                          </p>
                        )}
                      </div>
                    </ScrollArea.Autosize>
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
                const personaContext = selectedPersonaNodes
                  .map((node) => node.data.persona)
                  .join('\n');

                const context = `${personaContext}\n\n${problemContext}\n\n${instruction}`;

                await generateProblemNodes(
                  context,
                  selectedPersonaNodes.map((node) => node.id)
                );
              }, `Instructions for problem generation (${selectedPersonaNodes.length} personas selected)`)
            }
            onGenerateSolutions={() =>
              triggerInstructionsModal(async (instruction) => {
                const problemContext = selectedProblemNodes
                  .map((node) => node.data.problem)
                  .join('\n');

                const context = `${problemContext}\n\n${solutionContext}\n\n${instruction}`;

                await generateSolutionNodes(
                  context,
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
