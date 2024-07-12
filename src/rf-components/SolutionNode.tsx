import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Solution);

export default function SolutionNode(props: NodeProps<NodeData>) {
  const generateSolutionImage = useStore(
    (state) => state.generateSolutionImage
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
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
