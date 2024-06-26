import { useStore } from '@/store';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

export function useNodeGroups() {
  const {
    edges,
    groupIdToNodeIds,
    groupIdToEdges,
    nodeIdToGroupId,
    calculateNodeGroups
  } = useStore(
    useShallow((state) => ({
      edges: state.edges,
      groupIdToNodeIds: state.groupIdToNodeIds,
      groupIdToEdges: state.groupIdToEdges,
      nodeIdToGroupId: state.nodeIdToGroupId,
      calculateNodeGroups: state.calculateNodeGroups
    }))
  );

  useEffect(() => {
    calculateNodeGroups();
  }, [calculateNodeGroups, edges]);

  return { groupIdToNodeIds, groupIdToEdges, nodeIdToGroupId };
}
