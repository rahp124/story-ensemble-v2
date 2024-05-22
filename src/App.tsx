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
import { generatePersonas } from './api/personas';
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
import { generateProblems } from './api/problems';
import { generateSolutions } from './api/solutions';
// import { PersonaNodeData } from './rf-components/PersonaNode';
// import { generateImageFromSketch } from './api/stableDiffusion';
// import { blobToDataUrl } from './lib/blobToDataUrl';

import { useStore } from './store';
import { useRfCursorPosition } from './lib/useRfCursorPosition';
import { StoryboardNodeData } from './rf-components/StoryboardNode';
import { ProblemNodeData } from './rf-components/ProblemNode';
import { SolutionNodeData } from './rf-components/SolutionNode';

const PersonaNodeDimensions = {
  width: 400,
  height: 500
};

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
    placeCursorNode
  } = useStore();
  const { rfCursorPosition, updateRfCursorPosition } = useRfCursorPosition();

  // Persona Dialog
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [generatingPersonas, setGeneratingPersonas] = useState(false);
  const [personaContext, setPersonaContext] = useState(
    'Meal kits for low income rural families'
  );

  // Select Menu

  const handleGeneratePersonas = async () => {
    if (generatingPersonas) return;

    setGeneratingPersonas(true);

    const { personas } = await generatePersonas(personaContext);

    const center = rf.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    const padding = 20;

    const totalWidth =
      personas.length * PersonaNodeDimensions.width +
      padding * (personas.length - 1);
    const xStart = center.x - totalWidth / 2;
    // const totalHeight =
    //   personas.length * PersonaNodeDimensions.height +
    //   padding * (personas.length - 1);
    // const yStart = center.y - totalHeight / 2;

    const newPersonaNodes: Node[] = personas.map((persona, idx) => {
      const id = `persona-${nanoid()}`;
      const position = {
        // x: center.x - PersonaNodeDimensions.width / 2,
        // y: yStart + idx * (PersonaNodeDimensions.height + padding)
        x: xStart + idx * (PersonaNodeDimensions.width + padding),
        y: center.y - PersonaNodeDimensions.height / 2
      };

      return {
        id,
        type: NodeType.Persona,
        position,
        data: { persona },
        style: PersonaNodeDimensions
      };
    });
    setNodes([...nodes, ...newPersonaNodes]);

    // TODO generate images and update nodes

    setGeneratingPersonas(false);
    setPersonaContext('');
  };

  const selectedPersonaNodes = selectedNodes.filter(
    (node) => node.type === NodeType.Persona
  );
  const selectedProblemNodes = selectedNodes.filter(
    (node) => node.type === NodeType.Problem
  );

  // Problem Dialog
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

    const problems = await generateProblems(
      problemContext,
      selectedPersonaNodes.map((node) => node.data.persona)
    );

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

  // Solution Dialog
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
    //
    const solutions = await generateSolutions(
      solutionContext,
      selectedProblemNodes.map((node) => node.data.problem)
    );

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

    const newSolutionNodes: Node[] = solutions.map((solution, idx) => {
      const id = `solution-${nanoid()}`;
      const position = {
        x: xStart + idx * (SolutionNodeDimensions.width + padding),
        y
      };

      return {
        id,
        type: NodeType.Solution,
        position,
        data: { solution },
        style: SolutionNodeDimensions
      };
    });

    // create nodes
    setNodes([...nodes, ...newSolutionNodes]);

    // create edges
    const newEdges: Edge[] = [];
    for (const problem of selectedProblemNodes) {
      for (const solution of newSolutionNodes) {
        newEdges.push({
          id: `edge-${nanoid()}`,
          source: problem.id,
          target: solution.id,
          type: EdgeType.Context
        });
      }
    }
    setEdges([...edges, ...newEdges]);

    setGeneratingSolutions(false);
    setSolutionContext('');
  };

  const [currentlySelecting, setCurrentlySelecting] = useState(false);
  const showSelectionTooltip = selectedNodes.length > 0 && !currentlySelecting;

  // const imageInputRef = useRef<HTMLInputElement>(null);

  // const handleCreativeUpscale = async () => {
  //   const textNodes = selectedNodes.filter(
  //     (node) => node.type === NodeType.Text
  //   );
  //   const imageNodes = selectedNodes.filter(
  //     (node) => node.type === NodeType.Image
  //   );

  //   const textContent = textNodes.map((node) => node.data.text).join('\n');
  //   const prompt = `Generate an image that depicts ${textContent}`;

  //   const nodesBounds = getNodesBounds(imageNodes);
  //   const { width, height } = nodesBounds;
  //   const viewport = getViewportForBounds(nodesBounds, width, height, 0.5, 2);

  //   const viewportElement = document.querySelector(
  //     '.react-flow__viewport'
  //   ) as HTMLElement;
  //   const dataUrl = await toPng(viewportElement, {
  //     width,
  //     height,
  //     style: {
  //       width: String(width),
  //       height: String(height),
  //       transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
  //     },
  //     filter: (node) => {
  //       if (
  //         node.classList &&
  //         node.classList.contains('react-flow__resize-control')
  //       ) {
  //         return false;
  //       }
  //       return true;
  //     }
  //   });

  //   const dataBlob = await fetch(dataUrl).then((res) => res.blob());
  //   const generatedDataUrl = await generateImageFromSketch(dataBlob, prompt);

  //   createCursorImageNode(generatedDataUrl);
  // };

  // const createCursorImageNode = (src: string) => {
  //   const newCursorNode: Node<{ src: string }> = {
  //     id: `text-${nanoid()}`,
  //     type: NodeType.Image,
  //     position: rfCursorPosition,
  //     data: {
  //       src
  //     },
  //     style: {
  //       width: 100
  //     }
  //   };
  //   swapCursorNode(newCursorNode);
  // };

  async function experiment() {
    const newNode: Node<StoryboardNodeData> = {
      id: `storyboard-${nanoid()}`,
      type: NodeType.Storyboard,
      position: rfCursorPosition,
      data: { variations: [] }
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
            {/* <Button
              variant="outline"
              onClick={() => {
                const newCursorNode: Node<PersonaNodeData> = {
                  id: `persona-${nanoid()}`,
                  type: NodeType.Persona,
                  position: rfCursorPosition,
                  data: {}
                };
                swapCursorNode(newCursorNode);
              }}
            >
              Persona
            </Button> */}
            <Button
              variant="outline"
              onClick={() => {
                const newCursorNode: Node<{ text: string }> = {
                  id: `text-${nanoid()}`,
                  type: NodeType.Text,
                  position: rfCursorPosition,
                  data: {
                    text: '<p>Placeholder</p>'
                  }
                };
                swapCursorNode(newCursorNode);
              }}
            >
              Text
            </Button>
            {/*
            <Button
              variant="outline"
              onClick={() => imageInputRef.current!.click()}
              // onClick={() => createCursorImageNode('/peep-standing-1.png')}
            >
              Image
            </Button>
            <input
              className="hidden"
              type="file"
              ref={imageInputRef}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                const dataUrl = await blobToDataUrl(file);
                createCursorImageNode(dataUrl);
              }}
            /> */}
            <Button
              variant="outline"
              onClick={() => {
                const newCursorNode: Node<ProblemNodeData> = {
                  id: `problem-${nanoid()}`,
                  type: NodeType.Problem,
                  position: rfCursorPosition,
                  data: {
                    problem: ''
                  }
                };
                swapCursorNode(newCursorNode);
              }}
            >
              Problem
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const newCursorNode: Node<SolutionNodeData> = {
                  id: `solution-${nanoid()}`,
                  type: NodeType.Solution,
                  position: rfCursorPosition,
                  data: {
                    solution: ''
                  }
                };
                swapCursorNode(newCursorNode);
              }}
            >
              Solution
            </Button>
            <Button
              variant="outline"
              disabled={generatingPersonas}
              onClick={() => setShowPersonaDialog(true)}
            >
              Personas
              {generatingPersonas && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
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
                handleGeneratePersonas();
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
