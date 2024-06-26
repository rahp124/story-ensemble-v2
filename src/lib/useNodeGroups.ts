import { useStore } from '@/store';
import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

export function useNodeGroups() {
  const { edges } = useStore(
    useShallow((state) => ({
      nodes: state.nodes,
      edges: state.edges
    }))
  );

  const nodeGroups = useMemo(() => {
    const groupIdToNodeIds: Record<string, Set<string>> = {};
    const groupIdToEdges: Record<string, { source: string; target: string }[]> =
      {};
    const nodeIdToGroupId: Record<string, string> = {};

    edges.forEach(({ source, target }) => {
      const sourceGroupId = nodeIdToGroupId[source];
      const sourceNodeIds = groupIdToNodeIds[sourceGroupId];
      const targetGroupId = nodeIdToGroupId[target];
      const targetNodeIds = groupIdToNodeIds[targetGroupId];

      if (sourceGroupId && targetGroupId) {
        if (sourceGroupId !== targetGroupId) {
          nodeIdToGroupId[target] = sourceGroupId;

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

    return { groupIdToNodeIds, groupIdToEdges, nodeIdToGroupId };
  }, [edges]);

  return nodeGroups;
}
