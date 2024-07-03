import { StateCreator, create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as indexDbKv from 'idb-keyval';
import mergeWith from 'lodash/mergeWith';
import { immer } from 'zustand/middleware/immer';

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
  OnConnectStart,
  OnConnectEnd,
  EdgeRemoveChange
} from 'reactflow';
import {
  generateStoryboardDimensions,
  generateStoryboardImagePrompts,
  generateStoryboardOutline
} from './api/storyboards';
import { generateImage } from './api/stableDiffusion';
import { generateSolution, generateSolutionDimensions } from './api/solutions';
import { Dimension, FrameOutline, NodeData, StoryboardNodeData } from './types';
import { generateRandomAssignments } from './lib';
import {
  generatePersona,
  generatePersonaDimensions,
  mergePersonas
} from './api/personas';
import { nanoid } from 'nanoid';
import { NodeType } from './rf-components';
import { generateProblem, generateProblemDimensions } from './api/problems';
import { generateIllustrativeImage } from './api/images';
import debounce from 'lodash/debounce';
import { cloneDeep } from 'lodash';
import {
  ConnectedFeedback,
  generateConnectedFeedback,
  generatePersonaFeedback,
  generateProblemFeedback,
  generateSolutionFeedback,
  generateStoryboardFeedback
} from './api/feedback';
import { WritableDraft } from 'immer';

const indexDbStorage: StateStorage = {
  getItem: async (name) => {
    return (await indexDbKv.get(name)) || null;
  },
  setItem: debounce(async (key: string, value: string) => {
    await indexDbKv.set(key, value);
  }, 1000),
  removeItem: async (name) => {
    await indexDbKv.del(name);
  }
};

type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNode: (id: string, data: Partial<Node>) => void;
  selectNodes: (ids: string[]) => void;

  centerPosition: XYPosition;

  personaDimensions: Dimension[];
  problemDimensions: Dimension[];
  solutionDimensions: Dimension[];
  storyboardDimensions: Dimension[];

  updateNodeDimensions: (id: string, dimensions: Dimension[]) => void;

  connectionInProgress: boolean;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;

  cursorNode: Node | null;
  swapCursorNode: (cursorNode: Node | null) => void;
  updateCursorNodePosition: (position: XYPosition) => void;
  placeCursorNode: () => void;

  globalShowImage: boolean;
  setGlobalShowImage: (show: boolean) => void;

  setNodeOutOfSync: (id: string, outOfSync: boolean) => void;

  // Persona
  pinPersonaDimension: (id: string, currentValue: string[]) => void;
  // addPersonaDimension: (dimensionName: string) => void;

  generatePersonaDimensions: (context: string) => Promise<void>;
  generatePersonaNodes: (context: string) => Promise<string[]>;
  generatePersonaImage: (id: string) => Promise<void>;
  regeneratePersonaNode: (id: string, instructions: string) => Promise<void>;
  updatePersonaNode: (id: string, text: string) => Promise<void>;
  mergePersonaNodes: (
    personaNodes: Node<NodeData>[],
    instructions?: string
  ) => Promise<void>;
  generatePersonaFeedback: (id: string) => Promise<void>;

  // Problem
  pinProblemDimension: (id: string, currentValue: string[]) => void;
  generateProblemDimensions: (context: string) => Promise<void>;
  generateProblemNodes: (
    context: string,
    personaIds: string[]
  ) => Promise<string[]>;
  generateProblemImage: (id: string) => Promise<void>;
  regenerateProblemNode: (id: string, instructions: string) => Promise<void>;
  updateProblemNode: (id: string, text: string) => void;
  generateProblemFeedback: (id: string) => Promise<void>;
  // mergeProblemNodes: (ids: string[]) => Promise<void>;

  // Solution
  pinSolutionDimension: (id: string, currentValue: string[]) => void;
  generateSolutionDimensions: (context: string) => Promise<void>;
  generateSolutionNodes: (
    context: string,
    problemIds: string[]
  ) => Promise<string[]>;
  generateSolutionImage: (id: string) => Promise<void>;
  regenerateSolutionNode: (id: string, instructions: string) => Promise<void>;
  updateSolutionNode: (id: string, text: string) => void;
  generateSolutionFeedback: (id: string) => Promise<void>;
  // mergeSolutionNodes: (ids: string[]) => Promise<void>;

  // Storyboards
  generateStoryboardDimensions: (context: string) => Promise<void>;
  pinStoryboardDimension: (id: string, currentValue: string[]) => void;

  generateStoryboardNode: (
    context: string,
    personaIds: string[],
    problemIds: string[],
    solutionIds: string[]
  ) => Promise<string[]>;
  regenerateStoryboardNode: (id: string, instructions: string) => Promise<void>;
  generateStoryboardImages: (id: string) => Promise<Promise<number>[]>;
  generateStoryboardFeedback: (id: string) => Promise<void>;
  updateStoryboardTitle: (id: string, title: string) => void;
  updateStoryboardDescription: (
    id: string,
    frameIdx: number,
    description: string
  ) => void;
  updateStoryboardCaption: (
    id: string,
    frameIdx: number,
    caption: string
  ) => void;

  pastStates: Partial<RFState>[];
  futureStates: Partial<RFState>[];

  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;

  copiedNodeIds: string[];
  copy: () => void;
  paste: () => void;

  // Node Groups
  groupIdToNodeIds: Record<string, string[]>;
  groupIdToEdges: Record<string, { source: string; target: string }[]>;
  nodeIdToGroupId: Record<string, string>;
  calculateNodeGroups: () => void;

  groupFeedback: Record<string, ConnectedFeedback>;
  generateGroupFeedback: () => Promise<void>;
};

