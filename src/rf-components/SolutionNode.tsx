import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Solution);

export default function SolutionNode(props: NodeProps<NodeData>) {
  const {
    updateSolutionNode,
    regenerateSolutionNodes,
    generateSolutionImage,
    generateSolutionFeedback
  } = useStore();

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
      onUpdateContent={(content) => updateSolutionNode(props.id, content)}
      onRegenerateContent={(instructions) =>
        regenerateSolutionNodes([props.id], instructions)
      }
      onRegenerateImage={() => generateSolutionImage(props.id)}
      onGenerateFeedback={() => generateSolutionFeedback(props.id)}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
