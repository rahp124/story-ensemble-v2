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
import { Dimension, PersonaNodeData, StoryboardNodeData } from './types';
import { allDimensionAssignments } from './lib';
import { generatePersona, generatePersonaDimensions } from './api/personas';
import { nanoid } from 'nanoid';
import { NodeType } from './rf-components';

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
  regeneratePersonaNodes: (ids: string[], instructions?: string) => void;
  updatePersonaNode: (id: string, text: string) => Promise<void>;
  mergePersonaNodes: (ids: string[]) => Promise<void>;

  // Problem
  generateProblemNodes: (context: string) => Promise<void>;
  regenerateProblemNodes: (ids: string[], instructions?: string) => void;
  updateProblemNode: (id: string, text: string) => void;
  mergeProblemNodes: (ids: string[]) => Promise<void>;

  // Solution
  generateSolutionNodes: (context: string) => Promise<void>;
  regenerateSolutionNodes: (ids: string[], instructions?: string) => void;
  updateSolutionNode: (id: string, text: string) => void;
  mergeSolutionNodes: (ids: string[]) => Promise<void>;

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
    if (
      !target ||
      !source ||
      !target.startsWith('solution') ||
      !source.startsWith('problem')
    )
      return;

    const sourceNode = get().nodes.find((node) => node.id === source);
    const targetNode = get().nodes.find((node) => node.id === target);
    if (!sourceNode || !targetNode) return;
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === target) {
          return {
            ...node,
            data: {
              ...node.data,
              dependencyUpdates: [
                ...node.data.dependencyUpdates,
                {
                  id: source,
                  previous: sourceNode.data.problem,
                  current: sourceNode.data.problem
                }
              ]
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

    const dimensionPermutations = allDimensionAssignments(
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

    // update dependent solution nodes with a pending update

    const solutions = get()
      .edges.filter(
        (edge) => edge.source === id && edge.target.startsWith('solution')
      )
      .map((edge) => edge.target);
    const solutionNodes = get().nodes.filter((node) =>
      solutions.includes(node.id)
    );

    set({
      nodes: get().nodes.map((node) => {
        if (solutionNodes.map((node) => node.id).includes(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              dependencyUpdates: [
                ...node.data.dependencyUpdates,
                {
                  id,
                  previous: problemNode.data.problem,
                  current: problem
                }
              ]
            }
          };
        }
        return node;
      })
    });
  },

  generateSolutionNodes: async (problemDependencyIds, instructions) => {
    const existingDimensions = get().solutionDimensions;
    const newDimensions = await generateSolutionDimensions(
      existingDimensions,
      ''
    );
    set({
      solutionDimensions: [...get().solutionDimensions, ...newDimensions]
    });

    const problems: string[] = [];
    const dimensionPermutations = allDimensionAssignments(
      get().solutionDimensions
    );
    console.log(dimensionPermutations);
    const solutions = await Promise.all(
      dimensionPermutations.map((permutation) =>
        generateSolution(problems, permutation, instructions)
      )
    );

    return solutions;
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
  },
  regenerateSolutionNode: async (id: string, accept: boolean) => {
    const solutionNode = get().nodes.find((node) => node.id === id);
    if (!solutionNode) return;

    if (!accept) {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                dependencyUpdates: []
              }
            };
          }
          return node;
        })
      });
      return;
    }

    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
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
      .edges.filter((edge) => edge.target === id)
      .map((edge) => edge.source);
    const problems: string[] = get()
      .nodes.filter((node) => problemIds.includes(node.id))
      .map((node) => node.data.problem);

    const newSolution = await generateSolution(
      problems,
      solutionNode.data.dependencyUpdates,
      solutionNode.data.solution
    );

    get().updateSolutionNode(id, newSolution);
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              dependencyUpdates: [],
              regenerating: false
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
