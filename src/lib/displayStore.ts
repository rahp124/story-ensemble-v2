import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type DisplayState = {
  regeneratingNodes: Map<string, true>;
  setRegeneratingNode: (node: string, value: boolean) => void;
  setRegeneratingNodes: (nodes: string[], value: boolean) => void;

  previousChangedValuesById: Record<string, Record<string, string>>;
  setPreviousChangedValuesById: (
    value: Record<string, Record<string, string>>
  ) => void;
  addPreviousChangedValuesById: (
    value: Record<string, Record<string, string>>
  ) => void;
};

enableMapSet();

export const useDisplayStore = create<DisplayState>()(
  immer((set) => ({
    regeneratingNodes: new Map(),
    setRegeneratingNode: (node, value) => {
      set((draft) => {
        if (value) draft.regeneratingNodes.set(node, true);
        else draft.regeneratingNodes.delete(node);
      });
    },
    setRegeneratingNodes: (nodes, value) => {
      set((draft) => {
        nodes.forEach((node) => {
          if (value) draft.regeneratingNodes.set(node, true);
          else draft.regeneratingNodes.delete(node);
        });
      });
    },

    previousChangedValuesById: {},
    setPreviousChangedValuesById: (value) => {
      set({ previousChangedValuesById: value });
    },
    addPreviousChangedValuesById: (value) => {
      set((draft) => {
        Object.entries(value).forEach(([key, value]) => {
          draft.previousChangedValuesById[key] = value;
        });
      });
    }
  }))
);
