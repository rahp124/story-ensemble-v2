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
  useReactFlow,
  getNodesBounds
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeType, nodeTypes } from './nodes';
import { editPersonas, generatePersonas } from './api/personas';
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
import SelectionToolbar from './components/SelectionToolbar';
import { useSelectedNodes } from './lib/useSelectedNodes';

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

  // Select Menu
  const [showSelectionTooltip, setShowSelectionTooltip] = useState(false);

  const handleGeneratePersonas = async () => {
    if (generatingPersonas) return;

    setGeneratingPersonas(true);

    const { personas } = await generatePersonas(personaContext);
    // const personas = [
    //   {
    //     Persona: {
    //       Name: 'Linda Martinez',
    //       Age: 32,
    //       Gender: 'Female',
    //       Occupation: 'Part-time Customer Service Representative',
    //       Education: 'Some College',
    //       IncomeLevel: 'Low',
    //       Location: 'Urban',
    //       FamilyStatus: 'Single Parent'
    //     },
    //     Psychographics: {
    //       PersonalityTraits: ['Resourceful', 'Optimistic', 'Frugal'],
    //       Values: ['Family', 'Health', 'Economy'],
    //       Interests: ['Cooking', 'Nutrition', 'Budgeting']
    //     },
    //     Environment: {
    //       Physical: 'Small apartment in a densely populated area',
    //       Social: 'Close-knit community, supports each other'
    //     },
    //     BehavioralPatterns: {
    //       DailyRoutines: [
    //         'Prepares meals for her children',
    //         'Works part-time from home',
    //         'Homework assistance in the evening'
    //       ],
    //       TechInteraction: [
    //         'Uses smartphone for social media',
    //         'Searches for recipes online',
    //         'Online grocery shopping'
    //       ]
    //     },
    //     NeedsAndChallenges: {
    //       Needs: [
    //         'Affordable healthy meal options',
    //         'Quick and easy recipes',
    //         'Meal plans that cater to children’s tastes'
    //       ],
    //       Challenges: [
    //         'Limited budget',
    //         'Lack of time due to work and parenting',
    //         'Limited access to fresh produce in urban area'
    //       ]
    //     },
    //     UsageContext: {
    //       ProductUse:
    //         'Interested in meal kits as a way to save time and introduce variety into family meals at an affordable price',
    //       UseInfluencers: [
    //         'Social Media',
    //         'Friends and family recommendations',
    //         'Online reviews'
    //       ]
    //     },
    //     TechnologyProficiency: {
    //       ComfortLevel: 'Medium',
    //       PreferredDevices: ['Smartphone', 'Laptop']
    //     },
    //     InformationConsumption: {
    //       PreferredSources: [
    //         'Social Media',
    //         'Food Blogs',
    //         'Parenting Websites'
    //       ],
    //       MediaConsumption: [
    //         'Video recipes',
    //         'Budgeting podcasts',
    //         'Nutrition articles'
    //       ]
    //     },
    //     AdditionalMetadata: {
    //       Note: 'Values family time and prefers to cook meals at home to save money and ensure the healthiness of meals.'
    //     }
    //   },
    //   {
    //     Persona: {
    //       Name: 'John Thompson',
    //       Age: 45,
    //       Gender: 'Male',
    //       Occupation: 'Warehouse Worker',
    //       Education: 'High School',
    //       IncomeLevel: 'Low',
    //       Location: 'Rural',
    //       FamilyStatus: 'Married with three children'
    //     },
    //     Psychographics: {
    //       PersonalityTraits: ['Hardworking', 'Practical', 'Family-oriented'],
    //       Values: ['Simplicity', 'Sustainability', 'Self-sufficiency'],
    //       Interests: ['Gardening', 'DIY Projects', 'Outdoors']
    //     },
    //     Environment: {
    //       Physical: 'Family home with a small garden',
    //       Social: 'Rural community, limited access to services'
    //     },
    //     BehavioralPatterns: {
    //       DailyRoutines: [
    //         'Works early shifts',
    //         'Family time in the evening',
    //         'Weekend gardening with the family'
    //       ],
    //       TechInteraction: ['Basic internet use', 'Email', 'Navigation apps']
    //     },
    //     NeedsAndChallenges: {
    //       Needs: [
    //         'Cost-effective meal solutions',
    //         'Meal kits that can accommodate a large family',
    //         'Simple recipes with minimal preparation time'
    //       ],
    //       Challenges: [
    //         'Fixed income with little flexibility for additional expenses',
    //         'Rural location limits access to varied grocery items',
    //         'Balancing work and family time'
    //       ]
    //     },
    //     UsageContext: {
    //       ProductUse:
    //         'Seeks meal kits to reduce meal planning time and introduce new foods to family within a tight budget',
    //       UseInfluencers: [
    //         'Community forums',
    //         'Local newspaper',
    //         'Co-worker recommendations'
    //       ]
    //     },
    //     TechnologyProficiency: {
    //       ComfortLevel: 'Low',
    //       PreferredDevices: ['Smartphone']
    //     },
    //     InformationConsumption: {
    //       PreferredSources: [
    //         'Local news',
    //         'Mail flyers',
    //         'Community center bulletin boards'
    //       ],
    //       MediaConsumption: ['Radio', 'Printed newspapers', 'TV news']
    //     },
    //     AdditionalMetadata: {
    //       Note: 'Enjoys family activities and is looking for convenient ways to provide nutritious meals within a tight budget.'
    //     }
    //   }
    // ];

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
    setPersonaContext('');
  };

  const { selectedNodes } = useSelectedNodes();
  const handleOnSelectEnd = (event: React.MouseEvent) => {
    event.preventDefault();

    setShowSelectionTooltip(selectedNodes.length > 0);
  };
  const handleEditPersonas = async () => {
    const personasToEdit = selectedNodes
      .filter((node) => node.type === NodeType.Persona)
      .map((node) => node.data.persona);
    console.log(personasToEdit);

    // api call
    const { personas: updatedPersonas } = await editPersonas(
      personasToEdit,
      'Give the personas full names; all personas should have medium technology proficiency'
    );

    const padding = 20;
    const rect = getNodesBounds(selectedNodes);

    const totalWidth =
      updatedPersonas.length * PersonaNodeDimensions.width +
      padding * (updatedPersonas.length - 1);
    const xStart = rect.x + rect.width / 2 - totalWidth / 2;
    const yStart = rect.y + rect.height + padding;

    const newPersonaNodes: Node[] = updatedPersonas.map((persona, idx) => {
      const id = `persona-${nanoid()}`;
      const position = {
        x: xStart + idx * (PersonaNodeDimensions.width + padding),
        y: yStart
      };

      return {
        id,
        type: NodeType.Persona,
        position,
        data: { persona }
      };
    });

    setNodes((nodes) => [...nodes, ...newPersonaNodes]);
  };

  return (
    <div className="h-[100vh] w-[100vw]">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionEnd={handleOnSelectEnd}
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
        {showSelectionTooltip && (
          <SelectionToolbar
            selectedNodes={selectedNodes}
            onEditPersonas={handleEditPersonas}
          />
        )}
      </ReactFlow>
    </div>
  );
}
