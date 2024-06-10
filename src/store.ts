import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  XYPosition,
  OnSelectionChangeFunc,
  OnConnectStart,
  OnConnectEnd
} from 'reactflow';
import {
  generateStoryboardDimensions,
  generateStoryboardOutline
} from './api/storyboards';
import { generateImage } from './api/stableDiffusion';
import { generateSolution, generateSolutionDimensions } from './api/solutions';
import {
  Dimension,
  FrameOutline,
  PersonaNodeData,
  ProblemNodeData,
  SolutionNodeData,
  StoryboardNodeData
} from './types';
import { generateRandomAssignments } from './lib';
import {
  generatePersona,
  generatePersonaDimensions,
  mergePersonas
} from './api/personas';
import { nanoid } from 'nanoid';
import { NodeType } from './rf-components';
import { generateProblem, generateProblemDimensions } from './api/problems';

type RFState = {
  nodes: Node[];
  selectedNodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onSelectionChange: OnSelectionChangeFunc;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  personaDimensions: Dimension[];
  problemDimensions: Dimension[];
  solutionDimensions: Dimension[];
  storyboardDimensions: Dimension[];

  connectionInProgress: boolean;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;

  cursorNode: Node | null;
  swapCursorNode: (cursorNode: Node | null) => void;
  updateCursorNodePosition: (position: XYPosition) => void;
  placeCursorNode: () => void;

  setNodeOutOfSync: (id: string, outOfSync: boolean) => void;

  updateTextNode: (id: string, text: string) => void;

  // Persona
  pinPersonaDimension: (id: string, currentValue: string[]) => void;
  // addPersonaDimension: (dimensionName: string) => void;

  generatePersonaNodes: (context: string) => Promise<void>;
  regeneratePersonaNodes: (ids: string[], instructions?: string) => void;
  updatePersonaNode: (id: string, text: string) => Promise<void>;
  mergePersonaNodes: (
    personaNodes: Node<PersonaNodeData>[],
    instructions?: string
  ) => Promise<void>;

  // Problem
  pinProblemDimension: (id: string, currentValue: string[]) => void;

  generateProblemNodes: (
    context: string,
    personaIds: string[]
  ) => Promise<void>;
  regenerateProblemNodes: (ids: string[], instructions?: string) => void;
  updateProblemNode: (id: string, text: string) => void;
  // mergeProblemNodes: (ids: string[]) => Promise<void>;

  // Solution
  pinSolutionDimension: (id: string, currentValue: string[]) => void;

  generateSolutionNodes: (
    context: string,
    problemIds: string[]
  ) => Promise<void>;
  regenerateSolutionNodes: (ids: string[], instructions?: string) => void;
  updateSolutionNode: (id: string, text: string) => void;
  // mergeSolutionNodes: (ids: string[]) => Promise<void>;

  // Storyboards
  generateStoryboardDimensions: (context: string) => Promise<void>;
  pinStoryboardDimension: (id: string, currentValue: string[]) => void;

  generateStoryboardNode: (context: string) => Promise<void>;
  generateStoryboardImages: (id: string) => Promise<void>;
};

