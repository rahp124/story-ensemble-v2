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
  EdgeRemoveChange,
  OnSelectionChangeFunc
} from 'reactflow';
import {
  generateStoryboardImagePrompts,
  generateStoryboardOutline
} from './api/storyboards';
import { generateImage, StylePreset } from './api/stableDiffusion';
import { generateSolutions, regenerateSolutions } from './api/solutions';
import {
  FrameOutline,
  NodeData,
  Persona,
  personaSchema,
  Problem,
  problemSchema,
  solutionSchema,
  Solution,
  StoryboardNodeData
} from './types';
import { generatePersonas, regeneratePersonas } from './api/personas';
import { nanoid } from 'nanoid';
import { NodeType } from './rf-components';
import { generateProblems, regenerateProblems } from './api/problems';
import {
  generateIllustrativeImage,
  generateProblemIllustrativeImage
} from './api/images';
import debounce from 'lodash/debounce';
import { cloneDeep, merge, pick, uniqBy } from 'lodash';
import { WritableDraft } from 'immer';
import {
  calculateDependentNodePositionAttributes,
  calculateNodePositionAttributes
} from './lib/positioningUtils';
import { calculatePreviousChangedValues } from './lib/calculatePreviousChangedValues';
import {
  findDirectDependencies,
  findDirectDependents
} from './lib/graphHelper';
import { generateVisualCharacterDescriptions } from './api/visualCharacterDescription';

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

type StudyEvent = {
  initiator: 'system' | 'user';
  type: string;
  count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
};

