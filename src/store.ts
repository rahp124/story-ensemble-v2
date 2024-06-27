import { StateCreator, create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as indexDbKv from 'idb-keyval';
import mergeWith from 'lodash/mergeWith';

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
  OnConnectEnd
} from 'reactflow';
import {
  generateStoryboardDimensions,
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
  generateSolutionFeedback
} from './api/feedback';

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

  updateTextNode: (id: string, text: string) => void;

  // Persona
  pinPersonaDimension: (id: string, currentValue: string[]) => void;
  // addPersonaDimension: (dimensionName: string) => void;

  generatePersonaDimensions: (context: string) => Promise<void>;
  generatePersonaNodes: (context: string) => Promise<string[]>;
  generatePersonaImage: (id: string) => Promise<void>;
  regeneratePersonaNodes: (ids: string[]) => void;
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
  regenerateProblemNodes: (ids: string[]) => void;
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
  regenerateSolutionNodes: (ids: string[]) => void;
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
  regenerateStoryboardNode: (id: string) => Promise<void>;
  generateStoryboardImages: (id: string) => Promise<void>;

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

const createStore: StateCreator<RFState> = (set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes: NodeChange[]) => {
    const isRemoveChange = changes.some(({ type }) => type === 'remove');
    const isDimensionChange =
      changes.length === 1 && changes.some(({ type }) => type === 'dimensions');
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
    const isRemoveChange = changes.some(({ type }) => type === 'remove');
    if (isRemoveChange) {
      get().takeSnapshot();
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
  updateNode: (id: string, data: Partial<Node>) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === id) {
          return mergeWith(node, data, (objValue, srcValue, key, obj) => {
            // Allow setting an undefined value
            if (objValue !== srcValue && typeof srcValue === 'undefined') {
              obj[key] = srcValue;
            }
            // Allow setting an empty array
            if (Array.isArray(srcValue) && srcValue.length === 0) {
              return srcValue;
            }
          });
        }
        return node;
      })
    }));
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
    get().updateNode(id, { data: { outOfSync } });
  },

  updateTextNode: (id: string, text: string) => {
    get().updateNode(id, { data: { text } });
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

    get().updateNode(id, { data: { regeneratingImage: true } });

    const image = await generateIllustrativeImage(
      `Illustrate persona: ${node.data.content}`
    );

    get().updateNode(id, { data: { regeneratingImage: false } });
    get().takeSnapshot();
    get().updateNode(node.id, { data: { image } });
  },
  regeneratePersonaNodes: async (ids: string[]) => {
    const personaNodes = get().nodes.filter(
      (node) => node.type === NodeType.Persona && ids.includes(node.id)
    );
    if (!personaNodes.length) return;

    personaNodes.forEach(async (node) => {
      get().updateNode(node.id, { data: { regenerating: true } });

      const newPersona = await generatePersona(node.data.dimensions, '');

      get().updateNode(node.id, { data: { regenerating: false } });
      get().updatePersonaNode(node.id, newPersona); // Takes snapshot
      get().updateNode(node.id, { data: { outOfSync: false } });

      get().generatePersonaImage(node.id);
    });
  },
  updatePersonaNode: async (id: string, persona: string) => {
    const personaNode = get().nodes.find((node) => node.id === id);
    if (!personaNode || personaNode.type !== NodeType.Persona) return;

    get().takeSnapshot();
    get().updateNode(id, {
      data: { content: persona, feedbackOutOfSync: true }
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

    get().updateNode(id, { data: { generatingFeedback: true } });

    const feedback = await generatePersonaFeedback(persona);

    get().updateNode(id, { data: { generatingFeedback: false } });
    get().takeSnapshot();
    get().updateNode(id, { data: { feedback, feedbackOutOfSync: false } });
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
                  y: persona.position.y + persona.height / 2 + height / 2 + gap
                }
              : get().centerPosition;

          console.log(persona, position);

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

    get().updateNode(id, { data: { regeneratingImage: true } });

    const image = await generateIllustrativeImage(
      `Illustrate problem: ${node.data.content}`
    );

    get().updateNode(id, { data: { regeneratingImage: false } });
    get().takeSnapshot();
    get().updateNode(id, { data: { image } });
  },
  regenerateProblemNodes: async (ids: string[]) => {
    const problemNodes = get().nodes.filter(
      (node) => node.type === NodeType.Problem && ids.includes(node.id)
    );
    if (!problemNodes.length) return;

    problemNodes.forEach(async (node) => {
      get().updateNode(node.id, { data: { regenerating: true } });

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
        .map((node) => node.data.content);
      const context = `Personas: ${personas}`;

      const newProblem = await generateProblem(node.data.dimensions, context);

      get().updateNode(node.id, { data: { regenerating: false } });
      get().updateProblemNode(node.id, newProblem); // Takes snapshot
      get().updateNode(node.id, { data: { outOfSync: false } });

      get().generateProblemImage(node.id);
    });
  },
  updateProblemNode: (id: string, problem: string) => {
    const problemNode = get().nodes.find((node) => node.id === id);
    if (!problemNode) return;

    get().takeSnapshot();
    get().updateNode(id, {
      data: { content: problem, feedbackOutOfSync: true }
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

    get().updateNode(id, { data: { generatingFeedback: true } });

    const feedback = await generateProblemFeedback(problem);

    get().updateNode(id, { data: { generatingFeedback: false } });
    get().takeSnapshot();
    get().updateNode(id, { data: { feedback, feedbackOutOfSync: false } });
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
                  y: problem.position.y + problem.height / 2 + height / 2 + gap
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

    get().updateNode(node.id, { data: { regeneratingImage: true } });

    const image = await generateIllustrativeImage(
      `Illustrate solution: ${node.data.content}`
    );

    get().updateNode(node.id, { data: { regeneratingImage: false } });
    get().takeSnapshot();
    get().updateNode(node.id, { data: { image } });
  },
  regenerateSolutionNodes: async (ids) => {
    const solutionNodes = get().nodes.filter(
      (node) => node.type === NodeType.Solution && ids.includes(node.id)
    );
    if (!solutionNodes.length) return;

    solutionNodes.forEach(async (node) => {
      get().updateNode(node.id, {
        data: { regenerating: true, image: undefined }
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
        .map((node) => node.data.content);
      const context = `Problems: ${problems}`;

      const newSolution = await generateSolution(node.data.dimensions, context);

      get().updateNode(node.id, { data: { regenerating: false } });
      get().updateSolutionNode(node.id, newSolution); // Takes snapshot
      get().updateNode(node.id, { data: { outOfSync: false } });

      get().generateSolutionImage(node.id);
    });
  },
  updateSolutionNode: (id: string, solution: string) => {
    get().takeSnapshot();
    get().updateNode(id, {
      data: { content: solution, feedbackOutOfSync: true }
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

    get().updateNode(id, { data: { generatingFeedback: true } });

    const feedback = await generateSolutionFeedback(solution);

    get().updateNode(id, { data: { generatingFeedback: false } });
    get().takeSnapshot();
    get().updateNode(id, { data: { feedback, feedbackOutOfSync: false } });
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
      (node) => node.type === NodeType.Solution && solutionIds.includes(node.id)
    );
    const solutions = solutionNodes.map((node) => node.data.content).join('\n');

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
        storyboard: storyboardData,
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
  regenerateStoryboardNode: async (id) => {
    const storyboardNode = get().nodes.find((node) => node.id === id);
    if (!storyboardNode) return;

    get().updateNode(id, { data: { regenerating: true } });

    const personaIds = get()
      .edges.filter(
        (edge) => edge.target === id && edge.source.startsWith('persona')
      )
      .map((edge) => edge.source);
    const personas = get()
      .nodes.filter(
        (node) => node.type === NodeType.Persona && personaIds.includes(node.id)
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
        (node) => node.type === NodeType.Problem && problemIds.includes(node.id)
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

    const fullContext = `Personas: ${personas}\n\nProblems: ${problems}\n\nSolutions: ${solutions}`;

    const storyboardData = await generateStoryboardOutline(
      storyboardNode?.data.dimensions,
      fullContext
    );

    get().updateNode(id, { data: { regenerating: false } });
    get().takeSnapshot();
    get().updateNode(id, {
      data: {
        storyboard: storyboardData,
        outOfSync: false
      }
    });

    await get().generateStoryboardImages(id);
  },

  generateStoryboardImages: async (id) => {
    const outline: FrameOutline[] = get().nodes.find((node) => node.id === id)
      ?.data.storyboard.outline;
    if (!outline) return;

    get().updateNode(id, { data: { regeneratingImage: true } });

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

    get().updateNode(id, { data: { regeneratingImage: false } });
    get().takeSnapshot();
    get().updateNode(id, { data: { storyboard: { outline: images } } });
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
    const snapshotWithoutLoading = {
      ...snapshot,
      nodes: snapshot.nodes?.map((node) => ({
        ...node,
        data: {
          ...node.data,
          regenerating: false,
          regeneratingImage: false
        }
      }))
    };

    set({
      pastStates: [...get().pastStates, snapshotWithoutLoading],
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
          },
          data: {
            ...node.data,
            regenerating: false,
            regeneratingImage: false
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
    const groupIdToEdges: Record<string, { source: string; target: string }[]> =
      {};
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
});

export const useStore = create<RFState>()(
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
);
