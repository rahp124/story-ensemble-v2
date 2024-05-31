import { nanoid } from 'nanoid';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  SelectionMode,
  Panel,
  useReactFlow,
  getNodesBounds
  // getViewportForBounds
} from 'reactflow';
import 'reactflow/dist/style.css';
// import { toPng } from 'html-to-image';
import { EdgeType, NodeType, edgeTypes, nodeTypes } from './rf-components';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  //  useRef,
  useState
} from 'react';
import { Loader2 } from 'lucide-react';
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
import { SolutionNodeData, StoryboardNodeData } from './types';
import { ScrollArea, ScrollBar } from './components/ui/scroll-area';

export default function App() {
  const rf = useReactFlow();
  const {
    nodes,
    selectedNodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
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

  // Personas
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [personaContext, setPersonaContext] = useState(
    'Tech salesperson in a startup with high pressure to perform.'
  );

  const selectedPersonaNodes = selectedNodes.filter(
    (node) => node.type === NodeType.Persona
  );
  const selectedProblemNodes = selectedNodes.filter(
    (node) => node.type === NodeType.Problem
  );

  // Problems
  const [showProblemDialog, setShowProblemDialog] = useState(false);
  const [generatingProblems, setGeneratingProblems] = useState(false);
  const [problemContext, setProblemContext] = useState('');

  const ProblemNodeDimensions = {
    width: 400,
    height: 250
  };
  const handleGenerateProblems = async () => {
    if (generatingProblems) return;
    setGeneratingProblems(true);

    // const problems = await generateProblems(
    //   problemContext,
    //   selectedPersonaNodes.map((node) => node.data.persona)
    // );
    const problems: string[] = [];

    const padding = 20;

    const center = rf.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });
    const selectedPersonaBounds = getNodesBounds(selectedPersonaNodes);

    const totalWidth =
      problems.length * ProblemNodeDimensions.width +
      padding * (problems.length - 1);
    const xStart = selectedPersonaNodes.length
      ? selectedPersonaBounds.x +
        selectedPersonaBounds.width / 2 -
        totalWidth / 2
      : center.x - totalWidth / 2;
    const y = selectedPersonaNodes.length
      ? selectedPersonaBounds.y + selectedPersonaBounds.height + 200
      : center.y - ProblemNodeDimensions.height / 2;

    const newProblemNodes: Node[] = problems.map((problem, idx) => {
      const id = `problem-${nanoid()}`;
      const position = {
        x: xStart + idx * (ProblemNodeDimensions.width + padding),
        y
      };

      return {
        id,
        type: NodeType.Problem,
        position,
        data: { problem },
        style: ProblemNodeDimensions
      };
    });

    // create nodes
    setNodes([...nodes, ...newProblemNodes]);

    // create edges
    const newEdges: Edge[] = [];
    for (const persona of selectedPersonaNodes) {
      for (const problem of newProblemNodes) {
        newEdges.push({
          id: `edge-${nanoid()}`,
          source: persona.id,
          target: problem.id,
          type: EdgeType.Context
        });
      }
    }
    setEdges([...edges, ...newEdges]);

    setGeneratingProblems(false);
    setProblemContext('');
  };

  // Solutions
  const [showSolutionDialog, setShowSolutionDialog] = useState(false);
  const [generatingSolutions, setGeneratingSolutions] = useState(false);
  const [solutionContext, setSolutionContext] = useState('');

  const SolutionNodeDimensions = {
    width: 400,
    height: 250
  };
  const handleGenerateSolutions = async () => {
    if (generatingSolutions) return;
    setGeneratingSolutions(true);

    const solutions = await generateSolutionNodes([], solutionContext);
    const padding = 20;
    const center = rf.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });
    const selectedProblemBounds = getNodesBounds(selectedProblemNodes);
    const totalWidth =
      solutions.length * SolutionNodeDimensions.width +
      padding * (solutions.length - 1);
    const xStart = selectedProblemNodes.length
      ? selectedProblemBounds.x +
        selectedProblemBounds.width / 2 -
        totalWidth / 2
      : center.x - totalWidth / 2;
    const y = selectedProblemNodes.length
      ? selectedProblemBounds.y + selectedProblemBounds.height + 200
      : center.y - SolutionNodeDimensions.height / 2;
    const newSolutionNodes: Node<SolutionNodeData>[] = solutions.map(
      (solution, idx) => {
        const position = {
          x: xStart + idx * (SolutionNodeDimensions.width + padding),
          y
        };
        return {
          id: `solution-${nanoid()}`,
          type: NodeType.Solution,
          position,
          data: { solution, dimensions: [] },
          style: SolutionNodeDimensions
        };
      }
    );
    // create nodes
    setNodes([...nodes, ...newSolutionNodes]);
    // create edges
    // const newEdges: Edge[] = [];
    // for (const problem of selectedProblemNodes) {
    //   for (const solution of newSolutionNodes) {
    //     newEdges.push({
    //       id: `edge-${nanoid()}`,
    //       source: problem.id,
    //       target: solution.id,
    //       type: EdgeType.Context
    //     });
    //   }
    // }
    // setEdges([...edges, ...newEdges]);
    setGeneratingSolutions(false);
    setSolutionContext('');
  };

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
        <Panel position="top-left">
          <div className="flex flex-col gap-2 p-1">
            <Button
              variant="outline"
              onClick={() => setShowPersonaDialog(true)}
            >
              Personas
            </Button>
            <Button
              variant="outline"
              disabled={generatingProblems}
              onClick={() => setShowProblemDialog(true)}
            >
              Problems
              {generatingProblems && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
            </Button>
            <Button
              variant="outline"
              disabled={generatingSolutions}
              onClick={() => setShowSolutionDialog(true)}
            >
              Solutions
              {generatingSolutions && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
            </Button>
            <Button variant="outline" onClick={() => experiment()}>
              Storyboards
            </Button>
          </div>
        </Panel>
        <Panel position="top-right" className="w-[85vw]">
          <div className="flex items-center gap-2">
            <h3 className="whitespace-nowrap">Persona dimensions:</h3>
            <ScrollArea>
              <div className="flex items-center gap-2 py-4">
                {personaDimensions.map((dimension) => (
                  <div key={dimension.name}>
                    <select className="border border-black rounded-md px-1 py-2">
                      <option>{dimension.name}</option>
                      {dimension.values.map((value) => (
                        <option key={value}>{value}</option>
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
                  <div key={dimension.name}>
                    <select className="border border-black rounded-md px-1 py-2">
                      <option>{dimension.name}</option>
                      {dimension.values.map((value) => (
                        <option key={value}>{value}</option>
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
                  <div key={dimension.name}>
                    <select className="border border-black rounded-md px-1 py-2">
                      <option>{dimension.name}</option>
                      {dimension.values.map((value) => (
                        <option key={value}>{value}</option>
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
                handleGenerateProblems();
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
                handleGenerateSolutions();
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
