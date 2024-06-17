import { create } from 'zustand';
import { temporal } from 'zundo';
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
import { generateIllustrativeImage } from './api/images';
import debounce from 'lodash/debounce';

const indexDbStorage: StateStorage = {
  getItem: async (name) => {
    return (await indexDbKv.get(name)) || null;
  },
  setItem: async (name, value) =>
    debounce(async () => {
      await indexDbKv.set(name, value);
    }, 1000),
  removeItem: async (name) => {
    await indexDbKv.del(name);
  }
};

type RFState = {
  nodes: Node[];
  selectedNodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onSelectionChange: OnSelectionChangeFunc;
  updateNode: (id: string, data: Partial<Node>) => void;

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

  generatePersonaDimensions: (context: string) => Promise<void>;
  generatePersonaNodes: (context: string) => Promise<string[]>;
  generatePersonaImage: (id: string) => Promise<void>;
  regeneratePersonaNodes: (ids: string[], instructions?: string) => void;
  updatePersonaNode: (id: string, text: string) => Promise<void>;
  mergePersonaNodes: (
    personaNodes: Node<PersonaNodeData>[],
    instructions?: string
  ) => Promise<void>;

  // Problem
  pinProblemDimension: (id: string, currentValue: string[]) => void;
  generateProblemDimensions: (context: string) => Promise<void>;
  generateProblemNodes: (
    context: string,
    personaIds: string[]
  ) => Promise<string[]>;
  generateProblemImage: (id: string) => Promise<void>;
  regenerateProblemNodes: (ids: string[], instructions?: string) => void;
  updateProblemNode: (id: string, text: string) => void;
  // mergeProblemNodes: (ids: string[]) => Promise<void>;

  // Solution
  pinSolutionDimension: (id: string, currentValue: string[]) => void;
  generateSolutionDimensions: (context: string) => Promise<void>;
  generateSolutionNodes: (
    context: string,
    problemIds: string[]
  ) => Promise<string[]>;
  generateSolutionImage: (id: string) => Promise<void>;
  regenerateSolutionNodes: (ids: string[], instructions?: string) => void;
  updateSolutionNode: (id: string, text: string) => void;
  // mergeSolutionNodes: (ids: string[]) => Promise<void>;

  // Storyboards
  generateStoryboardDimensions: (context: string) => Promise<void>;
  pinStoryboardDimension: (id: string, currentValue: string[]) => void;

  generateStoryboardNode: (
    context: string,
    personaIds: string[],
    problemIds: string[],
    solutionIds: string[]
  ) => Promise<void>;
  regenerateStoryboardNode: (id: string) => Promise<void>;
  generateStoryboardImages: (id: string) => Promise<void>;
};

