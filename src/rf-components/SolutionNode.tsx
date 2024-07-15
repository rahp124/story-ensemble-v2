import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Solution);

export default function SolutionNode(props: NodeProps<NodeData>) {
  const { generateSolutionImage, regenerateSolutionNodes } = useStore(
    (state) => ({
      generateSolutionImage: state.generateSolutionImage,
      regenerateSolutionNodes: state.regenerateSolutionNodes
    })
  );

  return (
    <BaseNode
      nodeName={
        <span>
          <span className="mr-1">{displayAttributes.emoji}</span> Solution
        </span>
      }
      nodeProps={props}
      nodeBackgroundClass={displayAttributes.backgroundClass}
      content={props.data.content}
      onRegenerateImage={() => generateSolutionImage(props.id)}
      onSync={async () => {
        const { id } = props;
        const { previousChangedValuesById } = await regenerateSolutionNodes(
          [id],
          'Regenerate solution based on updated problems'
        );
        return { previousChangedValues: previousChangedValuesById[id] };
      }}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