export const useStore = create<RFState>((set, get) => ({
  nodes: [],
  selectedNodes: [],
  edges: [],
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes)
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges)
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges)
    });

    const { target, source } = connection;
    if (!target || !source) return;
    const isPersonaToProblemConnection =
      source.startsWith('persona') && target.startsWith('problem');
    const isProblemToSolutionConnection =
      source.startsWith('problem') && target.startsWith('solution');
    if (!isPersonaToProblemConnection && !isProblemToSolutionConnection) return;

    const targetNode = get().nodes.find((node) => node.id === target);
    if (!targetNode) return;
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === target) {
          return {
            ...node,
            data: {
              ...node.data,
              outOfSync: true
            }
          };
        }
        return node;
      })
    });
  },
  onSelectionChange: ({ nodes }) => {
    set({
      selectedNodes: nodes
    });
  },
  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },
  setEdges: (edges: Edge[]) => {
    set({ edges });
  },

  personaDimensions: [],
  problemDimensions: [],
  solutionDimensions: [],
  storyboardDimensions: [],

  connectionInProgress: false,
  onConnectStart: () => set({ connectionInProgress: true }),
  onConnectEnd: () => set({ connectionInProgress: false }),

  cursorNode: null,
  swapCursorNode: (cursorNode: Node | null) => {
    const oldState = get();
    if (!cursorNode) {
      set({
        nodes: oldState.nodes.filter(
          (node) => node.id !== oldState.cursorNode?.id
        ),
        cursorNode
      });
    } else {
      set({
        nodes: [
          ...oldState.nodes.filter(
            (node) => node.id !== oldState.cursorNode?.id
          ),
          cursorNode
        ],
        cursorNode
      });
    }
  },
  updateCursorNodePosition: (position: XYPosition) => {
    const oldState = get();
    if (!oldState.cursorNode) return;

    set({
      nodes: oldState.nodes.map((node) => {
        if (node.id === oldState.cursorNode?.id) {
          return {
            ...node,
            position
          };
        }
        return node;
      }),
      cursorNode: {
        ...oldState.cursorNode!,
        position
      }
    });
  },
  placeCursorNode: () => set({ cursorNode: null }),

  setNodeOutOfSync: (id: string, outOfSync: boolean) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, outOfSync } };
        }
        return node;
      })
    });
  },

  updateTextNode: (id: string, text: string) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, text } };
        }
        return node;
      })
    });
  },

  pinPersonaDimension: (id: string, currentValue: string[]) => {
    const dimension = get().personaDimensions.find((d) => d.id === id);
    if (!dimension) return;

    set({
      personaDimensions: get().personaDimensions.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            currentValues: currentValue
          };
        }
        return d;
      })
    });
  },
  generatePersonaNodes: async (context: string) => {
    const newDimensions = await generatePersonaDimensions(
      get().personaDimensions,
      context
    );
    set({
      personaDimensions: [...get().personaDimensions, ...newDimensions]
    });

    const dimensionPermutations = generateRandomAssignments(
      get().personaDimensions,
      5
    );

    const personasNodes = await Promise.all(
      dimensionPermutations.map(async (permutation, idx) => {
        const personaNode: Node<PersonaNodeData> = {
          id: `persona-${nanoid()}`,
          type: NodeType.Persona,
          position: { x: 100 + idx * 350, y: 200 },
          style: {
            width: 300,
            height: 300
          },
          data: {
            persona: await generatePersona(permutation, context),
            dimensions: permutation
          }
        };
        return personaNode;
      })
    );

    get().setNodes([...get().nodes, ...personasNodes]);
  },
  regeneratePersonaNodes: async (ids: string[], instructions?: string) => {
    const personaNodes = get().nodes.filter(
      (node) => node.type === NodeType.Persona && ids.includes(node.id)
    );
    if (!personaNodes.length) return;

    personaNodes.forEach(async (node) => {
      set({
        nodes: get().nodes.map((node) => {
          if (ids.includes(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                regenerating: true
              }
            };
          }
          return node;
        })
      });

      const newPersona = await generatePersona(node.data.dimensions, '');

      get().updatePersonaNode(node.id, newPersona);
      set({
        nodes: get().nodes.map((node) => {
          if (ids.includes(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                outOfSync: false,
                regenerating: false
              }
            };
          }
          return node;
        })
      });
    });
  },
  updatePersonaNode: async (id: string, persona: string) => {
    const personaNode = get().nodes.find((node) => node.id === id);
    if (!personaNode || personaNode.type !== NodeType.Persona) return;

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, persona } };
        }
        return node;
      })
    });

    // Update dependencies
    const dependencyIds = get()
      .edges.filter(
        (edge) => edge.source === id && edge.target.startsWith('problem')
      )
      .map((edge) => edge.target);

    set({
      nodes: get().nodes.map((node) => {
        if (dependencyIds.includes(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              outOfSync: true
            }
          };
        }
        return node;
      })
    });
  },
  mergePersonaNodes: async (personaNodes, instructions) => {
    const peronas = personaNodes.map((node) => node.data.persona);
    const personaDimensions = get().personaDimensions;

    const { mergedPersona, mergedDimensions } = await mergePersonas(
      peronas,
      personaDimensions,
      instructions || ''
    );

    const personaNode: Node<PersonaNodeData> = {
      id: `persona-${nanoid()}`,
      type: NodeType.Persona,
      position: { x: -200, y: 200 },
      style: {
        width: 300,
        height: 300
      },
      data: {
        persona: mergedPersona,
        dimensions: mergedDimensions
      }
    };

    get().setNodes([...get().nodes, personaNode]);
  },

  pinProblemDimension: (id: string, currentValue: string[]) => {
    const dimension = get().problemDimensions.find((d) => d.id === id);
    if (!dimension) return;

    set({
      problemDimensions: get().problemDimensions.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            currentValues: currentValue
          };
        }
        return d;
      })
    });
  },

  generateProblemNodes: async (context: string, personaIds: string[]) => {
    const personas: string[] = get()
      .nodes.filter(
        (node) => personaIds.includes(node.id) && node.type === NodeType.Persona
      )
      .map((node) => node.data.persona);
    context = `${context}\n\nPersonas: ${personas}`;

    const newDimensions = await generateProblemDimensions(
      get().problemDimensions,
      context
    );
    set({
      problemDimensions: [...get().problemDimensions, ...newDimensions]
    });

    const dimensionPermutations = generateRandomAssignments(
      get().problemDimensions,
      5
    );

    const nodes = await Promise.all(
      dimensionPermutations.map(async (permutation, idx) => {
        const node: Node<ProblemNodeData> = {
          id: `problem-${nanoid()}`,
          type: NodeType.Problem,
          position: { x: 100 + idx * 350, y: 600 },
          style: {
            width: 300,
            height: 300
          },
          data: {
            problem: await generateProblem(permutation, context),
            dimensions: permutation
          }
        };
        return node;
      })
    );

    const edges = personaIds.flatMap((personaId) =>
      nodes.map(({ id }) => ({
        id: `edge-${nanoid()}`,
        source: personaId,
        target: id
      }))
    );

    get().setNodes([...get().nodes, ...nodes]);
    get().setEdges([...get().edges, ...edges]);
  },
  regenerateProblemNodes: async (ids: string[], instructions?: string) => {
    const problemNodes = get().nodes.filter(
      (node) => node.type === NodeType.Problem && ids.includes(node.id)
    );
    if (!problemNodes.length) return;

    problemNodes.forEach(async (node) => {
      set({
        nodes: get().nodes.map((node) => {
          if (ids.includes(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                regenerating: true
              }
            };
          }
          return node;
        })
      });

      const personaIds = get()
        .edges.filter(
          (edge) => edge.target === node.id && edge.source.startsWith('persona')
        )
        .map((edge) => edge.source);
      const personas: string[] = get()
        .nodes.filter(
          (node) =>
            personaIds.includes(node.id) && node.type === NodeType.Persona
        )
        .map((node) => node.data.persona);
      const context = `Personas: ${personas}`;

      const newPersona = await generateProblem(node.data.dimensions, context);

      get().updateProblemNode(node.id, newPersona);
      set({
        nodes: get().nodes.map((node) => {
          if (ids.includes(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                outOfSync: false,
                regenerating: false
              }
            };
          }
          return node;
        })
      });
    });
  },
  updateProblemNode: (id: string, problem: string) => {
    const problemNode = get().nodes.find((node) => node.id === id);
    if (!problemNode) return;

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, problem } };
        }
        return node;
      })
    });

    // Update dependencies
    const dependencyIds = get()
      .edges.filter(
        (edge) => edge.source === id && edge.target.startsWith('solution')
      )
      .map((edge) => edge.target);

    set({
      nodes: get().nodes.map((node) => {
        if (dependencyIds.includes(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              outOfSync: true
            }
          };
        }
        return node;
      })
    });
  },

  pinSolutionDimension: (id: string, currentValue: string[]) => {
    const dimension = get().solutionDimensions.find((d) => d.id === id);
    if (!dimension) return;

    set({
      solutionDimensions: get().solutionDimensions.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            currentValues: currentValue
          };
        }
        return d;
      })
    });
  },

  generateSolutionNodes: async (context, problemIds) => {
    const problems: string[] = get()
      .nodes.filter(
        (node) => problemIds.includes(node.id) && node.type === NodeType.Problem
      )
      .map((node) => node.data.problem);
    context = `${context}\n\nProblems: ${problems}`;

    const newDimensions = await generateSolutionDimensions(
      get().solutionDimensions,
      context
    );
    set({
      solutionDimensions: [...get().solutionDimensions, ...newDimensions]
    });

    const dimensionPermutations = generateRandomAssignments(
      get().solutionDimensions,
      5
    );

    const nodes = await Promise.all(
      dimensionPermutations.map(async (permutation, idx) => {
        const node: Node<SolutionNodeData> = {
          id: `solution-${nanoid()}`,
          type: NodeType.Solution,
          position: { x: 100 + idx * 350, y: 1000 },
          style: {
            width: 300,
            height: 300
          },
          data: {
            solution: await generateSolution(permutation, context),
            dimensions: permutation
          }
        };
        return node;
      })
    );

    const edges = problemIds.flatMap((problemId) =>
      nodes.map(({ id }) => ({
        id: `edge-${nanoid()}`,
        source: problemId,
        target: id
      }))
    );

    get().setNodes([...get().nodes, ...nodes]);
    get().setEdges([...get().edges, ...edges]);
  },
  regenerateSolutionNodes: async (ids, instructions) => {
    const solutionNodes = get().nodes.filter(
      (node) => node.type === NodeType.Solution && ids.includes(node.id)
    );
    if (!solutionNodes.length) return;

    solutionNodes.forEach(async (node) => {
      set({
        nodes: get().nodes.map((node) => {
          if (ids.includes(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                regenerating: true
              }
            };
          }
          return node;
        })
      });

      const problemIds = get()
        .edges.filter(
          (edge) => edge.target === node.id && edge.source.startsWith('problem')
        )
        .map((edge) => edge.source);
      const problems: string[] = get()
        .nodes.filter(
          (node) =>
            problemIds.includes(node.id) && node.type === NodeType.Problem
        )
        .map((node) => node.data.persona);
      const context = `Problems: ${problems}`;

      const newSolution = await generateSolution(node.data.dimensions, context);

      get().updateSolutionNode(node.id, newSolution);
      set({
        nodes: get().nodes.map((node) => {
          if (ids.includes(node.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                outOfSync: false,
                regenerating: false
              }
            };
          }
          return node;
        })
      });
    });
  },
  updateSolutionNode: (id: string, solution: string) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, solution } };
        }
        return node;
      })
    });

    const dependencyIds = get()
      .edges.filter(
        (edge) => edge.source === id && edge.target.startsWith('storyboard')
      )
      .map((edge) => edge.target);

    set({
      nodes: get().nodes.map((node) => {
        if (dependencyIds.includes(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              outOfSync: true
            }
          };
        }
        return node;
      })
    });
  },

  generateStoryboardDimensions: async (context: string) => {
    const newDimensions = await generateStoryboardDimensions(
      get().storyboardDimensions,
      context
    );

    set({
      storyboardDimensions: [...get().storyboardDimensions, ...newDimensions]
    });
  },
  pinStoryboardDimension: (id: string, currentValue: string[]) => {
    const dimension = get().storyboardDimensions.find((d) => d.id === id);
    if (!dimension) return;

    set({
      storyboardDimensions: get().storyboardDimensions.map((d) => {
        if (d.id === id) {
          return {
            ...d,
            currentValues: currentValue
          };
        }
        return d;
      })
    });
  },
  generateStoryboardNode: async (context: string) => {
    // TODO dependencies

    const dimensionPermutation = generateRandomAssignments(
      get().storyboardDimensions,
      1
    )[0];

    const storyboardData = await generateStoryboardOutline(
      dimensionPermutation,
      context
    );

    const node: Node<StoryboardNodeData> = {
      id: `storyboard-${nanoid()}`,
      type: NodeType.Storyboard,
      position: { x: 100, y: 1000 },
      data: {
        storyboard: storyboardData,
        dimensions: dimensionPermutation
      }
    };
    set({
      nodes: [...get().nodes, node]
    });
  },

  generateStoryboardImages: async (id) => {
    const outline: FrameOutline[] = get().nodes.find((node) => node.id === id)
      ?.data.storyboard.outline;
    if (!outline) return;

    const images = await Promise.all(
      outline.map(async (frame) => {
        const image = await generateImage({
          prompt: frame.imagePrompt,
          negativePrompt: frame.imageNegativePrompt
        });
        return {
          ...frame,
          image
        };
      })
    );

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          const typedNode = node as Node<StoryboardNodeData>;
          return {
            ...typedNode,
            data: {
              ...typedNode.data,
              storyboard: {
                ...typedNode.data.storyboard,
                outline: images
              }
            }
          };
        }
        return node;
      })
    });
  }
}));
