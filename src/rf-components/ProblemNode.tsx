import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';
import { useDisplayStore } from '@/lib/displayStore';
import { findAllDependents } from '@/lib/graphHelper';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Problem);

export default function ProblemNode(props: NodeProps<NodeData>) {
  const {
    regenerating,
    setRegeneratingNode,

    previousChangedValuesById,
    setPreviousChangedValuesById
  } = useDisplayStore((state) => ({
    regenerating: state.regeneratingNodes.has(props.id),
    setRegeneratingNode: state.setRegeneratingNode,

    previousChangedValuesById: state.previousChangedValuesById,
    setPreviousChangedValuesById: state.setPreviousChangedValuesById
  }));

  const {
    edges,
    generateProblemImage,
    regenerateProblemNodes,
    regenerateSolutionNodes,
    regenerateStoryboardNode
  } = useStore((state) => ({
    edges: state.edges,

    generateProblemImage: state.generateProblemImage,
    regenerateProblemNodes: state.regenerateProblemNodes,

    regenerateSolutionNodes: state.regenerateSolutionNodes,

    regenerateStoryboardNode: state.regenerateStoryboardNode
  }));

  return (
    <BaseNode
      nodeName={
        <span>
          <span className="mr-1">{displayAttributes.emoji}</span> Problem
        </span>
      }
      nodeProps={props}
      nodeBackgroundClass={displayAttributes.backgroundClass}
      content={props.data.content}
      onRegenerateImage={() => generateProblemImage(props.id)}
      onSync={async () => {
        if (regenerating) return;

        setRegeneratingNode(props.id, true);

        const { previousChangedValuesById: _previousChangedValuesById } =
          await regenerateProblemNodes(
            [props.id],
            'Regenerate problem based on updated personas'
          );
        setPreviousChangedValuesById(_previousChangedValuesById);

        setRegeneratingNode(props.id, false);
      }}
      onSyncAll={async () => {
        if (regenerating) return;

        setRegeneratingNode(props.id, true);

        let _previousChangedValuesById = await regenerateProblemNodes(
          [props.id],
          'Regenerate problem based on updated personas'
        ).then((result) => result.previousChangedValuesById);
        setPreviousChangedValuesById(_previousChangedValuesById);

        setRegeneratingNode(props.id, false);

        const dependentIds = findAllDependents([props.id], edges);

        const solutionIds = dependentIds.filter((id) =>
          id.startsWith('solution-')
        );
        if (solutionIds.length > 0) {
          await Promise.all(
            solutionIds.map(async (solutionId) => {
              setRegeneratingNode(solutionId, true);

              _previousChangedValuesById = await regenerateSolutionNodes(
                [solutionId],
                'Regenerate solution based on updated problems'
              ).then((result) => result.previousChangedValuesById);

              setPreviousChangedValuesById({
                ...previousChangedValuesById,
                ..._previousChangedValuesById
              });
              setRegeneratingNode(solutionId, false);
            })
          );
        }

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
