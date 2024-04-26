import { nanoid } from 'nanoid';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  Node,
  MiniMap,
  SelectionMode,
  useEdgesState,
  useNodesState,
  Panel,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeType, nodeTypes } from './nodes';
import { generatePersonas } from './api/personas';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { PersonaNodeDimensions } from './nodes/PersonaNode';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function App() {
  const rf = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // const onConnect = (connection: Connection) => {
  //   setEdges((eds) => addEdge(connection, eds));
  // };

  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [generatingPersonas, setGeneratingPersonas] = useState(false);
  const [personaContext, setPersonaContext] = useState('');

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

    const newPersonaNodes: Node[] = personas.map((persona, idx) => {
      const id = `persona-${nanoid()}`;
      const position = {
        x: xStart + idx * (PersonaNodeDimensions.width + padding),
        y: center.y - PersonaNodeDimensions.height / 2
      };

      return {
        id,
        type: NodeType.Persona,
        position,
        data: { persona }
      };
    });
    setNodes((nodes) => [...nodes, ...newPersonaNodes]);

    // TODO generate images and update nodes

    setGeneratingPersonas(false);
  };

  return (
    <div className="h-[100vh] w-[100vw]">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // onConnect={onConnect}
        // Figma viewport controls
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectionMode={SelectionMode.Partial}
        snapToGrid={true}
      >
        <Panel position="top-center">
          <h2 className="text-center font-bold">Generate</h2>
          <div className="flex items-center gap-2 p-1">
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

            <Button variant="outline">Problems</Button>
            <Button variant="outline">Solutions</Button>
            <Button variant="outline">Storyboards</Button>
          </div>
        </Panel>
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} />
        <Dialog open={showPersonaDialog} onOpenChange={setShowPersonaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Personas</DialogTitle>
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
      </ReactFlow>
    </div>
  );
}
