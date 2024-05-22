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
import { StoryboardNodeData } from './rf-components/StoryboardNode';
import { generateImage } from './api/stableDiffusion';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

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

  connectionInProgress: boolean;
  onConnectStart: OnConnectStart;
  onConnectEnd: OnConnectEnd;

  cursorNode: Node | null;
  swapCursorNode: (cursorNode: Node | null) => void;
  updateCursorNodePosition: (position: XYPosition) => void;
  placeCursorNode: () => void;

  updateTextNode: (id: string, text: string) => void;

  updateProblemNode: (id: string, text: string) => void;

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
  nodes: initialNodes,
  selectedNodes: [],
  edges: initialEdges,
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

  updateProblemNode: (id: string, problem: string) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, problem } };
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
