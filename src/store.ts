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
  OnSelectionChangeFunc,
  MarkerType
} from 'reactflow';
import {
  generateStoryboardImagePrompts,
  generateStoryboardOutline
} from './api/storyboards';
import { StylePreset } from './api/stableDiffusion';
import { generateImagePrompt, generateStoryboardTitle, generateInitialSketchStoryboardFrames, refineSketchFrameData, generateImagePromptFromSketch } from './api/openai';
import { generateStoryboardImage } from './api/images';
import { generateSolutions, regenerateSolutions } from './api/solutions';
import { ENABLE_DESIGNER_STORYBOARD_MODE } from './lib/designerMode';
import { DESIGNER_STORYBOARDS, type DesignerVariant } from './data/designerStoryboards';
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
import { createArrowEdge } from './rf-components/ArrowEdge';

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

// Evaluation Phase Types
type AppPhase = 'editor' | 'pre-survey' | 'evaluating' | 'final-storyboard';
type EvalSubStep = 'content-intro' | 'content-q' | 'aesthetics-intro' | 'aesthetics-q';

type EvaluationState = {
  appPhase: AppPhase;
  currentSceneIndex: number;
  evalSubStep: EvalSubStep;
  questionIndex: number;
};

export type FrameComputeResult = {
  caption: string;
  image: string;
  prompt: string;
  auditLog: {
    timestamp: string;
    stepIndex: number;
    userInputs: Record<string, string>;
    aiImagePrompt: string;
    aiCaption: string;
    anchorImageUsed: boolean;
  };
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

  /* Participant landing page */
  designTopic: string;
  setDesignTopic: (topic: string) => void;
  priorExperience: 'yes' | 'no' | null;
  setPriorExperience: (v: 'yes' | 'no' | null) => void;
  hasCompletedLanding: boolean;
  setHasCompletedLanding: (v: boolean) => void;

  /* Evaluation State Machine */
  evaluation: EvaluationState;
  initializeEvaluation: () => void;
  beginEvaluation: () => void;
  advanceEval: () => void;


  /* Personas */
  addEmptyPersonaNode: () => void;
  generatePersonaNodes: (
    context: string,
    numberOfNodes?: number,
    dependencies?: string[],
    options?: { skipAutoImage?: boolean }
  ) => Promise<string[]>;

  startWarmUpPrefetch: () => void;
  consumeWarmUpPrefetch: () => WarmUpPrefetch | null;
  generateMorePersonaNodes: (
    instructions: string,
    personaIds: string[]
  ) => Promise<string[]>;
  regeneratePersonaNodes: (
    personaIds: string[],
    context: string,
    useProblems?: boolean,
    setProblemsOutOfSync?: boolean
  ) => Promise<{
    previousChangedValuesById: Record<string, Record<string, string>>;
    regeneratedImageNodeIds: Promise<string>[];
  }>;
  updatePersonaNode: (
    id: string,
    persona: Partial<Persona>,
    setProblemsOutOfSync?: boolean
  ) => Promise<void>;
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
    context: string,
    useSolutions?: boolean,
    usePersonas?: boolean,
    setSolutionsOutOfSync?: boolean,
    setPersonasOutOfSync?: boolean
  ) => Promise<{
    previousChangedValuesById: Record<string, Record<string, string>>;
    regeneratedImageNodeIds: Promise<string>[];
  }>;
  updateProblemNode: (
    id: string,
    problem: Partial<Problem>,
    setSolutionsOutOfSync?: boolean,
    setPersonasOutOfSync?: boolean
  ) => Promise<void>;

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
    context: string,
    useStoryboards?: boolean,
    useProblems?: boolean,
    setStoryboardsOutOfSync?: boolean,
    setProblemsOutOfSync?: boolean
  ) => Promise<{
    previousChangedValuesById: Record<string, Record<string, string>>;
    regeneratedImageNodeIds: Promise<string>[];
  }>;
  updateSolutionNode: (
    id: string,
    solution: Partial<Solution>,
    setStoryboardsOutOfSync?: boolean,
    setProblemsOutOfSync?: boolean
  ) => Promise<void>;

  generateSolutionImage: (id: string) => Promise<void>;

  /* Storyboards */
  addEmptyStoryboardNode: () => void;
  generateStoryboardNode: (
    context: string,
    personaIds: string[],
    problemIds: string[],
    solutionIds: string[],
    userInterviewXml?: string,
    options?: {
      autoGenerateImages?: boolean;
    }
  ) => Promise<string[]>;
  createBlankStoryboardNode: (
    personaIds: string[],
    problemIds: string[],
    solutionIds: string[]
  ) => string;
  createDesignerStoryboardNode: () => string;
  setDesignerStoryboardFramePick: (
    sbId: string,
    frameIndex: number,
    frame: import('./data/designerStoryboards').DesignerFrame
  ) => void;
  applyDesignerSceneUpdate: (
    sbId: string,
    frameIndex: number,
    update: {
      stage: 'content' | 'aesthetics';
      image?: string;
      caption?: string;
      contentAnswers?: Record<string, string>;
      reflectionAnswers?: Record<string, string>;
      aestheticNotes?: import('./types').DesignerAestheticNotes;
    }
  ) => void;

  /* Admin setup — placeholder storyboard overrides (client-side only) */
  adminSetupOpen: boolean;
  setAdminSetupOpen: (open: boolean) => void;
  adminStoryboardOverrides: Record<string, DesignerVariant>;
  setAdminStoryboardOverride: (storyboardId: string, variant: DesignerVariant) => void;
  clearAdminStoryboardOverride: (storyboardId: string) => void;
  clearAllAdminStoryboardOverrides: () => void;
  getEffectiveDesignerStoryboards: () => DesignerVariant[];

  generateMoreStoryboardNode: (
    instructions: string,
    storyboardIds: string[]
  ) => Promise<string[]>;
  regenerateStoryboardNode: (
    id: string,
    instructions: string,
    setSolutionsOutOfSync?: boolean
  ) => Promise<void>;
  generateInitialSketchStoryboard: (
    nodeId: string,
    answers: Record<string, string>
  ) => Promise<void>;
  refineSketchStoryboardFrame: (
    sbId: string,
    frameIndex: number,
    userFeedback: string
  ) => Promise<void>;
  generateFinalStoryboardImages: (sbId: string) => Promise<void>;
  updateVisualStylePreferences: (
    sbId: string,
    preferences: import('./types').VisualStylePreferences
  ) => void;
  updateStoryboardTitle: (id: string, title: string) => void;
  generateAndSetStoryboardTitle: (
    id: string,
    answers: Record<string, string>
  ) => Promise<void>;
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
  updateStoryboardImage: (id: string, frameIdx: number, image: string) => void;
  updateStoryboardResearchData: (
    id: string,
    researchData: Record<string, string>
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
  preCacheImagePrompt: (
    nodeId: string,
    frameIndex: number,
    answers: Record<string, string>
  ) => void;

  computeStoryboardFrame: (
    nodeId: string,
    frameIndex: number,
    currentAnswers: Record<string, string>,
    options?: { awaitImage?: boolean; imageOnly?: boolean; forcePromptRegeneration?: boolean }
  ) => Promise<FrameComputeResult>;

  writeComputedStoryboardFrame: (
    nodeId: string,
    frameIndex: number,
    result: FrameComputeResult
  ) => void;

  generateSingleStoryboardFrame: (
    nodeId: string,
    frameIndex: number,
    currentAnswers: Record<string, string>,
    options?: { awaitImage?: boolean; imageOnly?: boolean; forcePromptRegeneration?: boolean }
  ) => Promise<void>;

  invalidateFrameImageGen: (nodeId: string, frameIndex: number) => void;

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
    studyEvents: state.studyEvents,
    evaluation: state.evaluation
  };
}


let dimensionChangeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let positionChangeTimeoutId: ReturnType<typeof setTimeout> | null = null;

const imagePromptCache = new Map<string, string>();

type WarmUpPrefetch = {
  personaIdsPromise: Promise<string[]>;
  personaIds: string[] | null;
  imagePromise: Promise<void> | null;
};
let warmUpPrefetch: WarmUpPrefetch | null = null;
// Tracks in-flight generateImagePrompt calls so computeStoryboardFrame can await
// an already-started request rather than firing a duplicate one.
const imagePromptInFlight = new Map<string, Promise<string>>();

// Persona portrait promise — frame image gens await this if no anchor is in the store yet.
let personaImageInFlight: Promise<string> | null = null;

// Per-frame image gen sequence counter — latest-started gen wins when multiple race.
const frameImageGenSeq = new Map<string, number>();

function buildImagePromptCacheKey(
  frameIndex: number,
  answers: Record<string, string>,
  context: string
): string {
  const sorted = Object.fromEntries(
    Object.entries(answers).sort(([a], [b]) => a.localeCompare(b))
  );
  return `${frameIndex}:${JSON.stringify(sorted)}:${context}`;
}

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

    /* Evaluation State Machine */
    evaluation: {
      appPhase: 'editor',
      currentSceneIndex: 0,
      evalSubStep: 'content-intro',
      questionIndex: 0
    },

    initializeEvaluation: () => {
      set((state) => {
        state.evaluation = {
          appPhase: 'pre-survey',
          currentSceneIndex: 0,
          evalSubStep: 'content-intro',
          questionIndex: 0
        };
      });
    },

    beginEvaluation: () => {
      set((state) => {
        state.evaluation = {
          appPhase: 'evaluating',
          currentSceneIndex: 0,
          evalSubStep: 'content-intro',
          questionIndex: 0
        };
      });
    },

    advanceEval: () => {
      set((state) => {
        const evalState = state.evaluation;
        const TOTAL_SCENES = 4;
        const QUESTIONS_PER_SECTION = 3;

        // Only proceed if in evaluating phase
        if (evalState.appPhase !== 'evaluating') return;

        const currentQuestionMax = QUESTIONS_PER_SECTION - 1;

        switch (evalState.evalSubStep) {
          case 'content-intro':
            // Move from content-intro to content-q with questionIndex = 0
            evalState.evalSubStep = 'content-q';
            evalState.questionIndex = 0;
            break;

          case 'content-q':
            if (evalState.questionIndex < currentQuestionMax) {
              // Move to next question in content (0→1, 1→2)
              evalState.questionIndex += 1;
            } else {
              // After content-q3, move to aesthetics-intro
              evalState.evalSubStep = 'aesthetics-intro';
              evalState.questionIndex = 0;
            }
            break;

          case 'aesthetics-intro':
            // Move from aesthetics-intro to aesthetics-q with questionIndex = 0
            evalState.evalSubStep = 'aesthetics-q';
            evalState.questionIndex = 0;
            break;

          case 'aesthetics-q':
            if (evalState.questionIndex < currentQuestionMax) {
              // Move to next question in aesthetics (0→1, 1→2)
              evalState.questionIndex += 1;
            } else {
              // After aesthetics-q3, either go to next scene or finish
              if (evalState.currentSceneIndex < TOTAL_SCENES - 1) {
                // Move to next scene, start at content-intro
                evalState.currentSceneIndex += 1;
                evalState.evalSubStep = 'content-intro';
                evalState.questionIndex = 0;
              } else {
                // All 4 scenes complete, move to final-storyboard
                evalState.appPhase = 'final-storyboard';
                evalState.currentSceneIndex = 0;
                evalState.evalSubStep = 'content-intro';
                evalState.questionIndex = 0;
              }
            }
            break;
        }
      });
    },

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

        // updateNodes(disconnectedNodeIds, (draft) => {
        //   draft.data.outOfSync = true;
        // });

        // const nodeIdsWithoutDependents = get()
        //   .edges.filter((edge) => edgesIdsToRemove.includes(edge.id))
        //   .map((edge) => edge.source);
        // updateNodes(nodeIdsWithoutDependents, (draft) => {
        //   draft.data.dependentsOutOfSync = true;
        // });
      }

      set({
        edges: applyEdgeChanges(changes, get().edges)
      });
    },
    onConnect: (connection: Connection) => {
      get().takeSnapshot();

      const { target, source } = connection;

      const newEdge = createArrowEdge(source as string, target as string);

      set({
        edges: addEdge(newEdge, get().edges)
      });

      // const { target, source } = connection;

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

      const connectionSource = get().connectionSource;
      const targetNode = getNode(target);
      const sourceNode = getNode(source);
      if (!targetNode || !sourceNode || !connectionSource) return;

      const isNodeEmpty = (node: Node) =>
        (node.type === NodeType.Storyboard &&
          !(node.data as StoryboardNodeData)?.storyboard?.title) ||
        (node.type !== NodeType.Storyboard &&
          Object.values(node.data.content).every((value) => !value));

      const isSourceEmpty = isNodeEmpty(getNode(source)!);
      const isTargetEmpty = isNodeEmpty(getNode(target)!);

      if (!isSourceEmpty) {
        updateNode(targetNode.id, (draft) => {
          draft.data.outOfSync = true;
        });
      }

      if (connectionSource === target && !isTargetEmpty) {
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

    designTopic: 'campus lunch decisions',
    setDesignTopic: (topic) => set({ designTopic: topic }),
    priorExperience: null,
    setPriorExperience: (v) => set({ priorExperience: v }),
    hasCompletedLanding: false,
    setHasCompletedLanding: (v) => set({ hasCompletedLanding: v }),

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
      dependencies?: string[],
      options?: { skipAutoImage?: boolean }
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

      if (!options?.skipAutoImage) {
        nodes.forEach((node) => get().generatePersonaImage(node.id));
      }

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
    regeneratePersonaNodes: async (
      personaIds: string[],
      context: string,
      useProblems,
      setProblemsOutOfSync = true
    ) => {
      const personaNodes = get().nodes.filter(
        (node) => node.type === NodeType.Persona && personaIds.includes(node.id)
      );
      const personas = personaNodes.map((node) => {
        if (useProblems) {
          const problemIds = findDirectDependents([node.id], get().edges);
          const problems = get()
            .nodes.filter(
              (node) =>
                problemIds.includes(node.id) && node.type === NodeType.Problem
            )
            .map((node) => node.data.content);

          return {
            problemDependents: problems,
            persona: node.data.content
          };
        } else {
          return node.data.content;
        }
      });

      const newPersonas = await regeneratePersonas(personas, context);

      const regeneratedImageNodeIds = personaIds.map(async (id, idx) => {
        await get().updatePersonaNode(
          id,
          newPersonas[idx],
          setProblemsOutOfSync
        );
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
    updatePersonaNode: async (
      id: string,
      persona: Partial<Persona>,
      setProblemsOutOfSync = true
    ) => {
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
      if (setProblemsOutOfSync) {
        updateNodes(findDirectDependents([id], get().edges), (draft) => {
          draft.data.outOfSync = true;
        });
      }

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

      personaImageInFlight = generateIllustrativeImage(
        `Illustrate persona: ${JSON.stringify(node.data.content)}
        Visual character descriptions: ${JSON.stringify(
          node.data.visualCharacterDescriptions
        )}`
      ).then((image) => {
        get().takeSnapshot();
        updateNode(node.id, (draft) => {
          draft.data.image = image;
        });
        return image;
      }).finally(() => {
        personaImageInFlight = null;
      });

      await personaImageInFlight;
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
        ? personaIds.map((personaId, idx) =>
            createArrowEdge(personaId, nodes[idx].id)
          )
        : personaIds.flatMap((personaId) =>
            nodes.map((node) => createArrowEdge(personaId, node.id))
          );

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, ...nodes],
        edges: [...get().edges, ...edges]
      });

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

      return nodes.map((node) => node.id);
    },
    generateProblemImage: async (id: string) => {
      const node: Node<NodeData> | undefined = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Problem
      );
      if (!node) return;

      // Intentionally no image generation for Problem nodes.
      // Keep textual/context data only to reduce API cost and latency.
      get().takeSnapshot();
      updateNode(id, (draft) => {
        delete draft.data.image;
      });
    },
    regenerateProblemNodes: async (
      problemIds: string[],
      context: string,
      useSolutions = false,
      usePersonas = true,
      setSolutionsOutOfSync = true,
      setPersonasOutOfSync = true
    ) => {
      const problemNodes = get().nodes.filter(
        (node) => node.type === NodeType.Problem && problemIds.includes(node.id)
      );
      const problems = problemNodes.map((node) => {
        const personaIds = findDirectDependencies([node.id], get().edges);
        const personas = get()
          .nodes.filter(
            (node) =>
              personaIds.includes(node.id) && node.type === NodeType.Persona
          )
          .map((node) => node.data.content);

        const solutionIds = findDirectDependents([node.id], get().edges);
        const solutions = get()
          .nodes.filter((node) => solutionIds.includes(node.id))
          .map((node) => node.data.content);

        return {
          personaDependencies: usePersonas ? personas : undefined,
          problem: node.data.content,
          solutionDependents: useSolutions ? solutions : undefined
        };
      });

      const newProblems = await regenerateProblems(problems, context);

      const regeneratedImageNodeIds = problemIds.map(async (id, idx) => {
        await get().updateProblemNode(
          id,
          newProblems[idx],
          setSolutionsOutOfSync,
          setPersonasOutOfSync
        );
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
    updateProblemNode: async (
      id,
      problem,
      setSolutionsOutOfSync,
      setPersonasOutOfSync
    ) => {
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
      if (setSolutionsOutOfSync) {
        updateNodes(findDirectDependents([id], get().edges), (draft) => {
          draft.data.outOfSync = true;
        });
      }

      // Update dependencies
      if (setPersonasOutOfSync) {
        updateNodes(dependencies, (draft) => {
          draft.data.dependentsOutOfSync = true;
        });
      }

      return;
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
        ? problemIds.map((problemId, idx) =>
            createArrowEdge(problemId as string, nodes[idx].id as string)
          )
        : problemIds.flatMap((problemId) =>
            nodes.map((node) =>
              createArrowEdge(problemId as string, node.id as string)
            )
          );

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, ...nodes],
        edges: [...get().edges, ...edges]
      });

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

      return nodes.map((node) => node.id);
    },
    regenerateSolutionNodes: async (
      solutionIds: string[],
      context: string,
      useStoryboards = false,
      useProblems = true,
      setStoryboardsOutOfSync = true,
      setProblemsOutOfSync = true
    ) => {
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

        const storyboardIds = findDirectDependencies([node.id], get().edges);
        const storyboards = get()
          .nodes.filter(
            (node) =>
              storyboardIds.includes(node.id) &&
              node.type === NodeType.Storyboard
          )
          .map((node) => {
            return {
              title: node.data.storyboard.title,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              outline: node.data.storyboard.outline.map((frame: any) => ({
                frameType: frame.frameType,
                description: frame.description,
                caption: frame.caption
              }))
            };
          });

        return {
          problemDependencies: useProblems ? problems : undefined,
          solution: node.data.content,
          storyboardDependents: useStoryboards ? storyboards : undefined
        };
      });

      const newSolutions = await regenerateSolutions(solutions, context);

      const regeneratedImageNodeIds = solutionIds.map(async (id, idx) => {
        await get().updateSolutionNode(
          id,
          newSolutions[idx],
          setStoryboardsOutOfSync,
          setProblemsOutOfSync
        );
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
    updateSolutionNode: async (
      id,
      solution,
      setStoryboardsOutOfSync,
      setProblemsOutOfSync
    ) => {
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
      if (setStoryboardsOutOfSync) {
        updateNodes(findDirectDependents([id], get().edges), (draft) => {
          draft.data.outOfSync = true;
        });
      }

      // Update dependencies
      if (setProblemsOutOfSync) {
        updateNodes(findDirectDependencies([id], get().edges), (draft) => {
          draft.data.dependentsOutOfSync = true;
        });
      }

      return;
    },
    generateSolutionImage: async (id) => {
      const node = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Solution
      );
      if (!node) return;

      // Intentionally no image generation for Solution nodes.
      // Keep textual/context data only to reduce API cost and latency.
      get().takeSnapshot();
      updateNode(node.id, (draft) => {
        delete draft.data.image;
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
              frameType: 'Action',
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
    createDesignerStoryboardNode: () => {
      const center = get().centerPosition;
      const nodePositionAttributes = calculateNodePositionAttributes(
        center,
        1,
        { width: 1600, height: 600, gap: 0 }
      )[0];

      const frameTypes: FrameOutline['frameType'][] = [
        'Context',
        'Problem',
        'Action',
        'Resolution'
      ];

      const node: Node<StoryboardNodeData> = {
        id: `storyboard-${nanoid()}`,
        type: NodeType.Storyboard,
        ...nodePositionAttributes,
        data: {
          content: {},
          visualCharacterDescriptions: [],
          storyboard: {
            title: 'Your storyboard',
            flowMode: 'designer_storyboard',
            outline: frameTypes.map((frameType) => ({
              id: nanoid(),
              frameType,
              description: '',
              caption: '',
              image: '',
              renderMode: 'image' as const
            })),
            artStyle: 'digital-art'
          }
        }
      };

      get().takeSnapshot();
      set({ nodes: [...get().nodes, node] });

      return node.id;
    },

    setDesignerStoryboardFramePick: (sbId, frameIndex, frame) => {
      updateNode<StoryboardNodeData>(sbId, (draft) => {
        const target = draft.data.storyboard.outline[frameIndex];
        if (!target) return;
        target.frameType = frame.frameType;
        target.baseImage = frame.image;
        target.baseCaption = frame.caption;
        target.image = frame.image;
        target.caption = frame.caption;
        target.renderMode = 'image';
        target.imageOutOfSync = false;
      });
    },

    applyDesignerSceneUpdate: (sbId, frameIndex, update) => {
      updateNode<StoryboardNodeData>(sbId, (draft) => {
        const frame = draft.data.storyboard.outline[frameIndex];
        if (!frame) return;

        const captionChanged =
          update.stage === 'content' && typeof update.caption === 'string' && update.caption !== frame.caption;

        if (typeof update.image === 'string') {
          frame.image = update.image;
          frame.imageOutOfSync = false;
        }
        // Aesthetic stage must never change the caption.
        if (update.stage === 'content' && typeof update.caption === 'string') {
          frame.caption = update.caption;
        }
        if (update.contentAnswers) {
          frame.contentAnswers = { ...(frame.contentAnswers ?? {}), ...update.contentAnswers };
        }
        if (update.reflectionAnswers) {
          frame.reflectionAnswers = { ...(frame.reflectionAnswers ?? {}), ...update.reflectionAnswers };
        }
        if (update.aestheticNotes) {
          frame.aestheticNotes = { ...(frame.aestheticNotes ?? {}), ...update.aestheticNotes };
        }

        const entry = {
          stage: update.stage,
          ts: new Date().toISOString(),
          ...(captionChanged ? { captionChanged: true } : {})
        };
        frame.updateHistory = [...(frame.updateHistory ?? []), entry];
      });
    },

    /* Admin setup — placeholder storyboard overrides (client-side only) */
    adminSetupOpen: false,
    setAdminSetupOpen: (open) => set({ adminSetupOpen: open }),
    adminStoryboardOverrides: {},
    setAdminStoryboardOverride: (storyboardId, variant) => {
      set((state) => {
        state.adminStoryboardOverrides[storyboardId] = variant;
      });
    },
    clearAdminStoryboardOverride: (storyboardId) => {
      set((state) => {
        delete state.adminStoryboardOverrides[storyboardId];
      });
    },
    clearAllAdminStoryboardOverrides: () => {
      set((state) => {
        state.adminStoryboardOverrides = {};
      });
    },
    getEffectiveDesignerStoryboards: () => {
      const overrides = get().adminStoryboardOverrides;
      return DESIGNER_STORYBOARDS.map((variant) => overrides[variant.id] ?? variant);
    },

    createBlankStoryboardNode: (_personaIds, _problemIds, solutionIds) => {
      const solutionNodes = get().nodes.filter(
        (node) => node.type === NodeType.Solution && solutionIds.includes(node.id)
      );

      const nodePositionAttribute = calculateDependentNodePositionAttributes(
        solutionNodes,
        'bottom',
        1,
        { width: 1600, height: 600, gap: 0, margin: 150 }
      )[0];

      const frameTypes: FrameOutline['frameType'][] = [
        'Context', 'Problem', 'Action', 'Resolution'
      ];

      const node: Node<StoryboardNodeData> = {
        id: `storyboard-${nanoid()}`,
        type: NodeType.Storyboard,
        ...nodePositionAttribute,
        data: {
          content: {},
          visualCharacterDescriptions: [],
          storyboard: {
            title: '',
            outline: frameTypes.map((frameType) => ({
              id: nanoid(),
              frameType,
              description: '',
              caption: '',
              image: ''
            })),
            artStyle: 'digital-art'
          }
        }
      };

      const edges = solutionIds.map((sourceId) =>
        createArrowEdge(sourceId, node.id)
      );

      get().takeSnapshot();
      set({ nodes: [...get().nodes, node], edges: [...get().edges, ...edges] });

      return node.id;
    },

    generateStoryboardNode: async (
      context: string,
      personaIds: string[],
      problemIds: string[],
      solutionIds: string[],
      userInterviewXml?: string,
      options?: {
        autoGenerateImages?: boolean;
      }
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
          margin: 150
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
          content: userInterviewXml
            ? { userInterviewXml }
            : {},
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
      const edges = solutionIds.map((sourceId) =>
        createArrowEdge(sourceId as string, node.id as string)
      );

      get().takeSnapshot();
      set({
        nodes: [...get().nodes, node],
        edges: [...get().edges, ...edges]
      });

      const shouldAutoGenerateImages = options?.autoGenerateImages ?? true;
      if (shouldAutoGenerateImages) {
        get().generateStoryboardImages(node.id);
      }

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
    regenerateStoryboardNode: async (
      id,
      instructions,
      setSolutionsOutOfSync
    ) => {
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

      // Update dependencies
      if (setSolutionsOutOfSync) {
        updateNodes(findDirectDependencies([id], get().edges), (draft) => {
          draft.data.dependentsOutOfSync = true;
        });
      }

      await get().generateStoryboardImages(id);
    },

    async generateInitialSketchStoryboard(nodeId, answers) {
      if (ENABLE_DESIGNER_STORYBOARD_MODE) {
        console.warn('[DesignerMode] generateInitialSketchStoryboard ignored — standard sketch flow is disabled in designer mode');
        return;
      }
      const storyboardNode: Node<StoryboardNodeData> | undefined = get().nodes.find(
        (node) => node.id === nodeId && node.type === NodeType.Storyboard
      );
      if (!storyboardNode) {
        throw new Error(`[Sketch] Storyboard node not found: ${nodeId}`);
      }

      try {
        // Extract solution context for the sketch generation
        const solutionIds = findDirectDependencies([nodeId], get().edges).filter(
          (depId) => depId.startsWith('solution-')
        );
        const solutionContext = solutionIds
          .map((id) => get().nodes.find((n) => n.id === id))
          .filter(Boolean)
          .map((node) => JSON.stringify(node?.data?.content || {}))
          .join('\n');

        // Generate sketch frames
        const sketchFrames = await generateInitialSketchStoryboardFrames(
          answers,
          solutionContext
        );

        if (!Array.isArray(sketchFrames) || sketchFrames.length !== 4) {
          throw new Error(`[Sketch] Invalid frame count: expected 4, got ${sketchFrames?.length ?? 0}`);
        }

        // Update storyboard with sketch data
        get().takeSnapshot();
        updateNode<StoryboardNodeData>(nodeId, (draft) => {
          draft.data.storyboard.outline.forEach((frame, idx) => {
            if (idx < sketchFrames.length) {
              const sketchData = sketchFrames[idx];
              frame.caption = sketchData.caption;
              frame.sketch = sketchData;
              frame.renderMode = 'sketch';
            }
          });
        });

        console.log('[Sketch] Successfully generated 4 initial sketch frames');
      } catch (error) {
        console.error('[Sketch] Generation failed, will not render sketch mode:', error);
        throw error;
      }
    },

    async refineSketchStoryboardFrame(sbId, frameIndex, userFeedback) {
      const storyboardNode: Node<StoryboardNodeData> | undefined = get().nodes.find(
        (node) => node.id === sbId && node.type === NodeType.Storyboard
      );
      if (!storyboardNode) return;

      const outline = storyboardNode.data.storyboard.outline;
      if (frameIndex < 0 || frameIndex >= outline.length) return;

      const frame = outline[frameIndex];
      if (!frame.sketch) {
        console.warn(`[refineSketchStoryboardFrame] Frame ${frameIndex} has no sketch data`);
        return;
      }

      console.log(`[refineSketchStoryboardFrame] Frame ${frameIndex + 1} old caption: "${frame.caption ?? ''}"`);

      // Build accumulated context from prior frames
      const priorFrames: Record<string, string> = {};
      for (let i = 0; i < frameIndex; i++) {
        const priorFrame = outline[i];
        priorFrames[`frame${i + 1}_caption`] = priorFrame.caption ?? '';
        if (priorFrame.sketch?.frameType) {
          priorFrames[`frame${i + 1}_type`] = priorFrame.sketch.frameType;
        }
      }

      // Refine the sketch
      const refinedSketch = await refineSketchFrameData(
        frame.sketch,
        userFeedback,
        priorFrames
      );

      // Update storyboard with refined sketch
      get().takeSnapshot();
      updateNode<StoryboardNodeData>(sbId, (draft) => {
        const targetFrame = draft.data.storyboard.outline[frameIndex];
        targetFrame.sketch = refinedSketch;
        targetFrame.caption = refinedSketch.caption;
        targetFrame.renderMode = 'sketch';
      });

      console.log(`[refineSketchStoryboardFrame] Frame ${frameIndex + 1} new caption: "${refinedSketch.caption}"`);
    },

    async generateFinalStoryboardImages(sbId) {
      if (ENABLE_DESIGNER_STORYBOARD_MODE) {
        console.warn('[DesignerMode] generateFinalStoryboardImages ignored — designer mode does not run the standard final render');
        return;
      }
      const storyboardNode: Node<StoryboardNodeData> | undefined = get().nodes.find(
        (node) => node.id === sbId && node.type === NodeType.Storyboard
      );
      if (!storyboardNode) return;

      if (!storyboardNode.data.storyboard.storyLocked) {
        throw new Error('[generateFinalStoryboardImages] Story must be locked before final image generation');
      }

      const visualStylePreferences = storyboardNode.data.storyboard.visualStylePreferences;
      if (!visualStylePreferences) {
        console.warn('[generateFinalStoryboardImages] No visual style preferences found');
        return;
      }

      const outline = storyboardNode.data.storyboard.outline;
      if (outline.length === 0) return;

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎨 [FINAL RENDER: START]');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Generating ${outline.length} high-fidelity images from sketches`);
      console.log(`Visual Style: ${visualStylePreferences.visualStyle}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      get().takeSnapshot();

      for (let i = 0; i < outline.length; i++) {
        const frame = outline[i];

        const lockedCaption = frame.caption ?? '';
        console.log(`[generateFinalStoryboardImages] Frame ${i + 1} locked caption before render: "${lockedCaption}"`);

        try {
          const imagePrompt = frame.imagePrompt?.trim()
            || (frame.sketch
              ? await generateImagePromptFromSketch(
                frame.sketch,
                visualStylePreferences,
                lockedCaption,
                storyboardNode.data.visualCharacterDescriptions
              )
              : `Render this exact storyboard frame. Do not change the story. The caption/narrative must remain: "${lockedCaption}". Use the locked frame type ${frame.frameType} and preserve the existing storyboard structure as the source of truth.`);

          updateNode<StoryboardNodeData>(sbId, (draft) => {
            const targetFrame = draft.data.storyboard.outline[i];
            targetFrame.imagePrompt = imagePrompt;
          });

          const anchorImage = await (() => {
            const personaIds = findDirectDependencies([sbId], get().edges).filter(
              (depId) => depId.startsWith('persona-')
            );
            if (personaIds.length > 0) {
              const personaNode = get().nodes.find((n) => n.id === personaIds[0]);
              return personaNode?.data?.image || '';
            }

            const solutionIds = findDirectDependencies([sbId], get().edges).filter(
              (depId) => depId.startsWith('solution-')
            );
            const solutionToProblemIds = findDirectDependencies(solutionIds, get().edges).filter(
              (depId) => depId.startsWith('problem-')
            );
            const deepPersonaIds = findDirectDependencies(solutionToProblemIds, get().edges).filter(
              (depId) => depId.startsWith('persona-')
            );
            if (deepPersonaIds.length > 0) {
              const personaNode = get().nodes.find((n) => n.id === deepPersonaIds[0]);
              return personaNode?.data?.image || '';
            }

            return '';
          })();

          const image = await generateStoryboardImage({
            prompt: imagePrompt,
            stylePreset: storyboardNode.data.storyboard.artStyle,
            referenceImage: anchorImage || undefined,
            size: '1024x1024'
          });

          updateNode<StoryboardNodeData>(sbId, (draft) => {
            const targetFrame = draft.data.storyboard.outline[i];
            targetFrame.image = image;
            targetFrame.renderMode = 'image';
          });

          const afterCaption = get().nodes.find(
            (node) => node.id === sbId && node.type === NodeType.Storyboard
          )?.data.storyboard.outline[i]?.caption ?? '';

          console.log(`[generateFinalStoryboardImages] Frame ${i + 1} locked caption after render: "${afterCaption}"`);
          if (afterCaption !== lockedCaption) {
            throw new Error(
              `[generateFinalStoryboardImages] Caption changed during final render for frame ${i + 1}`
            );
          }
        } catch (error) {
          console.error(`[generateFinalStoryboardImages] Error generating image for frame ${i}:`, error);
        }
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✨ [FINAL RENDER: COMPLETE]');
      console.log(`Generated ${outline.length} high-fidelity images`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    },

    async generateStoryboardImages(id) {
      const storyboard: Node<StoryboardNodeData> | undefined = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Storyboard
      );
      if (!storyboard) return [];

      const outline = storyboard.data.storyboard.outline;
      if (outline.length === 0) return [];

      // 1. EXTRACTION: Find the connected Persona and get the Anchor Image
      const personaIds = findDirectDependencies([id], get().edges).filter(
        (depId) => depId.startsWith('persona-')
      );
      // If the persona isn't directly connected to the storyboard, trace it back through the problem
      let anchorImage = '';
      if (personaIds.length > 0) {
        const personaNode = get().nodes.find(n => n.id === personaIds[0]);
        anchorImage = personaNode?.data?.image || '';
      } else {
        // Fallback: Trace Storyboard -> Solution -> Problem -> Persona
        const solutionIds = findDirectDependencies([id], get().edges).filter(depId => depId.startsWith('solution-'));
        const problemIds = findDirectDependencies(solutionIds, get().edges).filter(depId => depId.startsWith('problem-'));
        const deepPersonaIds = findDirectDependencies(problemIds, get().edges).filter(depId => depId.startsWith('persona-'));
        
        if (deepPersonaIds.length > 0) {
           const personaNode = get().nodes.find(n => n.id === deepPersonaIds[0]);
           anchorImage = personaNode?.data?.image || '';
        }
      }

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
        storyboard.data.visualCharacterDescriptions,
        storyboard.data.content.userInterviewXml
      );

      return imagePrompts.map(async (prompt, idx) => {
        const image = await generateStoryboardImage({
          ...prompt,
          stylePreset: storyboard.data.storyboard.artStyle,
          referenceImage: anchorImage !== '' ? anchorImage : undefined
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

      const solutionIds = findDirectDependencies([id], get().edges).filter(depId => depId.startsWith('solution-'));
      const problemIds = findDirectDependencies(solutionIds, get().edges).filter(depId => depId.startsWith('problem-'));
      const personaIds = findDirectDependencies(problemIds, get().edges).filter(depId => depId.startsWith('persona-'));
      
      let anchorImage = '';
      if (personaIds.length > 0) {
         const personaNode = get().nodes.find(n => n.id === personaIds[0]);
         anchorImage = personaNode?.data?.image || '';
      }

      const imagePrompts = await generateStoryboardImagePrompts(
        outline,
        storyboard.data.visualCharacterDescriptions,
        storyboard.data.content.userInterviewXml
      );

      await Promise.all(
        imagePrompts.map(async (prompt, idx) => {
          if (idx !== frameIdx) return;

          const image = await generateStoryboardImage({
            ...prompt,
            stylePreset: storyboard.data.storyboard.artStyle,
            referenceImage: anchorImage !== '' ? anchorImage : undefined
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

      // Update dependencies
      updateNodes(findDirectDependencies([id], get().edges), (draft) => {
        draft.data.dependentsOutOfSync = true;
      });
    },
    generateAndSetStoryboardTitle: async (id, answers) => {
      const storyboard: Node<StoryboardNodeData> | undefined = get().nodes.find(
        (node) => node.id === id && node.type === NodeType.Storyboard
      );
      if (!storyboard) return;

      const captions = storyboard.data.storyboard.outline.map((f) => f.caption ?? '');

      const solutionIds = findDirectDependencies([id], get().edges).filter((depId) =>
        depId.startsWith('solution-')
      );
      const solutionContext = solutionIds
        .map((sid) => get().nodes.find((n) => n.id === sid))
        .filter(Boolean)
        .map((node) => JSON.stringify(node?.data?.content || {}))
        .join('\n');

      const title = await generateStoryboardTitle(answers, captions, solutionContext);

      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.title = title;
      });
    },
    updateStoryboardDescription: (id, frameIndex, description) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline[frameIndex].description = description;
        draft.data.storyboard.outline[frameIndex].imageOutOfSync = true;
      });

      // Update dependencies
      updateNodes(findDirectDependencies([id], get().edges), (draft) => {
        draft.data.dependentsOutOfSync = true;
      });
    },
    updateStoryboardCaption: (id, frameIndex, caption) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline[frameIndex].caption = caption;
        draft.data.storyboard.outline[frameIndex].imageOutOfSync = true;
      });

      // Update dependencies
      updateNodes(findDirectDependencies([id], get().edges), (draft) => {
        draft.data.dependentsOutOfSync = true;
      });
    },
    updateVisualStylePreferences: (id, preferences) => {
      get().takeSnapshot();
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.visualStylePreferences = preferences;
        draft.data.storyboard.storyLocked = true;
      });
    },
    updateStoryboardImage: (id, frameIndex, image) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline[frameIndex].image = image;
        draft.data.storyboard.outline[frameIndex].imageOutOfSync = false;
      });
    },
    updateStoryboardResearchData: (id, researchData) => {
      get().takeSnapshot();
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.content = {
          ...draft.data.content,
          researchData: JSON.stringify(researchData),
          finalResearchAnswers: JSON.stringify(researchData),
          completedAt: new Date().toISOString()
        };
      });
    },
    updateStoryboardFrameType: (id, frameIndex, frameType) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline[frameIndex].frameType = frameType;
        draft.data.storyboard.outline[frameIndex].imageOutOfSync = true;
      });

      // Update dependencies
      updateNodes(findDirectDependencies([id], get().edges), (draft) => {
        draft.data.dependentsOutOfSync = true;
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

      // Update dependencies
      updateNodes(findDirectDependencies([id], get().edges), (draft) => {
        draft.data.dependentsOutOfSync = true;
      });
    },
    deleteStoryboardFrame: (id, frameIndex) => {
      updateNode<StoryboardNodeData>(id, (draft) => {
        draft.data.storyboard.outline.splice(frameIndex, 1);
      });

      // Update dependencies
      updateNodes(findDirectDependencies([id], get().edges), (draft) => {
        draft.data.dependentsOutOfSync = true;
      });
    },

    startWarmUpPrefetch() {
      if (ENABLE_DESIGNER_STORYBOARD_MODE) {
        console.warn('[DesignerMode] startWarmUpPrefetch ignored — designer mode does not warm up the standard authoring pipeline');
        return;
      }
      // Reset graph and begin background persona generation as soon as Q2 is answered
      set({ nodes: [], edges: [] });

      const contextString = 'College student deciding on campus lunch';
      const projectNodeId = get().addProjectNode({ designContext: contextString });

      const personaIdsPromise = get().generatePersonaNodes(
        contextString, 1, [projectNodeId], { skipAutoImage: true }
      );

      warmUpPrefetch = { personaIdsPromise, personaIds: null, imagePromise: null };

      personaIdsPromise
        .then((personaIds) => {
          if (!warmUpPrefetch) return;
          warmUpPrefetch.personaIds = personaIds;
          if (personaIds[0]) {
            warmUpPrefetch.imagePromise = get().generatePersonaImage(personaIds[0]);
          }
        })
        .catch(() => {
          warmUpPrefetch = null;
        });
    },

    consumeWarmUpPrefetch() {
      const p = warmUpPrefetch;
      warmUpPrefetch = null;
      return p;
    },

    preCacheImagePrompt(nodeId, frameIndex, answers) {
      const solutionIds = findDirectDependencies([nodeId], get().edges).filter(
        (depId) => depId.startsWith('solution-')
      );
      const solutionContext = solutionIds
        .map((id) => get().nodes.find((n) => n.id === id))
        .filter(Boolean)
        .map((node) => JSON.stringify(node?.data?.content || {}))
        .join('\n');

      const key = buildImagePromptCacheKey(frameIndex, answers, solutionContext);
      if (imagePromptCache.has(key) || imagePromptInFlight.has(key)) return;

      const p = generateImagePrompt(frameIndex, answers, solutionContext)
        .then((prompt) => {
          imagePromptCache.set(key, prompt);
          imagePromptInFlight.delete(key);
          return prompt;
        })
        .catch(() => {
          imagePromptInFlight.delete(key);
          return '';
        });

      imagePromptInFlight.set(key, p);
    },

    async computeStoryboardFrame(nodeId, frameIndex, currentAnswers, options = {}) {
      const storyboard: Node<StoryboardNodeData> | undefined = get().nodes.find(
        (node) => node.id === nodeId && node.type === NodeType.Storyboard
      );
      if (!storyboard) throw new Error(`Storyboard ${nodeId} not found`);

      const outline = storyboard.data.storyboard.outline;
      if (!outline[frameIndex]) throw new Error(`Frame index ${frameIndex} not found`);

      // Extract anchor image from connected persona
      const personaIds = findDirectDependencies([nodeId], get().edges).filter(
        (depId) => depId.startsWith('persona-')
      );
      let anchorImage = '';
      if (personaIds.length > 0) {
        const personaNode = get().nodes.find((n) => n.id === personaIds[0]);
        anchorImage = personaNode?.data?.image || '';
      } else {
        // Fallback: Trace Storyboard -> Solution -> Problem -> Persona
        const solutionIds = findDirectDependencies([nodeId], get().edges).filter(
          (depId) => depId.startsWith('solution-')
        );
        const problemIds = findDirectDependencies(solutionIds, get().edges).filter(
          (depId) => depId.startsWith('problem-')
        );
        const deepPersonaIds = findDirectDependencies(problemIds, get().edges).filter(
          (depId) => depId.startsWith('persona-')
        );
        if (deepPersonaIds.length > 0) {
          const personaNode = get().nodes.find((n) => n.id === deepPersonaIds[0]);
          anchorImage = personaNode?.data?.image || '';
        }
      }

      if (!anchorImage) {
        console.warn(
          `⚠️ WARNING: No anchor image found for frame ${frameIndex + 1}! ` +
          `Storyboard: ${nodeId}`
        );
      }

      const solutionIds = findDirectDependencies([nodeId], get().edges).filter(
        (depId) => depId.startsWith('solution-')
      );
      const solutionContext = solutionIds
        .map((id) => get().nodes.find((n) => n.id === id))
        .filter(Boolean)
        .map((node) => JSON.stringify(node?.data?.content || {}))
        .join('\n');

      const storedImagePrompt = options.forcePromptRegeneration
        ? ''
        : (outline[frameIndex].imagePrompt?.trim() || '');

      // Step 1: get imagePrompt — check cache, then in-flight pre-fetch, then generate
      const cacheKey = buildImagePromptCacheKey(frameIndex, currentAnswers, solutionContext);
      let imagePrompt = storedImagePrompt || imagePromptCache.get(cacheKey);
      if (!imagePrompt) {
        const inFlight = imagePromptInFlight.get(cacheKey);
        if (inFlight) {
          await inFlight;
          imagePrompt = imagePromptCache.get(cacheKey) ?? '';
        }
        if (!imagePrompt) {
          imagePrompt = await generateImagePrompt(frameIndex, currentAnswers, solutionContext);
          imagePromptCache.set(cacheKey, imagePrompt);
        }
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎨 [PIPELINE: PARALLEL IMAGE + TEXT GEN]');
      console.log(`Frame: ${frameIndex} | Anchor: ${!!anchorImage} | Cache hit: ${imagePromptCache.has(cacheKey)}`);
      console.log('Image Prompt:', imagePrompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Step 2a: preserve the existing locked caption; do not regenerate story text.
      const caption = outline[frameIndex].caption ?? '';

      // Step 2b: image gen — awaits persona portrait if not yet ready, then generates
      const seqKey = `${nodeId}:${frameIndex}`;
      const seq = (frameImageGenSeq.get(seqKey) ?? 0) + 1;
      frameImageGenSeq.set(seqKey, seq);

      const runImageGen = async (): Promise<string> => {
        let anchor = anchorImage;
        if (!anchor && personaImageInFlight) {
          anchor = await personaImageInFlight;
        }
        return generateStoryboardImage({
          prompt: imagePrompt,
          stylePreset: storyboard.data.storyboard.artStyle,
          referenceImage: anchor !== '' ? anchor : undefined,
          size: '1024x1024'
        });
      };

      const imagePromise = runImageGen().then((img) => {
        if (frameImageGenSeq.get(seqKey) === seq) {
          updateNode<StoryboardNodeData>(nodeId, (draft) => {
            draft.data.storyboard.outline[frameIndex].image = img;
          });
        }
        return img;
      });

      if (options.awaitImage) {
        await imagePromise;
      }

      return {
        caption,
        image: '',
        prompt: imagePrompt,
        auditLog: {
          timestamp: new Date().toISOString(),
          stepIndex: frameIndex,
          userInputs: currentAnswers,
          aiImagePrompt: imagePrompt,
          aiCaption: caption,
          anchorImageUsed: !!anchorImage
        }
      };
    },

    writeComputedStoryboardFrame(nodeId, frameIndex, result) {
      get().takeSnapshot();
      updateNode<StoryboardNodeData>(nodeId, (draft) => {
        draft.data.content = {
          ...draft.data.content,
          [`frame_${frameIndex + 1}_prompt`]: result.prompt,
          [`frame_${frameIndex + 1}_caption`]: result.caption
        };
        if (result.image) draft.data.storyboard.outline[frameIndex].image = result.image;
        draft.data.storyboard.outline[frameIndex].imageOutOfSync = false;
        draft.data.storyboard.outline[frameIndex].auditLog = result.auditLog;
      });
    },

    async generateSingleStoryboardFrame(nodeId, frameIndex, currentAnswers, options) {
      if (ENABLE_DESIGNER_STORYBOARD_MODE) {
        console.warn('[DesignerMode] generateSingleStoryboardFrame ignored — designer mode uses generateDesignerSceneImage instead');
        return;
      }
      const result = await get().computeStoryboardFrame(nodeId, frameIndex, currentAnswers, options);
      get().writeComputedStoryboardFrame(nodeId, frameIndex, result);
    },

    invalidateFrameImageGen(nodeId, frameIndex) {
      const seqKey = `${nodeId}:${frameIndex}`;
      frameImageGenSeq.set(seqKey, (frameImageGenSeq.get(seqKey) ?? 0) + 1);
      updateNode<StoryboardNodeData>(nodeId, (draft) => {
        const frame = draft.data?.storyboard?.outline?.[frameIndex];
        if (frame) {
          frame.image = '';
        }
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
            target: newIdByOldId.get(edge.target)!,
            data: {
              state: {}
            },
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 50,
              height: 50,
              color: '#3facff'
            },
            style: {
              stroke: '#3facff',
              transition: 'ease'
            }
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
