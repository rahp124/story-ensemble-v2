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
  XYPosition
} from 'reactflow';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

type RFState = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;

  cursorNode: Node | null;
  swapCursorNode: (cursorNode: Node | null) => void;
  updateCursorNodePosition: (position: XYPosition) => void;
  placeCursorNode: () => void;

  updateTextNode: (id: string, text: string) => void;
};

const useStore = create<RFState>((set, get) => ({
  nodes: initialNodes,
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
  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },
  setEdges: (edges: Edge[]) => {
    set({ edges });
  },

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
  }
}));

export default useStore;