export const useStore = create<RFState>()(
  persist(
    temporal(
      (set, get) => ({
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
        onSelectionChange: ({ nodes }) => {
          set({
            selectedNodes: nodes
          });
        },
        updateNode: (id: string, data: Partial<Node>) => {
          set((state) => ({
            nodes: state.nodes.map((node) => {
              if (node.id === id) {
                return mergeWith(node, data, (objValue, srcValue, key, obj) => {
                  // Allow setting an undefined value
                  if (
                    objValue !== srcValue &&
                    typeof srcValue === 'undefined'
                  ) {
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
          get().updateNode(id, { data: { outOfSync } });
        },

        updateTextNode: (id: string, text: string) => {
          get().updateNode(id, { data: { text } });
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
        generatePersonaDimensions: async (context: string) => {
          const newDimensions = await generatePersonaDimensions(
            get().personaDimensions,
            context
          );
          set({
            personaDimensions: [...get().personaDimensions, ...newDimensions]
          });
        },
        generatePersonaNodes: async (context: string) => {
          if (get().personaDimensions.length === 0) {
            await get().generatePersonaDimensions(context);
          }

          const dimensionPermutations = generateRandomAssignments(
            get().personaDimensions,
            5
          );

          const ids = await Promise.all(
            dimensionPermutations.map(async (permutation, idx) => {
              const node: Node<PersonaNodeData> = {
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

          get().updateNode(id, {
            data: {
              regeneratingImage: true
            }
          });

          const newImage = await generateIllustrativeImage(
            `Illustarte persona: ${node.data.persona}`
          );

          get().updateNode(node.id, {
            data: { image: newImage, regeneratingImage: false }
          });
        },
        regeneratePersonaNodes: async (
          ids: string[],
          instructions?: string
        ) => {
          const personaNodes = get().nodes.filter(
            (node) => node.type === NodeType.Persona && ids.includes(node.id)
          );
          if (!personaNodes.length) return;

          personaNodes.forEach(async (node) => {
            get().updateNode(node.id, {
              data: { regenerating: true, image: undefined }
            });

            const newPersona = await generatePersona(node.data.dimensions, '');

            get().updatePersonaNode(node.id, newPersona);
            get().updateNode(node.id, {
              data: {
                outOfSync: false,
                regenerating: false
              }
            });

            get().generatePersonaImage(node.id);
          });
        },
        updatePersonaNode: async (id: string, persona: string) => {
          const personaNode = get().nodes.find((node) => node.id === id);
          if (!personaNode || personaNode.type !== NodeType.Persona) return;

          get().updateNode(id, { data: { persona } });

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

          set({ nodes: [...get().nodes, personaNode] });
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
        generateProblemDimensions: async (context: string) => {
          const newDimensions = await generateProblemDimensions(
            get().problemDimensions,
            context
          );
          set({
            problemDimensions: [...get().problemDimensions, ...newDimensions]
          });
        },
        generateProblemNodes: async (context: string, personaIds: string[]) => {
          if (get().problemDimensions.length === 0) {
            await get().generateProblemDimensions(context);
          }
          const dimensionPermutations = generateRandomAssignments(
            get().problemDimensions,
            5
          );

          if (personaIds.length === 0) {
            personaIds = [(await get().generatePersonaNodes(context))[0]];
          }
          const personaContext = get()
            .nodes.filter(
              (node) =>
                node.type === NodeType.Persona && personaIds.includes(node.id)
            )
            .map((node) => node.data.persona)
            .join('\n');

          const ids = await Promise.all(
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
                  problem: await generateProblem(
                    permutation,
                    context + personaContext
                  ),
                  dimensions: permutation
                }
              };
              const edges = personaIds.map((personaId) => ({
                id: `edge-${nanoid()}`,
                source: personaId,
                target: node.id
              }));

              set({
                nodes: [...get().nodes, node],
                edges: [...get().edges, ...edges]
              });

              get().generateProblemImage(node.id);

              return node.id;
            })
          );

          return ids;
        },
        generateProblemImage: async (id: string) => {
          const node = get().nodes.find(
            (node) => node.id === id && node.type === NodeType.Problem
          );
          if (!node) return;

          get().updateNode(id, {
            data: {
              regeneratingImage: true
            }
          });

          const image = await generateIllustrativeImage(
            `Illustrate problem: ${node.data.problem}`
          );

          get().updateNode(id, { data: { image, regeneratingImage: false } });
        },
        regenerateProblemNodes: async (
          ids: string[],
          instructions?: string
        ) => {
          const problemNodes = get().nodes.filter(
            (node) => node.type === NodeType.Problem && ids.includes(node.id)
          );
          if (!problemNodes.length) return;

          problemNodes.forEach(async (node) => {
            get().updateNode(node.id, {
              data: { regenerating: true, image: undefined }
            });

            const personaIds = get()
              .edges.filter(
                (edge) =>
                  edge.target === node.id && edge.source.startsWith('persona')
              )
              .map((edge) => edge.source);
            const personas: string[] = get()
              .nodes.filter(
                (node) =>
                  personaIds.includes(node.id) && node.type === NodeType.Persona
              )
              .map((node) => node.data.persona);
            const context = `Personas: ${personas}`;

            const newProblem = await generateProblem(
              node.data.dimensions,
              context
            );

            get().updateProblemNode(node.id, newProblem);
            get().updateNode(node.id, {
              data: { outOfSync: false, regenerating: false }
            });

            get().generateProblemImage(node.id);
          });
        },
        updateProblemNode: (id: string, problem: string) => {
          const problemNode = get().nodes.find((node) => node.id === id);
          if (!problemNode) return;

          get().updateNode(id, { data: { problem } });

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
        generateSolutionDimensions: async (context: string) => {
          const newDimensions = await generateSolutionDimensions(
            get().solutionDimensions,
            context
          );
          set({
            solutionDimensions: [...get().solutionDimensions, ...newDimensions]
          });
        },
        generateSolutionNodes: async (context, problemIds) => {
          if (get().solutionDimensions.length === 0) {
            await get().generateSolutionDimensions(context);
          }
          const dimensionPermutations = generateRandomAssignments(
            get().solutionDimensions,
            5
          );

          if (problemIds.length === 0) {
            problemIds = [(await get().generateProblemNodes(context, []))[0]];
          }
          const problemContext = get()
            .nodes.filter(
              (node) =>
                node.type === NodeType.Problem && problemIds.includes(node.id)
            )
            .map((node) => node.data.problem)
            .join('\n');

          const ids = await Promise.all(
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
                  solution: await generateSolution(
                    permutation,
                    context + problemContext
                  ),
                  dimensions: permutation
                }
              };

              const edges = problemIds.map((problemId) => ({
                id: `edge-${nanoid()}`,
                source: problemId,
                target: node.id
              }));

              set({
                nodes: [...get().nodes, node],
                edges: [...get().edges, ...edges]
              });

              get().generateSolutionImage(node.id);

              return node.id;
            })
          );

          return ids;
        },
        generateSolutionImage: async (id) => {
          const node = get().nodes.find(
            (node) => node.id === id && node.type === NodeType.Solution
          );
          if (!node) return;

          get().updateNode(node.id, {
            data: {
              regeneratingImage: true
            }
          });

          const image = await generateIllustrativeImage(
            `Illustrate solution: ${node.data.solution}`
          );

          get().updateNode(node.id, {
            data: { image, regeneratingImage: false }
          });
        },
        regenerateSolutionNodes: async (ids, instructions) => {
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
                (edge) =>
                  edge.target === node.id && edge.source.startsWith('problem')
              )
              .map((edge) => edge.source);
            const problems: string[] = get()
              .nodes.filter(
                (node) =>
                  problemIds.includes(node.id) && node.type === NodeType.Problem
              )
              .map((node) => node.data.persona);
            const context = `Problems: ${problems}`;

            const newSolution = await generateSolution(
              node.data.dimensions,
              context
            );

            get().updateSolutionNode(node.id, newSolution);
            get().updateNode(node.id, {
              data: { outOfSync: false, regenerating: false }
            });

            get().generateSolutionImage(node.id);
          });
        },
        updateSolutionNode: (id: string, solution: string) => {
          get().updateNode(id, { data: { solution } });

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

        generateStoryboardDimensions: async (context: string) => {
          const newDimensions = await generateStoryboardDimensions(
            get().storyboardDimensions,
            context
          );

          set({
            storyboardDimensions: [
              ...get().storyboardDimensions,
              ...newDimensions
            ]
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
        generateStoryboardNode: async (
          context: string,
          personaIds: string[],
          problemIds: string[],
          solutionIds: string[]
        ) => {
          const personas = get()
            .nodes.filter(
              (node) =>
                node.type === NodeType.Persona && personaIds.includes(node.id)
            )
            .map((node) => node.data.persona)
            .join('\n');
          const problems = get()
            .nodes.filter(
              (node) =>
                node.type === NodeType.Problem && problemIds.includes(node.id)
            )
            .map((node) => node.data.persona)
            .join('\n');
          const solutions = get().nodes.filter(
            (node) =>
              node.type === NodeType.Solution && solutionIds.includes(node.id)
          );

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
            position: { x: 100, y: 1000 },
            style: {
              width: 1200,
              height: 600
            },
            data: {
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
          set({
            nodes: [...get().nodes, node],
            edges: [...get().edges, ...edges]
          });

          await get().generateStoryboardImages(node.id);
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
              (node) =>
                node.type === NodeType.Persona && personaIds.includes(node.id)
            )
            .map((node) => node.data.persona)
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
            .map((node) => node.data.problem)
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
            .map((node) => node.data.solution)
            .join('\n');

          const fullContext = `Personas: ${personas}\n\nProblems: ${problems}\n\nSolutions: ${solutions}`;

          const storyboardData = await generateStoryboardOutline(
            storyboardNode?.data.dimensions,
            fullContext
          );

          get().updateNode(id, {
            data: {
              storyboard: storyboardData,
              regenerating: false,
              outOfSync: false
            }
          });

          await get().generateStoryboardImages(id);
        },

        generateStoryboardImages: async (id) => {
          const outline: FrameOutline[] = get().nodes.find(
            (node) => node.id === id
          )?.data.storyboard.outline;
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

          get().updateNode(id, { data: { storyboard: { outline: images } } });
        }
      }),
      {
        limit: 100,
        handleSet: (handleSet) => debounce(handleSet, 1000)
      }
    ),
    {
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
    }
  )
);
