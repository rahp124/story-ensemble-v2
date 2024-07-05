import { StateCreator, create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as indexDbKv from 'idb-keyval';
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
  generateStoryboardImagePrompts,
  generateStoryboardOutline
} from './api/storyboards';
import { generateImage } from './api/stableDiffusion';
import { generateSolutions, regenerateSolutions } from './api/solutions';
import { FrameOutline, NodeData, StoryboardNodeData } from './types';
import { generatePersonas, regeneratePersonas } from './api/personas';
import { nanoid } from 'nanoid';
import { NodeType } from './rf-components';
import { generateProblems, regenerateProblems } from './api/problems';
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
import {
  calculateNewDependentCenter,
  calculateNodePositionAttributes,
  calculateNodePositionAttributesWithParent
} from './lib/positioningUtils';

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
  setNodes: (nodes: Node[]) => void;

  edges: Edge[];
  setEdges: (edges: Edge[]) => void;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  selectNodes: (ids: string[]) => void;

  centerPosition: XYPosition;

  connectionInProgress: boolean;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;

  globalShowImage: boolean;
  setGlobalShowImage: (show: boolean) => void;

  setNodeOutOfSync: (id: string, outOfSync: boolean) => void;

  /* Personas */
  generatePersonaNodes: (
    context: string,
    numberOfNodes?: number
  ) => Promise<string[]>;
  regeneratePersonaNodes: (
    personaIds: string[],
    context: string
  ) => Promise<void>;
  updatePersonaNode: (id: string, text: string) => Promise<void>;

  generatePersonaImage: (id: string) => Promise<void>;

  generatePersonaFeedback: (id: string) => Promise<void>;

  /* Problems */
  generateProblemNodes: (
    context: string,
    personaIds: string[],
    numberOfNodes?: number
  ) => Promise<string[]>;
  regenerateProblemNodes: (
    problemIds: string[],
    context: string
  ) => Promise<void>;
  updateProblemNode: (id: string, text: string) => void;

  generateProblemImage: (id: string) => Promise<void>;

  generateProblemFeedback: (id: string) => Promise<void>;

  /* Solutions */
  generateSolutionNodes: (
    context: string,
    problemIds: string[],
    numberOfNodes?: number
  ) => Promise<string[]>;
  regenerateSolutionNodes: (
    solutionIds: string[],
    context: string
  ) => Promise<void>;
  updateSolutionNode: (id: string, text: string) => void;

  generateSolutionImage: (id: string) => Promise<void>;

  generateSolutionFeedback: (id: string) => Promise<void>;

  /* Storyboards */
  generateStoryboardNode: (
    context: string,
    personaIds: string[],
    problemIds: string[],
    solutionIds: string[]
  ) => Promise<string[]>;
  regenerateStoryboardNode: (id: string, instructions: string) => Promise<void>;
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

  generateStoryboardImages: (id: string) => Promise<Promise<number>[]>;
  generateStoryboardFeedback: (id: string) => Promise<void>;

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
    edges: state.edges
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
    setNodes: (nodes) => set({ nodes }),

    edges: [],
    setEdges: (edges) => set({ edges }),

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
    selectNodes: (ids: string[]) => {
      set({
        nodes: get().nodes.map((node) => ({
          ...node,
          selected: ids.includes(node.id)
        }))
      });
    },

    centerPosition: { x: 0, y: 0 },

    connectionInProgress: false,
    onConnectStart: () => set({ connectionInProgress: true }),
    onConnectEnd: () => set({ connectionInProgress: false }),

    globalShowImage: false,
    setGlobalShowImage: (showImage: boolean) => {
      set({ globalShowImage: showImage });
    },

    setNodeOutOfSync: (id: string, outOfSync: boolean) => {
      updateNode(id, (draft) => {
        draft.data.outOfSync = outOfSync;
      });
    },

    generatePersonaNodes: async (context: string, numberOfNodes?: number) => {
      const personas = await generatePersonas(context, numberOfNodes);
      numberOfNodes = personas.length;

      const center = get().centerPosition;
      const { parentPositionAttributes, nodesPositionAttributes } =
        calculateNodePositionAttributesWithParent(
          numberOfNodes,
          {
            width: 300,
            height: 300,
            padding: 50,
            parentPadding: 25
          },
          center
        );

      const parentNode: Node = {
        id: `persona-parent-${nanoid()}`,
        type: 'group',
        ...parentPositionAttributes,
        data: {}
      };

      const nodes = personas.map((persona, idx) => {
        const node: Node<NodeData> = {
          id: `persona-${nanoid()}`,
          type: NodeType.Persona,
          parentId: parentNode.id,
          ...nodesPositionAttributes[idx],
          data: {
            content: persona
          }
        };
        return node;
      });

      get().takeSnapshot();
      set({ nodes: [...get().nodes, parentNode, ...nodes] });

      return nodes.map((node) => node.id);
    },
    regeneratePersonaNodes: async (personaIds: string[], context: string) => {
      const personaNodes = get().nodes.filter(
        (node) => node.type === NodeType.Persona && personaIds.includes(node.id)
      );
      const personas = personaNodes.map((node) => node.data.content);

      const newPersonas = await regeneratePersonas(personas, context);

      get().takeSnapshot();
      personaIds.forEach((id, idx) => {
        get().updatePersonaNode(id, newPersonas[idx]);
      });
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

    generateProblemNodes: async (
      context: string,
      personaIds: string[],
      numberOfNodes?: number
    ) => {
      const personaNodes = get().nodes.filter(
        (node) => node.type === NodeType.Persona && personaIds.includes(node.id)
      );
      const personas = personaNodes.map((node) => node.data.content);

      const problems = await generateProblems(
        {
          context,
          personas
        },
        numberOfNodes
      );
      numberOfNodes = problems.length;

      const [width, height, padding, parentPadding, dependencyMargin] = [
        300, 300, 50, 25, 100
      ];
      const parentHeight = height + parentPadding * 2;
      const center = calculateNewDependentCenter(personaNodes, get().nodes, {
        height: parentHeight,
        margin: dependencyMargin
      });
      const { parentPositionAttributes, nodesPositionAttributes } =
        calculateNodePositionAttributesWithParent(
          numberOfNodes,
          {
            width,
            height,
            padding,
            parentPadding
          },
          center
        );

      const parentNode: Node = {
        id: `problem-parent-${nanoid()}`,
        type: 'group',
        ...parentPositionAttributes,
        data: {}
      };

      const nodes: Node<NodeData>[] = problems.map((problem, idx) => ({
        id: `problem-${nanoid()}`,
        type: NodeType.Problem,
        parentId: parentNode.id,
        ...nodesPositionAttributes[idx],
        data: {
          content: problem
        }
      }));
      const edges = personaIds.flatMap((personaId) =>
        nodes.map((node) => ({
          id: `edge-${nanoid()}`,
          source: personaId,
          target: node.id
        }))
      );

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, parentNode, ...nodes],
        edges: [...get().edges, ...edges]
      });

      return nodes.map((node) => node.id);
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
    regenerateProblemNodes: async (problemIds: string[], context: string) => {
      const problemNodes = get().nodes.filter(
        (node) => node.type === NodeType.Problem && problemIds.includes(node.id)
      );
      const problems = problemNodes.map((node) => node.data.content);

      const personaIds = get()
        .edges.filter(
          (edge) =>
            problemIds.includes(edge.target) &&
            edge.source.startsWith('persona')
        )
        .map((edge) => edge.source);
      const personas: string[] = get()
        .nodes.filter(
          (node) =>
            personaIds.includes(node.id) && node.type === NodeType.Persona
        )
        .map((node) => node.data.content);

      const newProblems = await regenerateProblems(problems, {
        context,
        personas
      });

      get().takeSnapshot();
      problemIds.forEach((id, idx) => {
        get().updateProblemNode(id, newProblems[idx]);
      });
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

    generateSolutionNodes: async (
      context: string,
      problemIds: string[],
      numberOfNodes?: number
    ) => {
      const problemNodes = get().nodes.filter(
        (node) => node.type === NodeType.Problem && problemIds.includes(node.id)
      );
      const problems = problemNodes.map((node) => node.data.content);

      const solutions = await generateSolutions(
        {
          context,
          personas: problems
        },
        numberOfNodes
      );
      numberOfNodes = solutions.length;

      const [width, height, padding, parentPadding, dependencyMargin] = [
        300, 300, 50, 25, 100
      ];
      const parentHeight = height + parentPadding * 2;
      const center = calculateNewDependentCenter(problemNodes, get().nodes, {
        height: parentHeight,
        margin: dependencyMargin
      });
      const { parentPositionAttributes, nodesPositionAttributes } =
        calculateNodePositionAttributesWithParent(
          numberOfNodes,
          {
            width,
            height,
            padding,
            parentPadding
          },
          center
        );

      const parentNode: Node = {
        id: `solution-parent-${nanoid()}`,
        type: 'group',
        ...parentPositionAttributes,
        data: {}
      };

      const nodes: Node<NodeData>[] = solutions.map((solution, idx) => ({
        id: `solution-${nanoid()}`,
        type: NodeType.Solution,
        parentId: parentNode.id,
        ...nodesPositionAttributes[idx],
        data: {
          content: solution
        }
      }));
      const edges = problemIds.flatMap((problemId) =>
        nodes.map((node) => ({
          id: `edge-${nanoid()}`,
          source: problemId,
          target: node.id
        }))
      );

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, parentNode, ...nodes],
        edges: [...get().edges, ...edges]
      });

      return nodes.map((node) => node.id);
    },
    regenerateSolutionNodes: async (solutionIds: string[], context: string) => {
      const solutionNodes = get().nodes.filter(
        (node) =>
          node.type === NodeType.Solution && solutionIds.includes(node.id)
      );
      const solutions = solutionNodes.map((node) => node.data.content);

      const problemIds = get()
        .edges.filter(
          (edge) =>
            solutionIds.includes(edge.target) &&
            edge.source.startsWith('problem')
        )
        .map((edge) => edge.source);
      const problems: string[] = get()
        .nodes.filter(
          (node) =>
            problemIds.includes(node.id) && node.type === NodeType.Problem
        )
        .map((node) => node.data.content);

      const newSolutions = await regenerateSolutions(solutions, {
        context,
        problems
      });

      get().takeSnapshot();
      solutionIds.forEach((id, idx) => {
        get().updateSolutionNode(id, newSolutions[idx]);
      });
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

      const [height, width, gap] = [600, 1200, 100];
      const center = calculateNewDependentCenter(dependencyNodes, get().nodes, {
        height,
        margin: gap
      });
      const nodesPositionAttributes = calculateNodePositionAttributes(
        1,
        {
          width,
          height,
          padding: 0
        },
        center
      )[0];

      const storyboardData = await generateStoryboardOutline({
        instructions: context,
        personas,
        problems,
        solutions
      });

      const node: Node<StoryboardNodeData> = {
        id: `storyboard-${nanoid()}`,
        type: NodeType.Storyboard,
        ...nodesPositionAttributes,
        data: {
          content: '',
          storyboard: {
            ...storyboardData,
            numberOfFrames: storyboardData.outline.length,
            artStyle: 'TODO'
          }
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

      const storyboardData = await generateStoryboardOutline({
        personas,
        problems,
        solutions,
        instructions
      });

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

      const imagePrompts = await generateStoryboardImagePrompts(outline);

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
            .map((node) => {
              if (node.type === NodeType.Storyboard) {
                const storyboard: StoryboardNodeData['storyboard'] =
                  node.data.storyboard;
                const sanitizedStoryboard = {
                  title: storyboard.title,
                  outline: storyboard.outline.map((frame) => ({
                    frameType: frame.frameType,
                    description: frame.description,
                    caption: frame.caption
                  }))
                };

                return {
                  id: node.id,
                  type: node.type,
                  content: JSON.stringify(sanitizedStoryboard)
                };
              } else {
                return {
                  id: node.id,
                  type: node.type,
                  content: node.data.content
                };
              }
            });
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
      partialize
    })
  )
);