function partialize(state: RFState): Partial<RFState> {
  return {
    nodes: state.nodes,
    edges: state.edges,
    personaDimensions: state.personaDimensions,
    problemDimensions: state.problemDimensions,
    solutionDimensions: state.solutionDimensions,
    storyboardDimensions: state.storyboardDimensions
  };
}

let dimensionChangeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let positionChangeTimeoutId: ReturnType<typeof setTimeout> | null = null;

const createStore: StateCreator<
  RFState,
  [['zustand/immer', never], ['zustand/persist', unknown]]
> = (set, get) => {
  const updateNode = (
    id: string,
    setter: (nodeDraft: WritableDraft<Node>) => void
  ) => {
    set((state) => {
      const index = state.nodes.findIndex((node) => node.id === id);
      if (index === -1) return;

      setter(state.nodes[index]);
    });
  };

  return {
    nodes: [],
    edges: [],
    onNodesChange: (changes: NodeChange[]) => {
      const isRemoveChange = changes.some(({ type }) => type === 'remove');
      const isDimensionChange =
        changes.length === 1 &&
        changes.some(({ type }) => type === 'dimensions');
      const isPositionChange = changes.some(
        (change) => change.type === 'position' && change.dragging
      );

      if (isRemoveChange) {
        get().takeSnapshot();
      } else if (isDimensionChange) {
        if (!dimensionChangeTimeoutId) {
          get().takeSnapshot();
        } else {
          clearTimeout(dimensionChangeTimeoutId);
        }

        dimensionChangeTimeoutId = setTimeout(() => {
          dimensionChangeTimeoutId = null;
        }, 500);
      } else if (isPositionChange) {
        if (!positionChangeTimeoutId) {
          get().takeSnapshot();
        } else {
          clearTimeout(positionChangeTimeoutId);
        }

        positionChangeTimeoutId = setTimeout(() => {
          positionChangeTimeoutId = null;
        }, 500);
      }

      set({
        nodes: applyNodeChanges(changes, get().nodes)
      });
    },
    onEdgesChange: (changes: EdgeChange[]) => {
      const removeChanges = changes.filter(
        ({ type }) => type === 'remove'
      ) as EdgeRemoveChange[];
      const isRemoveChange = removeChanges.length;
      if (isRemoveChange) {
        get().takeSnapshot();

        const edgesIdsToRemove = removeChanges.map(({ id }) => id);
        const disconnectedNodeIds = get()
          .edges.filter((edge) => edgesIdsToRemove.includes(edge.id))
          .map((edge) => edge.target);
        set({
          nodes: get().nodes.map((node) => {
            if (disconnectedNodeIds.includes(node.id)) {
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
      }

      set({
        edges: applyEdgeChanges(changes, get().edges)
      });
    },
    onConnect: (connection: Connection) => {
      get().takeSnapshot();

      set({
        edges: addEdge(connection, get().edges)
      });

      const { target, source } = connection;
      if (!target || !source) return;
      const isPersonaToProblemConnection =
        source.startsWith('persona') && target.startsWith('problem');
      const isProblemToSolutionConnection =
        source.startsWith('problem') && target.startsWith('solution');
      if (!isPersonaToProblemConnection && !isProblemToSolutionConnection)
        return;

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
    updateNode: (id: string, data: Partial<Node>) => {
      set((state) => {
        const index = state.nodes.findIndex((node) => node.id === id);
        if (index === -1) return;

        mergeWith(state.nodes[index], data, (objValue, srcValue, key, obj) => {
          // Allow setting an undefined value
          if (objValue !== srcValue && typeof srcValue === 'undefined') {
            obj[key] = srcValue;
          }
          // Allow setting an empty array
          if (Array.isArray(srcValue)) {
            obj[key] = srcValue;
            obj[key].length = srcValue.length;
          }
        });
      });
    },
    selectNodes: (ids: string[]) => {
      set({
        nodes: get().nodes.map((node) => ({
          ...node,
          selected: ids.includes(node.id)
        }))
      });
    },

    centerPosition: { x: 0, y: 0 },

    personaDimensions: [],
    problemDimensions: [],
    solutionDimensions: [],
    storyboardDimensions: [],

    updateNodeDimensions: (id: string, dimensions: Dimension[]) => {
      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.dimensions = dimensions;
        draft.data.outOfSync = true;
      });
    },

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

    globalShowImage: false,
    setGlobalShowImage: (showImage: boolean) => {
      set({ globalShowImage: showImage });
    },

    setNodeOutOfSync: (id: string, outOfSync: boolean) => {
      updateNode(id, (draft) => {
        draft.data.outOfSync = outOfSync;
      });
    },

    pinPersonaDimension: (id: string, currentValue: string[]) => {
      const dimension = get().personaDimensions.find((d) => d.id === id);
      if (!dimension) return;

      get().takeSnapshot();
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
    generatePersonaDimensions: async (context: string) => {
      const newDimensions = await generatePersonaDimensions(
        get().personaDimensions,
        context
      );

      get().takeSnapshot();
      set({
        personaDimensions: [...get().personaDimensions, ...newDimensions]
      });
    },
    generatePersonaNodes: async (context: string) => {
      const dimensionPermutations = generateRandomAssignments(
        get().personaDimensions,
        1
      );

      const width = 300;
      const height = 300;
      const gap = 50;
      const numNodes = dimensionPermutations.length;

      const center = get().centerPosition;
      const startX =
        center.x - (width * numNodes + (numNodes - 1) * gap) / 2 + width / 2;
      const startY = center.y;

      const ids = await Promise.all(
        dimensionPermutations.map(async (permutation, idx) => {
          const node: Node<NodeData> = {
            id: `persona-${nanoid()}`,
            type: NodeType.Persona,
            height,
            width,
            style: {
              height,
              width
            },
            position: { x: startX + idx * (width + gap), y: startY },
            data: {
              content: await generatePersona(permutation, context),
              dimensions: permutation
            }
          };

          get().takeSnapshot();
          set({ nodes: [...get().nodes, node] });

          get().generatePersonaImage(node.id);

          return node.id;
        })
      );

      return ids;
    },
    generatePersonaImage: async (id: string) => {
      const node = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Persona
      );
      if (!node) return;

      const image = await generateIllustrativeImage(
        `Illustrate persona: ${node.data.content}`
      );

      get().takeSnapshot();
      updateNode(node.id, (draft) => {
        draft.data.image = image;
        draft.data.imageOutOfSync = false;
      });
    },
    regeneratePersonaNode: async (id: string, instructions: string) => {
      const personaNode = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Persona
      );
      if (!personaNode) return;

      const context = `Regenerate the existing persona using the following feedback and instructions.

Current persona: """
${personaNode.data.content}
"""

Instructions/Feedback: """
${instructions}
"""`;

      const newPersona = await generatePersona(
        personaNode.data.dimensions,
        context
      );
      get().updatePersonaNode(id, newPersona); // Takes snapshot

      await get().generatePersonaImage(id);
    },
    updatePersonaNode: async (id: string, persona: string) => {
      const personaNode = get().nodes.find((node) => node.id === id);
      if (!personaNode || personaNode.type !== NodeType.Persona) return;

      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.content = persona;
        draft.data.imageOutOfSync = true;
        draft.data.feedbackOutOfSync = true;
      });

      // Update dependencies
      const dependencyIds = get()
        .edges.filter((edge) => edge.source === id)
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
      const personas = personaNodes.map((node) => node.data.content);
      const personaDimensions = get().personaDimensions;

      const { mergedPersona, mergedDimensions } = await mergePersonas(
        personas,
        personaDimensions,
        instructions || ''
      );

      const personaNode: Node<NodeData> = {
        id: `persona-${nanoid()}`,
        type: NodeType.Persona,
        position: { x: -200, y: 200 },
        style: {
          width: 300,
          height: 300
        },
        data: {
          content: mergedPersona,
          dimensions: mergedDimensions
        }
      };

      get().takeSnapshot();
      set({ nodes: [...get().nodes, personaNode] });
    },
    generatePersonaFeedback: async (id) => {
      const persona = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Persona
      )?.data.content;
      if (!persona) return;

      const feedback = await generatePersonaFeedback(persona);

      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.feedback = feedback;
        draft.data.feedbackOutOfSync = false;
      });
    },

    pinProblemDimension: (id: string, currentValue: string[]) => {
      const dimension = get().problemDimensions.find((d) => d.id === id);
      if (!dimension) return;

      get().takeSnapshot();
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
    generateProblemDimensions: async (context: string) => {
      const newDimensions = await generateProblemDimensions(
        get().problemDimensions,
        context
      );

      get().takeSnapshot();
      set({
        problemDimensions: [...get().problemDimensions, ...newDimensions]
      });
    },
    generateProblemNodes: async (context: string, personaIds: string[]) => {
      if (personaIds.length === 0) {
        personaIds = await get().generatePersonaNodes(context);
      }
      const dimensionPermutations = generateRandomAssignments(
        get().problemDimensions,
        personaIds.length
      );

      const [height, width, gap] = [300, 300, 100];

      const ids = (
        await Promise.all(
          dimensionPermutations.flatMap(async (permutation, idx) => {
            const persona: Node<NodeData> | undefined = get().nodes.find(
              (node) =>
                node.id === personaIds[idx] && node.type === NodeType.Persona
            );
            if (!persona) return;

            const content = await generateProblem(
              permutation,
              context + persona.data.content
            );

            const position =
              persona.height !== undefined && persona.height !== null
                ? {
                    x: persona.position.x,
                    y:
                      persona.position.y + persona.height / 2 + height / 2 + gap
                  }
                : get().centerPosition;

            const node: Node<NodeData> = {
              id: `problem-${nanoid()}`,
              type: NodeType.Problem,
              height,
              width,
              style: {
                height,
                width
              },
              position,
              data: {
                content,
                dimensions: permutation
              }
            };
            const edge = {
              id: `edge-${nanoid()}`,
              source: persona.id,
              target: node.id
            };

            get().takeSnapshot();
            set({
              nodes: [...get().nodes, node],
              edges: [...get().edges, edge]
            });

            get().generateProblemImage(node.id);

            return node.id;
          })
        )
      ).filter((id) => id !== undefined);

      return ids;
    },
    generateProblemImage: async (id: string) => {
      const node: Node<NodeData> | undefined = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Problem
      );
      if (!node) return;

      const image = await generateIllustrativeImage(
        `Illustrate problem: ${node.data.content}`
      );

      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.image = image;
        draft.data.imageOutOfSync = false;
      });
    },
    regenerateProblemNode: async (id: string, instructions: string) => {
      const problemNode = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Problem
      );
      if (!problemNode) return;

      const personaIds = get()
        .edges.filter(
          (edge) => edge.target === id && edge.source.startsWith('persona')
        )
        .map((edge) => edge.source);
      const personas: string[] = get()
        .nodes.filter(
          (node) =>
            personaIds.includes(node.id) && node.type === NodeType.Persona
        )
        .map((node) => node.data.content);

      const context = `Regenerate the existing persona using the following dependencies, feedback, and instructions.
    
Personas (dependencies): """
${personas.join('\n')}
"""

Current problem: """
${problemNode.data.content}
"""

Instructions/Feedback: """
${instructions}
"""`;

      const newProblem = await generateProblem(
        problemNode.data.dimensions,
        context
      );
      get().updateProblemNode(id, newProblem); // Takes snapshot
      updateNode(id, (draft) => {
        draft.data.outOfSync = false;
      });

      await get().generateProblemImage(id);
    },
    updateProblemNode: (id: string, problem: string) => {
      const problemNode = get().nodes.find((node) => node.id === id);
      if (!problemNode) return;

      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.content = problem;
        draft.data.imageOutOfSync = true;
        draft.data.feedbackOutOfSync = true;
      });

      // Update dependencies
      const dependencyIds = get()
        .edges.filter((edge) => edge.source === id)
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
    generateProblemFeedback: async (id: string) => {
      const problem: string | undefined = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Problem
      )?.data.content;
      if (!problem) return;

      const feedback = await generateProblemFeedback(problem);

      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.feedback = feedback;
        draft.data.feedbackOutOfSync = false;
      });
    },

    pinSolutionDimension: (id: string, currentValue: string[]) => {
      const dimension = get().solutionDimensions.find((d) => d.id === id);
      if (!dimension) return;

      get().takeSnapshot();
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
    generateSolutionDimensions: async (context: string) => {
      const newDimensions = await generateSolutionDimensions(
        get().solutionDimensions,
        context
      );

      get().takeSnapshot();
      set({
        solutionDimensions: [...get().solutionDimensions, ...newDimensions]
      });
    },
    generateSolutionNodes: async (context, problemIds) => {
      if (problemIds.length === 0) {
        problemIds = await get().generateProblemNodes(context, []);
      }
      const dimensionPermutations = generateRandomAssignments(
        get().solutionDimensions,
        problemIds.length
      );

      const [height, width, gap] = [300, 300, 100];

      const ids = (
        await Promise.all(
          dimensionPermutations.map(async (permutation, idx) => {
            const problem: Node<NodeData> | undefined = get().nodes.find(
              (node) =>
                node.id === problemIds[idx] && node.type === NodeType.Problem
            );
            if (!problem) return;

            const content = await generateSolution(
              permutation,
              context + problem.data.content
            );

            const position =
              problem.height !== undefined && problem.height !== null
                ? {
                    x: problem.position.x,
                    y:
                      problem.position.y + problem.height / 2 + height / 2 + gap
                  }
                : get().centerPosition;

            const node: Node<NodeData> = {
              id: `solution-${nanoid()}`,
              type: NodeType.Solution,
              height,
              width,
              style: {
                height,
                width
              },
              position,
              data: {
                content,
                dimensions: permutation
              }
            };

            const edge = {
              id: `edge-${nanoid()}`,
              source: problem.id,
              target: node.id
            };

            get().takeSnapshot();
            set({
              nodes: [...get().nodes, node],
              edges: [...get().edges, edge]
            });

            get().generateSolutionImage(node.id);

            return node.id;
          })
        )
      ).filter((id) => id !== undefined);

      return ids;
    },
    generateSolutionImage: async (id) => {
      const node = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Solution
      );
      if (!node) return;

      const image = await generateIllustrativeImage(
        `Illustrate solution: ${node.data.content}`
      );

      get().takeSnapshot();
      updateNode(node.id, (draft) => {
        draft.data.image = image;
        draft.data.imageOutOfSync = false;
      });
    },
    regenerateSolutionNode: async (id, instructions) => {
      const node = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Solution
      );
      if (!node) return;

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
        .map((node) => node.data.content);
      const context = `Regenerate the existing persona using the following dependencies, feedback, and instructions.

Problems (dependencies): """
${problems.join('\n')}
"""

Current solution: """
${node.data.content}
"""

Instructions/Feedback: """
${instructions}
"""`;

      const newSolution = await generateSolution(node.data.dimensions, context);

      get().updateSolutionNode(node.id, newSolution); // Takes snapshot
      updateNode(node.id, (draft) => {
        draft.data.outOfSync = false;
      });

      await get().generateSolutionImage(node.id);
    },
    updateSolutionNode: (id: string, solution: string) => {
      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.content = solution;
        draft.data.imageOutOfSync = true;
        draft.data.feedbackOutOfSync = true;
      });

      const dependencyIds = get()
        .edges.filter((edge) => edge.source === id)
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
    generateSolutionFeedback: async (id: string) => {
      const solution = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Solution
      )?.data.content;
      if (!solution) return;

      const feedback = await generateSolutionFeedback(solution);

      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.feedback = feedback;
        draft.data.feedbackOutOfSync = false;
      });
    },

    generateStoryboardDimensions: async (context: string) => {
      const newDimensions = await generateStoryboardDimensions(
        get().storyboardDimensions,
        context
      );

      get().takeSnapshot();
      set({
        storyboardDimensions: [...get().storyboardDimensions, ...newDimensions]
      });
    },
    pinStoryboardDimension: (id: string, currentValue: string[]) => {
      const dimension = get().storyboardDimensions.find((d) => d.id === id);
      if (!dimension) return;

      get().takeSnapshot();
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
    generateStoryboardNode: async (
      context: string,
      personaIds: string[],
      problemIds: string[],
      solutionIds: string[]
    ) => {
      const personaNodes = get().nodes.filter(
        (node) => node.type === NodeType.Persona && personaIds.includes(node.id)
      );
      const personas = personaNodes.map((node) => node.data.content).join('\n');

      const problemNodes = get().nodes.filter(
        (node) => node.type === NodeType.Problem && problemIds.includes(node.id)
      );
      const problems = problemNodes.map((node) => node.data.content).join('\n');

      const solutionNodes = get().nodes.filter(
        (node) =>
          node.type === NodeType.Solution && solutionIds.includes(node.id)
      );
      const solutions = solutionNodes
        .map((node) => node.data.content)
        .join('\n');

      const dependencyNodes = [
        ...personaNodes,
        ...problemNodes,
        ...solutionNodes
      ];
      const dependencyBottomBoundary = Math.max(
        ...dependencyNodes.map((node) => node.position.y + node.height! / 2)
      );
      const dependencyLeftBoundary = Math.min(
        ...dependencyNodes.map((node) => node.position.x - node.width! / 2)
      );
      const dependencyRightBoundary = Math.max(
        ...dependencyNodes.map((node) => node.position.x + node.width! / 2)
      );

      const [height, width, gap] = [600, 1200, 100];
      const position = {
        x: (dependencyRightBoundary + dependencyLeftBoundary) / 2,
        y: dependencyBottomBoundary + gap + height / 2
      };

      const dimensionPermutation = generateRandomAssignments(
        get().storyboardDimensions,
        1
      )[0];

      const fullContext = `${context}\n\nPersonas: ${personas}\n\nProblems: ${problems}\n\nSolutions: ${solutions}`;

      const storyboardData = await generateStoryboardOutline(
        dimensionPermutation,
        fullContext
      );

      const node: Node<StoryboardNodeData> = {
        id: `storyboard-${nanoid()}`,
        type: NodeType.Storyboard,
        height,
        width,
        style: {
          width: 1200,
          height: 600
        },
        position,
        data: {
          content: '',
          storyboard: {
            ...storyboardData,
            numberOfFrames: storyboardData.outline.length,
            artStyle: 'TODO'
          },
          dimensions: dimensionPermutation
        }
      };
      const edges = [...personaIds, ...problemIds, ...solutionIds].map(
        (sourceId) => ({
          id: `edge-${nanoid()}`,
          source: sourceId,
          target: node.id
        })
      );

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, node],
        edges: [...get().edges, ...edges]
      });

      get().generateStoryboardImages(node.id);

      return [node.id];
    },
    regenerateStoryboardNode: async (id, instructions) => {
      const storyboardNode = get().nodes.find((node) => node.id === id);
      if (!storyboardNode) return;

      const personaIds = get()
        .edges.filter(
          (edge) => edge.target === id && edge.source.startsWith('persona')
        )
        .map((edge) => edge.source);
      const personas = get()
        .nodes.filter(
          (node) =>
            node.type === NodeType.Persona && personaIds.includes(node.id)
        )
        .map((node) => node.data.content)
        .join('\n');

      const problemIds = get()
        .edges.filter(
          (edge) => edge.target === id && edge.source.startsWith('problem')
        )
        .map((edge) => edge.source);
      const problems = get()
        .nodes.filter(
          (node) =>
            node.type === NodeType.Problem && problemIds.includes(node.id)
        )
        .map((node) => node.data.content)
        .join('\n');

      const solutionIds = get()
        .edges.filter(
          (edge) => edge.target === id && edge.source.startsWith('solution')
        )
        .map((edge) => edge.source);
      const solutions = get()
        .nodes.filter(
          (node) =>
            node.type === NodeType.Solution && solutionIds.includes(node.id)
        )
        .map((node) => node.data.content)
        .join('\n');

      const fullContext = {
        dependencies: {
          personas,
          problems,
          solutions
        },
        instructions
      };

      const storyboardData = await generateStoryboardOutline(
        storyboardNode.data.dimensions,
        JSON.stringify(fullContext, null, 2)
      );

      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.storyboard = storyboardData;
        draft.data.outOfSync = false;
      });

      await get().generateStoryboardImages(id);
    },

    async generateStoryboardImages(id) {
      const outline: FrameOutline[] =
        get().nodes.find((node) => node.id === id)?.data.storyboard.outline ||
        [];
      if (outline.length === 0) return [];

      const imagePrompts = await generateStoryboardImagePrompts(
        get().storyboardDimensions,
        outline
      );

      return imagePrompts.map(async (prompt, idx) => {
        const image = await generateImage(prompt);

        get().takeSnapshot();
        updateNode(id, (draft) => {
          draft.data.storyboard.outline[idx].image = image;
          draft.data.storyboard.outline[idx].imageOutOfSync = false;
        });

        return idx;
      });
    },
    generateStoryboardFeedback: async (id) => {
      const storyboardNode: Node<StoryboardNodeData> | undefined =
        get().nodes.find(
          (node) => node.id === id && node.type === NodeType.Storyboard
        );
      if (!storyboardNode) return;

      const { storyboard } = storyboardNode.data;
      const sanitizedStoryboard = {
        title: storyboard.title,
        outline: storyboard.outline.map((frame) => ({
          frameType: frame.frameType,
          description: frame.description,
          caption: frame.caption
        }))
      };

      const feedback = await generateStoryboardFeedback(sanitizedStoryboard);
      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.feedback = feedback;
        draft.data.feedbackOutOfSync = false;
      });
    },
    updateStoryboardTitle: (id, title) => {
      updateNode(id, (draft: WritableDraft<Node<StoryboardNodeData>>) => {
        draft.data.storyboard.title = title;
        draft.data.storyboard.outline.forEach((frame) => {
          frame.imageOutOfSync = true;
        });
      });
    },
    updateStoryboardDescription: (id, frameIndex, description) => {
      updateNode(id, (draft: WritableDraft<Node<StoryboardNodeData>>) => {
        draft.data.storyboard.outline[frameIndex].description = description;
        draft.data.storyboard.outline[frameIndex].imageOutOfSync = true;
      });
    },
    updateStoryboardCaption: (id, frameIndex, caption) => {
      updateNode(id, (draft: WritableDraft<Node<StoryboardNodeData>>) => {
        draft.data.storyboard.outline[frameIndex].caption = caption;
        draft.data.storyboard.outline[frameIndex].imageOutOfSync = true;
      });
    },

    pastStates: [],
    futureStates: [],
    undo: () => {
      const nextState = get().pastStates.at(-1);
      if (!nextState) return;

      const currentState = partialize(get());

      const newPastStates = get().pastStates.slice(0, -1);
      const newFutureStates = [currentState, ...get().futureStates];

      set({
        ...nextState,
        pastStates: newPastStates,
        futureStates: newFutureStates
      });
    },
    redo: () => {
      const nextState = get().futureStates.at(0);
      if (!nextState) return;

      const currentState = partialize(get());

      const newPastStates = [...get().pastStates, currentState];
      const newFutureStates = get().futureStates.slice(1);

      set({
        ...nextState,
        pastStates: newPastStates,
        futureStates: newFutureStates
      });
    },
    takeSnapshot: () => {
      const snapshot = cloneDeep(partialize(get()));

      set({
        pastStates: [...get().pastStates, snapshot],
        futureStates: []
      });
    },

    copiedNodeIds: [],
    copy: () => {
      set({
        copiedNodeIds: get()
          .nodes.filter(({ selected }) => selected)
          .map(({ id }) => id)
      });
    },
    paste: () => {
      const { copiedNodeIds } = get();
      if (copiedNodeIds.length === 0) return;

      const newIdByOldId = new Map<string, string>();
      for (const id of copiedNodeIds) {
        // Strip 21 character nanoid and dash from end and add a new one
        const newId = id.slice(0, -22) + '-' + nanoid();
        newIdByOldId.set(id, newId);
      }

      const newNodes = cloneDeep(
        get()
          .nodes.filter(({ id }) => copiedNodeIds.includes(id))
          .map((node) => ({
            ...node,
            id: newIdByOldId.get(node.id)!,
            position: {
              ...node.position,
              x: node.position.x + 50,
              y: node.position.y + 50
            }
          }))
      );
      const newEdges = cloneDeep(
        get()
          .edges.filter(
            ({ source, target }) =>
              copiedNodeIds.includes(source) && copiedNodeIds.includes(target)
          )
          .map((edge) => ({
            ...edge,
            id: `edge-${nanoid()}`,
            source: newIdByOldId.get(edge.source)!,
            target: newIdByOldId.get(edge.target)!
          }))
      );

      // TODO Adjust the position of the paste to cursor or current viewport
      get().takeSnapshot();
      set({
        nodes: [
          ...get().nodes.map((node) => ({ ...node, selected: false })),
          ...newNodes.map((node) => ({ ...node, selected: true }))
        ],
        edges: [...get().edges, ...newEdges]
      });
    },

    groupIdToNodeIds: {} as Record<string, string[]>,
    groupIdToEdges: {} as Record<string, { source: string; target: string }[]>,
    nodeIdToGroupId: {} as Record<string, string>,

    calculateNodeGroups: () => {
      const groupIdToNodeIds: Record<string, Set<string>> = {};
      const groupIdToEdges: Record<
        string,
        { source: string; target: string }[]
      > = {};
      const nodeIdToGroupId: Record<string, string> = {};

      get().edges.forEach(({ source, target }) => {
        const sourceGroupId = nodeIdToGroupId[source];
        const sourceNodeIds = groupIdToNodeIds[sourceGroupId];
        const targetGroupId = nodeIdToGroupId[target];
        const targetNodeIds = groupIdToNodeIds[targetGroupId];

        if (sourceGroupId && targetGroupId) {
          if (sourceGroupId !== targetGroupId) {
            for (const nodeId of targetNodeIds) {
              nodeIdToGroupId[nodeId] = sourceGroupId;
            }

            groupIdToNodeIds[sourceGroupId] = new Set([
              ...sourceNodeIds,
              ...targetNodeIds
            ]);
            delete groupIdToNodeIds[targetGroupId];

            groupIdToEdges[sourceGroupId] = [
              { source, target },
              ...groupIdToEdges[sourceGroupId],
              ...groupIdToEdges[targetGroupId]
            ];
            delete groupIdToEdges[targetGroupId];
          }
        } else if (sourceGroupId && !targetGroupId) {
          nodeIdToGroupId[target] = sourceGroupId;
          groupIdToNodeIds[sourceGroupId] = new Set([...sourceNodeIds, target]);
          groupIdToEdges[sourceGroupId].push({ source, target });
        } else if (!sourceGroupId && targetGroupId) {
          nodeIdToGroupId[source] = targetGroupId;
          groupIdToNodeIds[targetGroupId] = new Set([...targetNodeIds, source]);
          groupIdToEdges[targetGroupId].push({ source, target });
        } else {
          const newGroupId = nanoid();
          nodeIdToGroupId[source] = newGroupId;
          nodeIdToGroupId[target] = newGroupId;
          groupIdToNodeIds[newGroupId] = new Set([source, target]);
          groupIdToEdges[newGroupId] = [{ source, target }];
        }
      });

      const groupIdToNodeIdsArray = Object.fromEntries(
        Object.entries(groupIdToNodeIds).map(([groupId, nodeIds]) => [
          groupId,
          [...nodeIds]
        ])
      );

      set({
        groupIdToNodeIds: groupIdToNodeIdsArray,
        groupIdToEdges,
        nodeIdToGroupId
      });
    },

    groupFeedback: {} as Record<string, ConnectedFeedback>,
    generateGroupFeedback: async () => {
      const { groupIdToNodeIds, nodes, groupIdToEdges } = get();
      return Promise.all(
        Object.keys(groupIdToNodeIds).map(async (groupId) => {
          const nodeIds = [...groupIdToNodeIds[groupId]];
          const nodeContent = nodeIds
            .map((nodeId) => nodes.find((node) => node.id === nodeId))
            .filter((node) => node !== undefined)
            .map((node) => ({
              id: node.id,
              type: node.type,
              content: node.data.content
            }));
          const edges = groupIdToEdges[groupId];

          const feedbacks = await generateConnectedFeedback(
            nodeContent,
            edges
          ).then((feedbacks) =>
            feedbacks.filter(({ affectedNodes }) =>
              affectedNodes.every((nodeId) => nodeIds.includes(nodeId))
            )
          );

          return [groupId, feedbacks] as const;
        })
      )
        .then((groupFeedback) => {
          const groupIdToFeedbacks = Object.fromEntries(groupFeedback);
          return groupIdToFeedbacks;
        })
        .then((groupFeedback) => set({ groupFeedback }));
    }
  };
};

export const useStore = create<RFState>()(
  immer(
    persist(createStore, {
      name: 'story-ensemble',
      storage: createJSONStorage(() => indexDbStorage),
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        personaDimensions: state.personaDimensions,
        problemDimensions: state.problemDimensions,
        solutionDimensions: state.solutionDimensions,
        storyboardDimensions: state.storyboardDimensions
      })
    })
  )
);
