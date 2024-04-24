import ReactFlow, {
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  Node,
  MiniMap,
  SelectionMode,
  addEdge,
  useEdgesState,
  useNodesState,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeType, nodeTypes } from './nodes';
import { Persona, generatePersonas } from './api/personas';

const persona: Persona = {
  Persona: {
    Name: 'Eva Thompson',
    Age: 32,
    Gender: 'Female',
    Occupation: 'Part-time retail worker',
    Education: 'Some college',
    IncomeLevel: 'Low',
    Location: 'Urban',
    FamilyStatus: 'Single mother of two'
  },
  Psychographics: {
    PersonalityTraits: ['Resourceful', 'Pragmatic', 'Patient'],
    Values: ['Family', 'Economy', 'Health'],
    Interests: ['Cooking', 'Parenting blogs', 'Budgeting']
  },
  Environment: {
    Physical: 'Small city apartment',
    Social: 'Supportive community groups, schools'
  },
  BehavioralPatterns: {
    DailyRoutines: [
      'Preparing kids for school',
      'Working afternoon shifts',
      'Meal prep for family dinners'
    ],
    TechInteraction: [
      'Uses smartphone for recipes',
      'Online community participation'
    ]
  },
  NeedsAndChallenges: {
    Needs: [
      'Affordable meal options',
      'Quick and easy recipes',
      'Nutritional education for children'
    ],
    Challenges: [
      'Budget constraints',
      'Time management for meal prep',
      'Limited kitchen resources'
    ]
  },
  UsageContext: {
    ProductUse: 'Convenient meal preparation for family',
    UseInfluencers: ['Food blogs', 'Community leaders', 'Pediatricians']
  },
  TechnologyProficiency: {
    ComfortLevel: 'Medium',
    PreferredDevices: ['Smartphone']
  },
  InformationConsumption: {
    PreferredSources: ['Social media', 'Parenting blogs', 'Email newsletters'],
    MediaConsumption: ['Videos', 'Blogs', 'Social media posts']
  },
  AdditionalMetadata: {
    DietaryRestrictions: 'None specified',
    PreferredCuisine: 'Varied - emphasis on kid-friendly options'
  }
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: NodeType.Persona,
    position: { x: 0, y: 0 },
    data: { persona }
  }
];
const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = (connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  };

  return (
    <div className="h-[100vh] w-[100vw]">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        // Figma viewport controls
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectionMode={SelectionMode.Partial}
        snapToGrid={true}
      >
        <Panel position="top-center">
          <button
            onClick={() => {
              const personas = generatePersonas(
                'Meal kits for low income families'
              );
              console.log(personas);
            }}
          >
            Generate persona
          </button>
        </Panel>
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
}
