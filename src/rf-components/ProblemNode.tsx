import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Problem);

export default function ProblemNode(props: NodeProps<NodeData>) {
  const { generateProblemImage, regenerateProblemNodes } = useStore(
    (state) => ({
      generateProblemImage: state.generateProblemImage,
      regenerateProblemNodes: state.regenerateProblemNodes
    })
  );

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
        const { id } = props;
        const { previousChangedValuesById } = await regenerateProblemNodes(
          [id],
          'Regenerate problem based on updated personas'
        );
        return { previousChangedValues: previousChangedValuesById[id] };
      }}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
