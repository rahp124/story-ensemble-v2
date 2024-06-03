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
  FrameOutline,
  generateStoryboardOutlines,
  generateStoryboardTitles
} from './api/storyboards';
import { generateImage } from './api/stableDiffusion';
import { generateSolution, generateSolutionDimensions } from './api/solutions';
import {
  Dimension,
  PersonaNodeData,
  ProblemNodeData,
  SolutionNodeData,
  StoryboardNodeData
} from './types';
import { generateRandomAssignments } from './lib';
import { generatePersona, generatePersonaDimensions } from './api/personas';
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
  storyboardOutlineDimensions: Dimension[];
  storyboardImageDimensions: [];

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
  generatePersonaNodes: (context: string) => Promise<void>;
  // regeneratePersonaNodes: (ids: string[], instructions?: string) => void;
  updatePersonaNode: (id: string, text: string) => Promise<void>;
  // mergePersonaNodes: (ids: string[]) => Promise<void>;

  // Problem
  generateProblemNodes: (
    context: string,
    personaIds: string[]
  ) => Promise<void>;
  regenerateProblemNodes: (ids: string[], instructions?: string) => void;
  updateProblemNode: (id: string, text: string) => void;
  // mergeProblemNodes: (ids: string[]) => Promise<void>;

  // Solution
  generateSolutionNodes: (
    context: string,
    problemIds: string[]
  ) => Promise<void>;
  regenerateSolutionNodes: (ids: string[], instructions?: string) => void;
  updateSolutionNode: (id: string, text: string) => void;
  // mergeSolutionNodes: (ids: string[]) => Promise<void>;

  // Storyboards
  generateStoryboardTitles: (id: string) => Promise<void>;
  generateStoryboardOutlines: (
    id: string,
    variationIdx: number,
    title: string
  ) => Promise<void>;
  generateStoryboardImages: (
    id: string,
    variationIdx: number,
    outlineIdx: number
  ) => Promise<void>;
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
  storyboardOutlineDimensions: [],
  storyboardImageDimensions: [],

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
    console.log('generate nodes');

    get().setNodes([...get().nodes, ...personasNodes]);
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

  generateStoryboardTitles: async (id: string) => {
    const context =
      'Rob is a educated tech salesperson. When attending in person tech conferences he wants to find people in specific industries to help make sales. Create an event engagement app that encourages people to register to connect at in-person events. This app also includes event engagement features to encourage users to register with programs such as scavenger hunts.';
    // 'Bill is a gardener who has trouble reading small print. Create an app that helps him learn about plants using videos.';
    const titles = await generateStoryboardTitles(context);

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              variations: titles.map((title) => ({
                title,
                outlines: []
              }))
            }
          };
        }
        return node;
      })
    });
  },
  generateStoryboardOutlines: async (
    id: string,
    variationIdx: number,
    title: string
  ) => {
    const outlines = await generateStoryboardOutlines(title);
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          const typedNode = node as Node<StoryboardNodeData>;
          return {
            ...typedNode,
            data: {
              ...typedNode.data,
              variations: typedNode.data.variations.map((variation, idx) => {
                if (idx === variationIdx) {
                  return {
                    ...variation,
                    outlines
                  };
                }
                return variation;
              })
            }
          };
        }
        return node;
      })
    });
  },
  generateStoryboardImages: async (id, variationIndex, outlineIndex) => {
    const outline: FrameOutline[] = get()
      .nodes.find((node) => node.id === id)
      ?.data.variations.at(variationIndex)
      ?.outlines.at(outlineIndex)?.outline;
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
              variations: typedNode.data.variations.map((variation, idx) => {
                if (idx === variationIndex) {
                  return {
                    ...variation,
                    outlines: variation.outlines.map((outline, idx) => {
                      if (idx === outlineIndex) {
                        return {
                          ...outline,
                          outline: images
                        };
                      }
                      return outline;
                    })
                  };
                }
                return variation;
              })
            }
          };
        }
        return node;
      })
    });
  }
}));
