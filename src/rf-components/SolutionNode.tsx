import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';
import { useDisplayStore } from '@/lib/displayStore';
import { findAllDependents } from '@/lib/graphHelper';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Solution);

export default function SolutionNode(props: NodeProps<NodeData>) {
  const {
    regenerating,
    setRegeneratingNode,

    setPreviousChangedValuesById
  } = useDisplayStore((state) => ({
    regenerating: state.regeneratingNodes.has(props.id),
    setRegeneratingNode: state.setRegeneratingNode,

    setPreviousChangedValuesById: state.setPreviousChangedValuesById
  }));

  const {
    edges,

    generateSolutionImage,
    regenerateSolutionNodes,

    regenerateStoryboardNode
  } = useStore((state) => ({
    edges: state.edges,

    generateSolutionImage: state.generateSolutionImage,
    regenerateSolutionNodes: state.regenerateSolutionNodes,

    regenerateStoryboardNode: state.regenerateStoryboardNode
  }));

  return (
    <BaseNode
      nodeName={
        <>
          <span className="mr-1">{displayAttributes.emoji}</span> Solution
        </>
      }
      nodeProps={props}
      nodeBackgroundClass={displayAttributes.backgroundClass}
      content={props.data.content}
      onRegenerateImage={() => generateSolutionImage(props.id)}
      onSync={async () => {
        if (regenerating) return;

        setRegeneratingNode(props.id, true);

        const {
          previousChangedValuesById: _previousChangedValuesById,
          regeneratedImageNodeIds
        } = await regenerateSolutionNodes(
          [props.id],
          'Regenerate solution based on updated problems'
        );
        setPreviousChangedValuesById(_previousChangedValuesById);

        regeneratedImageNodeIds.forEach(async (idPromise) => {
          setRegeneratingNode(await idPromise, false);
        });
      }}
      onSyncAll={async () => {
        if (regenerating) return;

        setRegeneratingNode(props.id, true);

        const {
          previousChangedValuesById: _previousChangedValuesById,
          regeneratedImageNodeIds
        } = await regenerateSolutionNodes(
          [props.id],
          'Regenerate solution based on updated problems'
        );

        setPreviousChangedValuesById(_previousChangedValuesById);

        regeneratedImageNodeIds.forEach(async (idPromise) => {
          setRegeneratingNode(await idPromise, false);
        });

        const dependentIds = findAllDependents([props.id], edges);

        const storyboardIds = dependentIds.filter((id) =>
          id.startsWith('storyboard-')
        );
        if (storyboardIds.length > 0) {
          await Promise.all(
            storyboardIds.map(async (storyboardId) => {
              setRegeneratingNode(storyboardId, true);

              await regenerateStoryboardNode(
                storyboardId,
                'Regenerate storyboard based on updated personas, problems, and solutions'
              );

              setRegeneratingNode(storyboardId, false);
            })
          );
        }
      }}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
