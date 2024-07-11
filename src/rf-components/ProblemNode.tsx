import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Problem);

export default function ProblemNode(props: NodeProps<NodeData>) {
  const {
    updateProblemNode,
    regenerateProblemNodes,
    generateProblemImage,
    generateProblemFeedback
  } = useStore();

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
      onUpdateContent={(content) => updateProblemNode(props.id, content)}
      onRegenerateContent={(instructions) =>
        regenerateProblemNodes([props.id], instructions)
      }
      onRegenerateImage={() => generateProblemImage(props.id)}
      onGenerateFeedback={() => generateProblemFeedback(props.id)}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
