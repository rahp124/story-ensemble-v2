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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import SelectionToolbar from './components/SelectionToolbar';

import { useStore } from './store';
import { useRfCursorPosition } from './lib/useRfCursorPosition';
import { StoryboardNodeData } from './types';
import { ScrollArea, ScrollBar } from './components/ui/scroll-area';

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
    generatePersonaNodes,
    problemDimensions,
    generateProblemNodes,
    solutionDimensions,
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

  // Personas
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [personaContext, setPersonaContext] = useState(
    'Tech salesperson in a startup with high pressure to perform.'
  );

  // Problems
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [problemContext, setProblemContext] = useState(
    'Tech salesperson struggles to find qualified leads at crowded conferences.'
  );

  // Solutions
  const [showSolutionDialog, setShowSolutionDialog] = useState(false);
  const [solutionContext, setSolutionContext] = useState(
    'Solutions for tech conferences organizers to improve networking experience.'
  );

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
        <Panel position="top-center" className="w-[100vw] m-0 p-2">
          <div className="w-full bg-slate-300 p-4 rounded-lg flex gap-8 opacity-80">
            <div className="w-[20%] flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPersonaDialog(true)}
              >
                Personas
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowProblemDialog(true)}
              >
                Problems
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSolutionDialog(true)}
              >
                Solutions
              </Button>
              <Button variant="outline" onClick={() => experiment()}>
                Storyboards
              </Button>
            </div>
            <div className="w-[80%]">
              <div className="flex items-center gap-2">
                <h3 className="whitespace-nowrap">Persona dimensions:</h3>
                <ScrollArea>
                  <div className="flex items-center gap-2 py-4">
                    {personaDimensions.map((dimension) => (
                      <div>
                        <select className="border border-black rounded-md px-1 py-2">
                          <option>{dimension.name}</option>
                          {dimension.values.map((value) => (
                            <option>{value}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {personaDimensions.length === 0 && (
                      <p>Generate personas to explore dimensions</p>
                    )}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="whitespace-nowrap">Problem dimensions:</h3>
                <ScrollArea>
                  <div className="flex items-center gap-2 py-4">
                    {problemDimensions.map((dimension) => (
                      <div>
                        <select className="border border-black rounded-md px-1 py-2">
                          <option>{dimension.name}</option>
                          {dimension.values.map((value) => (
                            <option>{value}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {problemDimensions.length === 0 && (
                      <p>Generate problems to explore dimensions</p>
                    )}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
              <div className="flex items-center gap-2">
                <h3 className="whitespace-nowrap">Solution dimensions:</h3>
                <ScrollArea>
                  <div className="flex items-center gap-2 py-4">
                    {solutionDimensions.map((dimension) => (
                      <div>
                        <select className="border border-black rounded-md px-1 py-2">
                          <option>{dimension.name}</option>
                          {dimension.values.map((value) => (
                            <option>{value}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {solutionDimensions.length === 0 && (
                      <p>Generate solutions to explore dimensions</p>
                    )}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>
          </div>
        </Panel>
        <Controls />
        {/* <MiniMap /> */}
        <Background variant={BackgroundVariant.Dots} />
        <Dialog open={showPersonaDialog} onOpenChange={setShowPersonaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate personas</DialogTitle>
              <DialogDescription>
                Please specify a context to generate personas
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowPersonaDialog(false);
                generatePersonaNodes(personaContext);
                // handleGeneratePersonas();
              }}
            >
              <Textarea
                placeholder="Please enter context..."
                value={personaContext}
                onChange={(e) => setPersonaContext(e.target.value)}
              />
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
                <Button type="submit">Generate</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={showProblemDialog} onOpenChange={setShowProblemDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate problem statements</DialogTitle>
            </DialogHeader>
            {selectedPersonaNodes.length > 0 && (
              <p>
                Generating problem statements for{' '}
                <b>{selectedPersonaNodes.length}</b> selected personas.
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowProblemDialog(false);
                generateProblemNodes(
                  problemContext,
                  selectedPersonaNodes.map((node) => node.id)
                );
              }}
            >
              <Textarea
                placeholder="Please enter context..."
                value={problemContext}
                onChange={(e) => setProblemContext(e.target.value)}
              />
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
                <Button type="submit">Generate problem statements</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={showSolutionDialog} onOpenChange={setShowSolutionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate solutions</DialogTitle>
            </DialogHeader>
            {selectedProblemNodes.length > 0 && (
              <p>
                Generating solutions for <b>{selectedProblemNodes.length}</b>{' '}
                selected problems.
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowSolutionDialog(false);
                generateSolutionNodes(
                  solutionContext,
                  selectedProblemNodes.map((node) => node.id)
                );
              }}
            >
              <Textarea
                placeholder="Please enter context..."
                value={solutionContext}
                onChange={(e) => setSolutionContext(e.target.value)}
              />
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4">
                <Button type="submit">Generate solutions</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        {showSelectionTooltip && (
          <SelectionToolbar
            selectedNodes={selectedNodes}
            onGenerateProblems={() => setShowProblemDialog(true)}
            onGenerateSolutions={() => setShowSolutionDialog(true)}
          />
        )}
      </ReactFlow>
    </div>
  );
}
