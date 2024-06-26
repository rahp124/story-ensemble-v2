import { useStore } from '@/store';
import { useShallow } from 'zustand/react/shallow';
import { useEffect, useState } from 'react';
import { ConnectedFeedback, generateConnectedFeedback } from '@/api/feedback';

export function useGroupFeedback(
  groupIdToNodeIds: Record<string, Set<string>>,
  groupIdToEdges: Record<string, { source: string; target: string }[]>
) {
  const { nodes } = useStore(
    useShallow((state) => ({
      nodes: state.nodes
    }))
  );

  const [groupFeedback, setGroupFeedback] = useState<
    Record<string, ConnectedFeedback>
  >({});

  useEffect(() => {
    Promise.all(
      Object.keys(groupIdToNodeIds).map(async (groupId) => {
        const nodeIds = [...groupIdToNodeIds[groupId]];
        const nodeContent = nodeIds
          .map((nodeId) => nodes.find((node) => node.id === nodeId))
          .filter((node) => node !== undefined)
          .map((node) => ({
            id: node.id,
            type: node.type,
            content: node.data.content
          }));
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
    ).then((groupFeedback) => {
      const groupIdToFeedbacks = Object.fromEntries(groupFeedback);

      setGroupFeedback(groupIdToFeedbacks);
    });
    // TODO fix useEffect bug, ideally should update when nodes update,
    // but don't want selections to cause feedback regeneration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdToEdges, groupIdToNodeIds]);

  return { groupFeedback };
}
