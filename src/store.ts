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
import { generateImage } from './api/stableDiffusion';
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
import { generateIllustrativeImage } from './api/images';
import debounce from 'lodash/debounce';
import { cloneDeep, merge, pick } from 'lodash';
import { WritableDraft } from 'immer';
import {
  calculateDependentNodePositionAttributes,
  calculateNodePositionAttributes
} from './lib/positioningUtils';
import { calculatePreviousChangedValues } from './lib/calculatePreviousChangedValues';

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
  onSelectionChange: OnSelectionChangeFunc;

  selectNodes: (ids: string[]) => void;

  centerPosition: XYPosition;

  connectionInProgress: boolean;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;

  globalShowImage: boolean;
  setGlobalShowImage: (show: boolean) => void;

  iterateModalOpen: boolean;
  setIterateModalOpen: (open: boolean) => void;
  iterateModalTab: 'feedback' | 'regenerate' | 'edit' | null;
  setIterateModalTab: (tab: 'feedback' | 'regenerate' | 'edit' | null) => void;

  setNodeOutOfSync: (id: string, outOfSync: boolean) => void;

  /* Personas */
  addEmptyPersonaNode: () => void;
  generatePersonaNodes: (
    context: string,
    numberOfNodes?: number
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
  }>;
  updateProblemNode: (id: string, problem: Partial<Problem>) => void;

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
  }>;
  updateSolutionNode: (id: string, solution: Partial<Solution>) => void;

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

    iterateModalOpen: false,
    setIterateModalOpen: (open) => set({ iterateModalOpen: open }),
    iterateModalTab: null,
    setIterateModalTab: (tab) => set({ iterateModalTab: tab }),

    setNodeOutOfSync: (id: string, outOfSync: boolean) => {
      updateNode(id, (draft) => {
        draft.data.outOfSync = outOfSync;
      });
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
          content: persona
        }
      };

      get().takeSnapshot();
      set({ nodes: [...get().nodes, node] });
    },
    generatePersonaNodes: async (context: string, numberOfNodes?: number) => {
      const center = get().centerPosition;

      const personas = await generatePersonas(context, numberOfNodes);
      numberOfNodes = personas.length;

      const nodePositionAttributes = calculateNodePositionAttributes(
        center,
        numberOfNodes
      );

      const nodes = personas.map((persona, idx) => {
        const node: Node<NodeData> = {
          id: `persona-${nanoid()}`,
          type: NodeType.Persona,
          ...nodePositionAttributes[idx],
          data: {
            content: persona
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
          content: persona
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

      const previousChangedValuesById: Record<
        string,
        Record<string, string>
      > = {};

      get().takeSnapshot();
      personaIds.forEach((id, idx) => {
        const persona = personas[idx];
        const newPersona = newPersonas[idx];
        previousChangedValuesById[id] = calculatePreviousChangedValues(
          persona,
          newPersona
        );

        get().updatePersonaNode(id, newPersonas[idx]);
        updateNode(id, (draft) => {
          draft.data.outOfSync = false;
        });
        get().generatePersonaImage(id);
      });

      return { previousChangedValuesById };
    },
    updatePersonaNode: async (id: string, persona: Partial<Persona>) => {
      get().takeSnapshot();
      updateNode(id, (draft) => {
        merge(
          draft.data.content,
          pick(persona, Object.keys(draft.data.content))
        );
        draft.data.imageOutOfSync = true;
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
        `Illustrate persona: ${JSON.stringify(node.data.content)}`
      );

      get().takeSnapshot();
      updateNode(node.id, (draft) => {
        draft.data.image = image;
        draft.data.imageOutOfSync = false;
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
          content: problem
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

      const nodes: Node<NodeData>[] = problems.map((problem, idx) => ({
        id: `problem-${nanoid()}`,
        type: NodeType.Problem,
        ...nodePositionAttributes[idx],
        data: {
          content: problem
        }
      }));
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
          content: problem
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

      const image = await generateIllustrativeImage(
        `Illustrate problem: ${JSON.stringify(node.data.content)}`
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

      const previousChangedValuesById: Record<
        string,
        Record<string, string>
      > = {};

      get().takeSnapshot();
      problemIds.forEach((id, idx) => {
        const problem = problems[idx].problem;
        const newProblem = newProblems[idx];
        previousChangedValuesById[id] = calculatePreviousChangedValues(
          problem,
          newProblem
        );

        get().updateProblemNode(id, newProblems[idx]);
        updateNode(id, (draft) => {
          draft.data.outOfSync = false;
        });
        get().generateProblemImage(id);
      });

      return { previousChangedValuesById };
    },
    updateProblemNode: (id, problem) => {
      get().takeSnapshot();
      updateNode(id, (draft) => {
        merge(
          draft.data.content,
          pick(problem, Object.keys(draft.data.content))
        );
        draft.data.imageOutOfSync = true;
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
          content: solution
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

      const nodes: Node<NodeData>[] = solutions.map((solution, idx) => ({
        id: `solution-${nanoid()}`,
        type: NodeType.Solution,
        ...nodePositionAttributes[idx],
        data: {
          content: solution
        }
      }));
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
          content: solution
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

      const previousChangedValuesById: Record<
        string,
        Record<string, string>
      > = {};

      get().takeSnapshot();
      solutionIds.forEach((id, idx) => {
        const solution = solutions[idx].solution;
        const newSolution = newSolutions[idx];
        previousChangedValuesById[id] = calculatePreviousChangedValues(
          solution,
          newSolution
        );

        get().updateSolutionNode(id, newSolutions[idx]);
        updateNode(id, (draft) => {
          draft.data.outOfSync = false;
        });
        get().generateSolutionImage(id);
      });

      return { previousChangedValuesById };
    },
    updateSolutionNode: (id, solution) => {
      get().takeSnapshot();
      updateNode(id, (draft) => {
        merge(
          draft.data.content,
          pick(solution, Object.keys(draft.data.content))
        );
        draft.data.imageOutOfSync = true;
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
        `Illustrate solution: ${JSON.stringify(node.data.content)}`
      );

      get().takeSnapshot();
      updateNode(node.id, (draft) => {
        draft.data.image = image;
        draft.data.imageOutOfSync = false;
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

      const dependencyNodes = [
        ...personaNodes,
        ...problemNodes,
        ...solutionNodes
      ];

      const nodePositionAttribute = calculateDependentNodePositionAttributes(
        dependencyNodes,
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

      const node: Node<StoryboardNodeData> = {
        id: `storyboard-${nanoid()}`,
        type: NodeType.Storyboard,
        ...nodePositionAttribute,
        data: {
          content: {},
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
        .map((node) => node.data.content);

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
        .map((node) => node.data.content);

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
        .map((node) => node.data.content);

      const storyboardData = await generateStoryboardOutline({
        personas,
        problems,
        solutions,
        instructions
      });

      get().takeSnapshot();
      updateNode<StoryboardNodeData>(id, (draft) => {
        merge(draft.data.storyboard, storyboardData);
        draft.data.outOfSync = false;
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

      const imagePrompts = await generateStoryboardImagePrompts(outline);

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

      const imagePrompts = await generateStoryboardImagePrompts(outline);

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

    addStoryboardFrame: (id, frameIndex) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline.splice(frameIndex, 0, {
          id: nanoid(),
          frameType: 'Context',
          description: '',
          caption: ''
        });
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