type RFState = {
  nodes: Node[];
  setNodes: (nodes: Node[]) => void;

  edges: Edge[];
  setEdges: (edges: Edge[]) => void;

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onSelectionChange: OnSelectionChangeFunc;

  selectNodes: (ids: string[]) => void;

  centerPosition: XYPosition;

  connectionInProgress: boolean;
  connectionSource: string | null;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;

  iterateModalOpen: boolean;
  setIterateModalOpen: (open: boolean) => void;
  iterateModalTab: 'feedback' | 'regenerate' | 'edit' | null;
  setIterateModalTab: (tab: 'feedback' | 'regenerate' | 'edit' | null) => void;

  /* Personas */
  addEmptyPersonaNode: () => void;
  generatePersonaNodes: (
    context: string,
    numberOfNodes?: number,
    dependencies?: string[]
  ) => Promise<string[]>;
  generateMorePersonaNodes: (
    instructions: string,
    personaIds: string[]
  ) => Promise<string[]>;
  regeneratePersonaNodes: (
    personaIds: string[],
    context: string
  ) => Promise<{
    previousChangedValuesById: Record<string, Record<string, string>>;
    regeneratedImageNodeIds: Promise<string>[];
  }>;
  updatePersonaNode: (id: string, persona: Partial<Persona>) => Promise<void>;
  generatePersonaImage: (id: string) => Promise<void>;

  /* Problems */
  addEmptyProblemNode: () => void;
  generateProblemNodes: (
    context: string,
    personaIds: string[],
    oneNodeForEachPersona?: boolean
  ) => Promise<string[]>;
  generateMoreProblemNodes: (
    instructions: string,
    problemIds: string[]
  ) => Promise<string[]>;
  regenerateProblemNodes: (
    problemIds: string[],
    context: string
  ) => Promise<{
    previousChangedValuesById: Record<string, Record<string, string>>;
    regeneratedImageNodeIds: Promise<string>[];
  }>;
  updateProblemNode: (id: string, problem: Partial<Problem>) => Promise<void>;

  generateProblemImage: (id: string) => Promise<void>;

  /* Solutions */
  addEmptySolutionNode: () => void;
  generateSolutionNodes: (
    context: string,
    problemIds: string[],
    oneNodeForEachProblem?: boolean
  ) => Promise<string[]>;
  generateMoreSolutionNodes: (
    instructions: string,
    solutionIds: string[]
  ) => Promise<string[]>;
  regenerateSolutionNodes: (
    solutionIds: string[],
    context: string
  ) => Promise<{
    previousChangedValuesById: Record<string, Record<string, string>>;
    regeneratedImageNodeIds: Promise<string>[];
  }>;
  updateSolutionNode: (
    id: string,
    solution: Partial<Solution>
  ) => Promise<void>;

  generateSolutionImage: (id: string) => Promise<void>;

  /* Storyboards */
  addEmptyStoryboardNode: () => void;
  generateStoryboardNode: (
    context: string,
    personaIds: string[],
    problemIds: string[],
    solutionIds: string[]
  ) => Promise<string[]>;
  generateMoreStoryboardNode: (
    instructions: string,
    storyboardIds: string[]
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
  updateStoryboardFrameType: (
    id: string,
    frameIdx: number,
    frameType: FrameOutline['frameType']
  ) => void;
  updateStoryboardImageStyle: (id: string, imageStyle: StylePreset) => void;

  addStoryboardFrame: (id: string, frameIdx: number) => void;
  deleteStoryboardFrame: (id: string, frameIdx: number) => void;

  generateStoryboardImages: (id: string) => Promise<Promise<number>[]>;
  regenerateStoryboardImage: (id: string, frameIdx: number) => Promise<void>;

  pastStates: Partial<RFState>[];
  futureStates: Partial<RFState>[];

  undo: () => void;
  redo: () => void;
  takeSnapshot: () => void;

  copiedNodeIds: string[];
  copy: () => void;
  paste: () => void;

  addCommentNode: (comment?: string) => string;
  updateCommentNode: (id: string, comment: string) => void;

  addProjectNode: (project: Record<string, string>) => string;

  studyEvents: Array<StudyEvent>;
  addStudyEvent: (event: StudyEvent) => void;
};

function partialize(state: RFState): Partial<RFState> {
  return {
    nodes: state.nodes,
    edges: state.edges,
    studyEvents: state.studyEvents
  };
}

let dimensionChangeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let positionChangeTimeoutId: ReturnType<typeof setTimeout> | null = null;

const createStore: StateCreator<
  RFState,
  [['zustand/immer', never], ['zustand/persist', unknown]]
> = (set, get) => {
  const getNode = <T = NodeData>(id: string) =>
    get().nodes.find((node) => node.id === id) as Node<T> | undefined;

  const updateNode = <T = NodeData>(
    id: string,
    setter: (nodeDraft: WritableDraft<Node<T>>) => void
  ) => {
    set((state) => {
      const index = state.nodes.findIndex((node) => node.id === id);
      if (index === -1) return;

      setter(state.nodes[index]);
    });
  };
  const updateNodes = <T = NodeData>(
    ids: string[],
    setter: (nodeDraft: WritableDraft<Node<T>>) => void
  ) => {
    set((state) => {
      state.nodes.forEach((node) => {
        if (ids.includes(node.id)) {
          setter(node);
        }
      });
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

        get().addStudyEvent({
          initiator: 'user',
          type: 'DISCONNECT_EDGE',
          count: disconnectedNodeIds.length,
          data: {}
        });

        updateNodes(disconnectedNodeIds, (draft) => {
          draft.data.outOfSync = true;
        });

        const nodeIdsWithoutDependents = get()
          .edges.filter((edge) => edgesIdsToRemove.includes(edge.id))
          .map((edge) => edge.source);
        updateNodes(nodeIdsWithoutDependents, (draft) => {
          draft.data.dependentsOutOfSync = true;
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
      const isSolutionToStoryboardConnection =
        source.startsWith('solution') && target.startsWith('storyboard');

      get().addStudyEvent({
        initiator: 'user',
        type: 'CONNECT_EDGE',
        count: 1,
        data: {
          isPersonaToProblemConnection,
          isProblemToSolutionConnection,
          isSolutionToStoryboardConnection
        }
      });

      if (
        !isPersonaToProblemConnection &&
        !isProblemToSolutionConnection &&
        !isSolutionToStoryboardConnection
      )
        return;

      const targetNode = get().nodes.find((node) => node.id === target);
      if (!targetNode) return;
      updateNode(targetNode.id, (draft) => {
        draft.data.outOfSync = true;
      });

      if (get().connectionSource === target) {
        updateNode(source, (draft) => {
          draft.data.dependentsOutOfSync = true;
        });
      }
    },
    onSelectionChange: (params) => {
      const { nodes } = params;

      const selectedNodeIds = new Set(nodes.map((node) => node.id));
      const selectedParentIds = new Set(
        nodes
          .filter((node) => node.id.startsWith('parent-'))
          .map((node) => node.id)
      );

      if (selectedParentIds.size === 0) return;

      const unselectedChildrenIds = get()
        .nodes.filter((node) => {
          return (
            !selectedNodeIds.has(node.id) &&
            node.parentId !== undefined &&
            selectedParentIds.has(node.parentId)
          );
        })
        .map((node) => node.id);

      get().selectNodes([...selectedNodeIds, ...unselectedChildrenIds]);
    },
    selectNodes: (ids: string[]) => {
      set((state) => {
        state.nodes.forEach((node) => {
          node.selected = ids.includes(node.id);
        });
      });
    },

    centerPosition: { x: 0, y: 0 },

    connectionInProgress: false,
    connectionSource: null,
    onConnectStart: (_, params) => {
      set({ connectionInProgress: true, connectionSource: params.nodeId });
    },
    onConnectEnd: () => {
      set({ connectionInProgress: false });
    },

    iterateModalOpen: false,
    setIterateModalOpen: (open) => set({ iterateModalOpen: open }),
    iterateModalTab: null,
    setIterateModalTab: (tab) => set({ iterateModalTab: tab }),

    addCommentNode: (comment = '') => {
      const center = get().centerPosition;

      const id = `comment-${nanoid()}`;
      const node: Node = {
        id,
        type: NodeType.Comment,
        position: center,
        width: 400,
        height: 200,
        style: {
          width: 400,
          height: 200
        },
        data: {
          comment
        }
      };

      get().takeSnapshot();
      set({ nodes: [...get().nodes, node] });

      return id;
    },
    updateCommentNode: (id: string, comment: string) => {
      get().takeSnapshot();
      updateNode<{ comment: string }>(id, (draft) => {
        draft.data.comment = comment;
      });
    },

    addProjectNode: (project) => {
      const center = get().centerPosition;

      const id = `project-${nanoid()}`;
      const node: Node = {
        id,
        type: NodeType.Project,
        position: center,
        width: 400,
        height: 300,
        style: {
          width: 400,
          height: 300
        },
        data: {
          content: project
        }
      };

      get().takeSnapshot();
      set({ nodes: [...get().nodes, node] });

      return id;
    },

    addEmptyPersonaNode: () => {
      const center = get().centerPosition;
      const nodePositionAttributes = calculateNodePositionAttributes(
        center,
        1
      )[0];

      const personaKeys = Object.keys(personaSchema.shape);
      const persona = Object.fromEntries(personaKeys.map((key) => [key, '']));

      const node: Node<NodeData> = {
        id: `persona-${nanoid()}`,
        type: NodeType.Persona,
        ...nodePositionAttributes,
        data: {
          content: persona,
          visualCharacterDescriptions: []
        }
      };

      get().takeSnapshot();
      set({ nodes: [...get().nodes, node] });
    },
    generatePersonaNodes: async (
      context: string,
      numberOfNodes?: number,
      dependencies?: string[]
    ) => {
      const center = get().centerPosition;

      const personas = await generatePersonas(context, numberOfNodes);
      const visualCharacterDescriptions = await Promise.all(
        personas.map((persona) => generateVisualCharacterDescriptions(persona))
      );
      numberOfNodes = personas.length;

      const nodePositionAttributes = !dependencies
        ? calculateNodePositionAttributes(center, numberOfNodes)
        : calculateDependentNodePositionAttributes(
            get().nodes.filter((node) => dependencies.includes(node.id)),
            'bottom',
            numberOfNodes
          );

      const nodes = personas.map((persona, idx) => {
        const node: Node<NodeData> = {
          id: `persona-${nanoid()}`,
          type: NodeType.Persona,
          ...nodePositionAttributes[idx],
          data: {
            content: persona,
            visualCharacterDescriptions: visualCharacterDescriptions[idx]
          }
        };
        return node;
      });

      get().takeSnapshot();
      set({ nodes: [...get().nodes, ...nodes] });

      nodes.forEach((node) => get().generatePersonaImage(node.id));

      return nodes.map((node) => node.id);
    },
    generateMorePersonaNodes: async (
      instructions: string,
      personaIds: string[]
    ) => {
      const personaNodes = get().nodes.filter(
        (node) => node.type === NodeType.Persona && personaIds.includes(node.id)
      );
      const personas = personaNodes.map((node) => node.data.content);

      const context = {
        systemInstructions:
          'Given a list of selected personas and user instructions. Generate more similar, but distinct personas.',
        userInstructions: instructions,
        personas
      };

      const newPersonas = await generatePersonas(context);
      const visualCharacterDescriptions = await Promise.all(
        newPersonas.map((persona) =>
          generateVisualCharacterDescriptions(persona)
        )
      );

      const numberOfNodes = newPersonas.length;
      const nodePositionAttributes = calculateDependentNodePositionAttributes(
        personaNodes,
        'right',
        numberOfNodes
      );

      const nodes: Node<NodeData>[] = newPersonas.map((persona, idx) => ({
        id: `persona-${nanoid()}`,
        type: NodeType.Persona,
        ...nodePositionAttributes[idx],
        data: {
          content: persona,
          visualCharacterDescriptions: visualCharacterDescriptions[idx]
        }
      }));

      get().takeSnapshot();
      set({ nodes: [...get().nodes, ...nodes] });

      nodes.forEach((node) => get().generatePersonaImage(node.id));

      return nodes.map((node) => node.id);
    },
    regeneratePersonaNodes: async (personaIds: string[], context: string) => {
      const personaNodes = get().nodes.filter(
        (node) => node.type === NodeType.Persona && personaIds.includes(node.id)
      );
      const personas = personaNodes.map((node) => node.data.content);

      const newPersonas = await regeneratePersonas(personas, context);

      const regeneratedImageNodeIds = personaIds.map(async (id, idx) => {
        await get().updatePersonaNode(id, newPersonas[idx]);
        return id;
      });

      const previousChangedValuesById: Record<
        string,
        Record<string, string>
      > = Object.fromEntries(
        personaIds.map((id, idx) => {
          const previousChangedValues = calculatePreviousChangedValues(
            personas[idx],
            newPersonas[idx]
          );
          return [id, previousChangedValues];
        })
      );

      return {
        previousChangedValuesById,
        regeneratedImageNodeIds
      };
    },
    updatePersonaNode: async (id: string, persona: Partial<Persona>) => {
      get().takeSnapshot();
      updateNode(id, (draft) => {
        merge(
          draft.data.content,
          pick(persona, Object.keys(draft.data.content))
        );
        draft.data.outOfSync = false;
        draft.data.dependentsOutOfSync = false;
      });

      const node = getNode(id);
      const visualCharacterDescriptions =
        await generateVisualCharacterDescriptions(node!.data.content);
      updateNode(id, (draft) => {
        draft.data.visualCharacterDescriptions = visualCharacterDescriptions;
      });

      // Update dependents
      updateNodes(findDirectDependents([id], get().edges), (draft) => {
        draft.data.outOfSync = true;
      });

      // Update dependencies
      updateNodes(findDirectDependencies([id], get().edges), (draft) => {
        draft.data.dependentsOutOfSync = true;
      });

      return get().generatePersonaImage(id);
    },
    generatePersonaImage: async (id: string) => {
      const node = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Persona
      );
      if (!node) return;

      updateNode(id, (draft) => {
        draft.data.image = '';
      });

      const image = await generateIllustrativeImage(
        `Illustrate persona: ${JSON.stringify(node.data.content)}
        Visual character descriptions: ${JSON.stringify(
          node.data.visualCharacterDescriptions
        )}`
      );

      get().takeSnapshot();
      updateNode(node.id, (draft) => {
        draft.data.image = image;
      });
    },

    addEmptyProblemNode: () => {
      const center = get().centerPosition;
      const nodePositionAttributes = calculateNodePositionAttributes(
        center,
        1
      )[0];

      const problemKeys = Object.keys(problemSchema.shape);
      const problem = Object.fromEntries(problemKeys.map((key) => [key, '']));

      const node: Node<NodeData> = {
        id: `problem-${nanoid()}`,
        type: NodeType.Problem,
        ...nodePositionAttributes,
        data: {
          content: problem,
          visualCharacterDescriptions: []
        }
      };

      get().takeSnapshot();
      set({ nodes: [...get().nodes, node] });
    },
    generateProblemNodes: async (
      context: string,
      personaIds: string[],
      oneNodeForEachPersona = false
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
        oneNodeForEachPersona ? personas.length : undefined
      );
      const numberOfNodes = problems.length;

      const nodePositionAttributes = calculateDependentNodePositionAttributes(
        personaNodes,
        'bottom',
        numberOfNodes
      );

      const nodes: Node<NodeData>[] = await Promise.all(
        problems.map(async (problem, idx) => {
          const visualCharacterDescriptions = oneNodeForEachPersona
            ? personaNodes[idx].data.visualCharacterDescriptions
            : personaNodes.length > 0
            ? personaNodes.flatMap(
                (node) => node.data.visualCharacterDescriptions
              )
            : await generateVisualCharacterDescriptions(problem);

          return {
            id: `problem-${nanoid()}`,
            type: NodeType.Problem,
            ...nodePositionAttributes[idx],
            data: {
              content: problem,
              visualCharacterDescriptions
            }
          };
        })
      );
      const edges = oneNodeForEachPersona
        ? personaIds.map((personaId, idx) => ({
            id: `edge-${nanoid()}`,
            source: personaId,
            target: nodes[idx].id
          }))
        : personaIds.flatMap((personaId) =>
            nodes.map((node) => ({
              id: `edge-${nanoid()}`,
              source: personaId,
              target: node.id
            }))
          );

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, ...nodes],
        edges: [...get().edges, ...edges]
      });

      nodes.forEach((node) => get().generateProblemImage(node.id));

      return nodes.map((node) => node.id);
    },
    generateMoreProblemNodes: async (instructions, problemIds) => {
      const problemNodes = get().nodes.filter(
        (node) => node.type === NodeType.Problem && problemIds.includes(node.id)
      );
      const problems = problemNodes.map((node) => node.data.content);

      const context = {
        systemInstructions:
          'Given a list of selected problems and user instructions, generate more similar, but distinct problems.',
        userInstructions: instructions,
        problems
      };

      const newProblems = await generateProblems(context);
      const visualCharacterDescriptions = await Promise.all(
        newProblems.map((problem) =>
          generateVisualCharacterDescriptions(problem)
        )
      );

      const numberOfNodes = newProblems.length;
      const nodePositionAttributes = calculateDependentNodePositionAttributes(
        problemNodes,
        'right',
        numberOfNodes
      );

      const nodes: Node<NodeData>[] = newProblems.map((problem, idx) => ({
        id: `problem-${nanoid()}`,
        type: NodeType.Problem,
        ...nodePositionAttributes[idx],
        data: {
          content: problem,
          visualCharacterDescriptions: visualCharacterDescriptions[idx]
        }
      }));

      get().takeSnapshot();
      set({ nodes: [...get().nodes, ...nodes] });

      nodes.forEach((node) => get().generateProblemImage(node.id));

      return nodes.map((node) => node.id);
    },
    generateProblemImage: async (id: string) => {
      const node: Node<NodeData> | undefined = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Problem
      );
      if (!node) return;

      updateNode(id, (draft) => {
        draft.data.image = '';
      });

      const image = await generateProblemIllustrativeImage(
        `Illustrate problem: ${JSON.stringify(node.data.content)}
        Visual character descriptions: ${JSON.stringify(
          node.data.visualCharacterDescriptions
        )}`
      );

      get().takeSnapshot();
      updateNode(id, (draft) => {
        draft.data.image = image;
      });
    },
    regenerateProblemNodes: async (problemIds: string[], context: string) => {
      const problemNodes = get().nodes.filter(
        (node) => node.type === NodeType.Problem && problemIds.includes(node.id)
      );
      const problems = problemNodes.map((node) => {
        const personaIds = get()
          .edges.filter(
            (edge) =>
              edge.target === node.id && edge.source.startsWith('persona')
          )
          .map((edge) => edge.source);
        const personas = get()
          .nodes.filter(
            (node) =>
              personaIds.includes(node.id) && node.type === NodeType.Persona
          )
          .map((node) => node.data.content);

        return {
          personaDependencies: personas,
          problem: node.data.content
        };
      });

      const newProblems = await regenerateProblems(problems, context);

      const regeneratedImageNodeIds = problemIds.map(async (id, idx) => {
        await get().updateProblemNode(id, newProblems[idx]);
        return id;
      });

      const previousChangedValuesById: Record<
        string,
        Record<string, string>
      > = Object.fromEntries(
        problemIds.map((id, idx) => {
          const previousChangedValues = calculatePreviousChangedValues(
            problems[idx].problem,
            newProblems[idx]
          );
          return [id, previousChangedValues];
        })
      );

      return { previousChangedValuesById, regeneratedImageNodeIds };
    },
    updateProblemNode: async (id, problem) => {
      get().takeSnapshot();
      updateNode(id, (draft) => {
        merge(
          draft.data.content,
          pick(problem, Object.keys(draft.data.content))
        );
        draft.data.outOfSync = false;
        draft.data.dependentsOutOfSync = false;
      });

      const node = getNode(id);
      const dependencies = findDirectDependencies([id], get().edges);
      const visualCharacterDescriptions =
        dependencies.length > 0
          ? get()
              .nodes.filter((node) => dependencies.includes(node.id))
              .flatMap((node) => node.data.visualCharacterDescriptions)
          : await generateVisualCharacterDescriptions(node!.data.content);
      updateNode(id, (draft) => {
        draft.data.visualCharacterDescriptions = visualCharacterDescriptions;
      });

      // Update dependents
      updateNodes(findDirectDependents([id], get().edges), (draft) => {
        draft.data.outOfSync = true;
      });

      // Update dependencies
      updateNodes(dependencies, (draft) => {
        draft.data.dependentsOutOfSync = true;
      });

      return get().generateProblemImage(id);
    },

    addEmptySolutionNode: () => {
      const center = get().centerPosition;
      const nodePositionAttributes = calculateNodePositionAttributes(
        center,
        1
      )[0];

      const solutionKeys = Object.keys(solutionSchema.shape);
      const solution = Object.fromEntries(solutionKeys.map((key) => [key, '']));

      const node: Node<NodeData> = {
        id: `solution-${nanoid()}`,
        type: NodeType.Solution,
        ...nodePositionAttributes,
        data: {
          content: solution,
          visualCharacterDescriptions: []
        }
      };

      get().takeSnapshot();
      set({ nodes: [...get().nodes, node] });
    },
    generateSolutionNodes: async (
      context: string,
      problemIds: string[],
      oneNodeForEachProblem = false
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
        oneNodeForEachProblem ? problems.length : undefined
      );
      const numberOfNodes = solutions.length;

      const nodePositionAttributes = calculateDependentNodePositionAttributes(
        problemNodes,
        'bottom',
        numberOfNodes
      );

      const nodes: Node<NodeData>[] = await Promise.all(
        solutions.map(async (solution, idx) => {
          const visualCharacterDescriptions = oneNodeForEachProblem
            ? problemNodes[idx].data.visualCharacterDescriptions
            : problemNodes.length > 0
            ? problemNodes.flatMap(
                (node) => node.data.visualCharacterDescriptions
              )
            : await generateVisualCharacterDescriptions(solution);

          return {
            id: `solution-${nanoid()}`,
            type: NodeType.Solution,
            ...nodePositionAttributes[idx],
            data: {
              content: solution,
              visualCharacterDescriptions
            }
          };
        })
      );
      const edges = oneNodeForEachProblem
        ? problemIds.map((problemId, idx) => ({
            id: `edge-${nanoid()}`,
            source: problemId,
            target: nodes[idx].id
          }))
        : problemIds.flatMap((problemId) =>
            nodes.map((node) => ({
              id: `edge-${nanoid()}`,
              source: problemId,
              target: node.id
            }))
          );

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, ...nodes],
        edges: [...get().edges, ...edges]
      });

      nodes.forEach((node) => get().generateSolutionImage(node.id));

      return nodes.map((node) => node.id);
    },
    generateMoreSolutionNodes: async (instructions, solutionIds) => {
      const solutionNodes = get().nodes.filter(
        (node) =>
          node.type === NodeType.Solution && solutionIds.includes(node.id)
      );
      const solutions = solutionNodes.map((node) => node.data.content);

      const context = {
        systemInstructions:
          'Given a list of selected solutions and user instructions, generate more similar, but distinct solutions.',
        userInstructions: instructions,
        solutions
      };

      const newSolutions = await generateSolutions(context);
      const visualCharacterDescriptions = await Promise.all(
        newSolutions.map((solution) =>
          generateVisualCharacterDescriptions(solution)
        )
      );

      const numberOfNodes = newSolutions.length;
      const positionAttributes = calculateDependentNodePositionAttributes(
        solutionNodes,
        'right',
        numberOfNodes
      );

      const nodes: Node<NodeData>[] = newSolutions.map((solution, idx) => ({
        id: `solution-${nanoid()}`,
        type: NodeType.Solution,
        ...positionAttributes[idx],
        data: {
          content: solution,
          visualCharacterDescriptions: visualCharacterDescriptions[idx]
        }
      }));

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, ...nodes]
      });

      nodes.forEach((node) => get().generateSolutionImage(node.id));

      return nodes.map((node) => node.id);
    },
    regenerateSolutionNodes: async (solutionIds: string[], context: string) => {
      const solutionNodes = get().nodes.filter(
        (node) =>
          node.type === NodeType.Solution && solutionIds.includes(node.id)
      );
      const solutions = solutionNodes.map((node) => {
        const problemIds = get()
          .edges.filter(
            (edge) =>
              edge.target === node.id && edge.source.startsWith('problem')
          )
          .map((edge) => edge.source);
        const problems = get()
          .nodes.filter(
            (node) =>
              problemIds.includes(node.id) && node.type === NodeType.Problem
          )
          .map((node) => node.data.content);

        return {
          problemDependencies: problems,
          solution: node.data.content
        };
      });

      const newSolutions = await regenerateSolutions(solutions, context);

      const regeneratedImageNodeIds = solutionIds.map(async (id, idx) => {
        await get().updateSolutionNode(id, newSolutions[idx]);
        return id;
      });

      const previousChangedValuesById: Record<
        string,
        Record<string, string>
      > = Object.fromEntries(
        solutionIds.map((id, idx) => {
          const previousChangedValues = calculatePreviousChangedValues(
            solutions[idx].solution,
            newSolutions[idx]
          );
          return [id, previousChangedValues];
        })
      );

      return { previousChangedValuesById, regeneratedImageNodeIds };
    },
    updateSolutionNode: async (id, solution) => {
      get().takeSnapshot();
      updateNode(id, (draft) => {
        merge(
          draft.data.content,
          pick(solution, Object.keys(draft.data.content))
        );
        draft.data.outOfSync = false;
        draft.data.dependentsOutOfSync = false;
      });

      const node = getNode(id);
      const dependencies = findDirectDependencies([id], get().edges);
      const visualCharacterDescriptions =
        dependencies.length > 0
          ? get()
              .nodes.filter((node) => dependencies.includes(node.id))
              .flatMap((node) => node.data.visualCharacterDescriptions)
          : await generateVisualCharacterDescriptions(node!.data.content);
      updateNode(id, (draft) => {
        draft.data.visualCharacterDescriptions = visualCharacterDescriptions;
      });

      // Update dependents
      updateNodes(findDirectDependents([id], get().edges), (draft) => {
        draft.data.outOfSync = true;
      });

      // Update dependencies
      updateNodes(findDirectDependencies([id], get().edges), (draft) => {
        draft.data.dependentsOutOfSync = true;
      });

      return get().generateSolutionImage(id);
    },
    generateSolutionImage: async (id) => {
      const node = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Solution
      );
      if (!node) return;

      updateNode(id, (draft) => {
        draft.data.image = '';
      });

      const image = await generateIllustrativeImage(
        `Illustrate solution: ${JSON.stringify(node.data.content)}
        Visual character descriptions: ${JSON.stringify(
          node.data.visualCharacterDescriptions
        )}`
      );

      get().takeSnapshot();
      updateNode(node.id, (draft) => {
        draft.data.image = image;
      });
    },

    addEmptyStoryboardNode: () => {
      const center = get().centerPosition;
      const nodePositionAttributes = calculateNodePositionAttributes(
        center,
        1,
        {
          width: 1600,
          height: 600,
          gap: 0
        }
      )[0];

      const data: StoryboardNodeData = {
        content: {},
        visualCharacterDescriptions: [],
        storyboard: {
          title: '',
          outline: [
            {
              id: nanoid(),
              frameType: 'Context',
              description: '',
              caption: ''
            },
            {
              id: nanoid(),
              frameType: 'Problem',
              description: '',
              caption: ''
            },
            {
              id: nanoid(),
              frameType: 'Solution',
              description: '',
              caption: ''
            },
            {
              id: nanoid(),
              frameType: 'Resolution',
              description: '',
              caption: ''
            }
          ],
          artStyle: 'digital-art'
        }
      };

      const node: Node<NodeData> = {
        id: `storyboard-${nanoid()}`,
        type: NodeType.Storyboard,
        ...nodePositionAttributes,
        data
      };

      get().takeSnapshot();
      set({ nodes: [...get().nodes, node] });
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
      const personas = personaNodes.map((node) => node.data.content);

      const problemNodes = get().nodes.filter(
        (node) => node.type === NodeType.Problem && problemIds.includes(node.id)
      );
      const problems = problemNodes.map((node) => node.data.content);

      const solutionNodes = get().nodes.filter(
        (node) =>
          node.type === NodeType.Solution && solutionIds.includes(node.id)
      );
      const solutions = solutionNodes.map((node) => node.data.content);

      const nodePositionAttribute = calculateDependentNodePositionAttributes(
        solutionNodes,
        'bottom',
        1,
        {
          width: 1600,
          height: 600,
          gap: 0,
          margin: 100
        }
      )[0];

      const storyboardData = await generateStoryboardOutline({
        instructions: context,
        personas,
        problems,
        solutions
      });

      let visualCharacterDescriptions = uniqBy(
        [...personaNodes, ...problemNodes, ...solutionNodes].flatMap(
          (node) => node.data.visualCharacterDescriptions
        ),
        'Name'
      );
      if (visualCharacterDescriptions.length === 0) {
        visualCharacterDescriptions = await generateVisualCharacterDescriptions(
          storyboardData
        );
      }

      const node: Node<StoryboardNodeData> = {
        id: `storyboard-${nanoid()}`,
        type: NodeType.Storyboard,
        ...nodePositionAttribute,
        data: {
          content: {},
          visualCharacterDescriptions,
          storyboard: {
            title: storyboardData.title,
            outline: storyboardData.outline.map((frame) => ({
              id: nanoid(),
              ...frame,
              image: ''
            })),
            artStyle: 'digital-art'
          }
        }
      };
      const edges = solutionIds.map((sourceId) => ({
        id: `edge-${nanoid()}`,
        source: sourceId,
        target: node.id
      }));

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, node],
        edges: [...get().edges, ...edges]
      });

      get().generateStoryboardImages(node.id);

      return [node.id];
    },
    generateMoreStoryboardNode: async (instructions, storyboardIds) => {
      const storyboardNodes: Node<StoryboardNodeData>[] = get().nodes.filter(
        (node) =>
          node.type === NodeType.Storyboard && storyboardIds.includes(node.id)
      );
      const storyboards = storyboardNodes.map((node) => ({
        title: node.data.storyboard.title,
        outline: node.data.storyboard.outline.map((frame) => ({
          frameType: frame.frameType,
          description: frame.description,
          caption: frame.caption
        }))
      }));

      const context = {
        systemInstructions:
          'Given a list of selected storyboards and user instructions, generate more similar, but distinct storyboards.',
        userInstructions: instructions,
        storyboards
      };

      const storyboardData = await generateStoryboardOutline(context);
      const visualCharacterDescriptions =
        await generateVisualCharacterDescriptions(storyboardData);

      const nodePositionAttribute = calculateDependentNodePositionAttributes(
        storyboardNodes,
        'right',
        1,
        {
          width: 1600,
          height: 600,
          gap: 0,
          margin: 100
        }
      )[0];

      const node: Node<StoryboardNodeData> = {
        id: `storyboard-${nanoid()}`,
        type: NodeType.Storyboard,
        ...nodePositionAttribute,
        data: {
          content: {},
          visualCharacterDescriptions,
          storyboard: {
            title: storyboardData.title,
            outline: storyboardData.outline.map((frame) => ({
              id: nanoid(),
              ...frame,
              image: ''
            })),
            artStyle: 'digital-art'
          }
        }
      };

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, node]
      });

      get().generateStoryboardImages(node.id);

      return [node.id];
    },
    regenerateStoryboardNode: async (id, instructions) => {
      const storyboardNode = get().nodes.find((node) => node.id === id);
      if (!storyboardNode) return;

      const solutionIds = findDirectDependencies([id], get().edges).filter(
        (id) => id.startsWith('solution-')
      );
      const problemIds = findDirectDependencies(
        solutionIds,
        get().edges
      ).filter((id) => id.startsWith('problem-'));
      const personaIds = findDirectDependencies(problemIds, get().edges).filter(
        (id) => id.startsWith('persona-')
      );

      const personaNodes = get().nodes.filter(
        (node) => node.type === NodeType.Persona && personaIds.includes(node.id)
      );
      const personas = personaNodes.map((node) => node.data.content);
      const problemNodes = get().nodes.filter(
        (node) => node.type === NodeType.Problem && problemIds.includes(node.id)
      );
      const problems = problemNodes.map((node) => node.data.content);
      const solutionNodes = get().nodes.filter(
        (node) =>
          node.type === NodeType.Solution && solutionIds.includes(node.id)
      );
      const solutions = solutionNodes.map((node) => node.data.content);

      const storyboardData = await generateStoryboardOutline({
        personas,
        problems,
        solutions,
        instructions
      });

      let visualCharacterDescriptions = uniqBy(
        [...personaNodes, ...problemNodes, ...solutionNodes].flatMap(
          (node) => node.data.visualCharacterDescriptions
        ),
        'Name'
      );
      if (visualCharacterDescriptions.length === 0) {
        visualCharacterDescriptions = await generateVisualCharacterDescriptions(
          storyboardData
        );
      }

      get().takeSnapshot();
      updateNode<StoryboardNodeData>(id, (draft) => {
        merge(draft.data.storyboard, storyboardData);
        draft.data.visualCharacterDescriptions = visualCharacterDescriptions;
        draft.data.outOfSync = false;
        draft.data.dependentsOutOfSync = false;
      });

      await get().generateStoryboardImages(id);
    },

    async generateStoryboardImages(id) {
      const storyboard: Node<StoryboardNodeData> | undefined = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Storyboard
      );
      if (!storyboard) return [];

      const outline = storyboard.data.storyboard.outline;
      if (outline.length === 0) return [];

      // Hack to display loader
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline = draft.data.storyboard.outline.map(
          (frame) => ({
            ...frame,
            image: ''
          })
        );
      });

      const imagePrompts = await generateStoryboardImagePrompts(
        outline,
        storyboard.data.visualCharacterDescriptions
      );

      return imagePrompts.map(async (prompt, idx) => {
        const image = await generateImage({
          ...prompt,
          stylePreset: storyboard.data.storyboard.artStyle
        });

        get().takeSnapshot();
        updateNode<StoryboardNodeData>(id, (draft) => {
          draft.data.storyboard.outline[idx].image = image;
          draft.data.storyboard.outline[idx].imageOutOfSync = false;
        });

        return idx;
      });
    },
    async regenerateStoryboardImage(id, frameIdx) {
      const storyboard: Node<StoryboardNodeData> | undefined = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Storyboard
      );
      if (!storyboard) return;

      const outline = storyboard.data.storyboard.outline;
      if (outline.length === 0) return;

      const imagePrompts = await generateStoryboardImagePrompts(
        outline,
        storyboard.data.visualCharacterDescriptions
      );

      await Promise.all(
        imagePrompts.map(async (prompt, idx) => {
          if (idx !== frameIdx) return;

          const image = await generateImage({
            ...prompt,
            stylePreset: storyboard.data.storyboard.artStyle
          });

          get().takeSnapshot();
          updateNode<StoryboardNodeData>(id, (draft) => {
            draft.data.storyboard.outline[idx].image = image;
            draft.data.storyboard.outline[idx].imageOutOfSync = false;
          });
        })
      );
    },
    updateStoryboardTitle: (id, title) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.title = title;
        draft.data.storyboard.outline.forEach((frame) => {
          frame.imageOutOfSync = true;
        });
      });
    },
    updateStoryboardDescription: (id, frameIndex, description) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline[frameIndex].description = description;
        draft.data.storyboard.outline[frameIndex].imageOutOfSync = true;
      });
    },
    updateStoryboardCaption: (id, frameIndex, caption) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline[frameIndex].caption = caption;
        draft.data.storyboard.outline[frameIndex].imageOutOfSync = true;
      });
    },
    updateStoryboardFrameType: (id, frameIndex, frameType) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline[frameIndex].frameType = frameType;
        draft.data.storyboard.outline[frameIndex].imageOutOfSync = true;
      });
    },
    updateStoryboardImageStyle: (id, imageStyle) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.artStyle = imageStyle;
        draft.data.storyboard.outline.forEach((frame) => {
          frame.imageOutOfSync = true;
        });
      });
    },

    addStoryboardFrame: (id, frameIndex) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        const prevNode = draft.data.storyboard.outline.at(frameIndex - 1);
        const nextNode = draft.data.storyboard.outline.at(frameIndex);
        const frameType =
          prevNode?.frameType || nextNode?.frameType || 'Context';

        draft.data.storyboard.outline.splice(frameIndex, 0, {
          id: nanoid(),
          frameType,
          description: '',
          caption: ''
        });

        const { width, height } = draft;

        const widthPerFrame = 350;
        const heightPerFrame = 450;

        const availableWidth = width! - 80;
        let framesPerRow = 1;
        while ((framesPerRow + 1) * (widthPerFrame + 24) < availableWidth) {
          framesPerRow++;
        }
        const availableHeight = height! - 24 - 40;
        let numRows = 1;
        while ((numRows + 1) * (24 + heightPerFrame) < availableHeight) {
          numRows++;
        }

        const maxFrames = framesPerRow * numRows;
        if (draft.data.storyboard.outline.length > maxFrames) {
          const heightToAdd = heightPerFrame + 24;
          const newY = draft.position.y + heightToAdd / 2;

          const newHeight = draft.height! + heightToAdd;

          draft.height! = newHeight;
          if (draft.style && draft.style.height) {
            draft.style.height = newHeight;
          }
          draft.position.y = newY;
        }
      });
    },
    deleteStoryboardFrame: (id, frameIndex) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline.splice(frameIndex, 1);
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
          .map((node) => {
            if (node.parentId && newIdByOldId.has(node.parentId)) {
              return {
                ...node,
                id: newIdByOldId.get(node.id)!,
                parentId: newIdByOldId.get(node.parentId)!
              };
            }

            return {
              ...node,
              id: newIdByOldId.get(node.id)!,
              position: {
                ...node.position,
                x: node.position.x + 50,
                y: node.position.y + 50
              }
            };
          })
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

    studyEvents: [],
    addStudyEvent: (event) => {
      set({
        studyEvents: [...get().studyEvents, event]
      });
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
