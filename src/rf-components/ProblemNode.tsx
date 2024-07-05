import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

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
          <span className="mr-1">🚨</span> Problem
        </span>
      }
      nodeProps={props}
      nodeBackgroundClass="bg-red-100"
      textAreaBackgroundClass="bg-red-50"
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
