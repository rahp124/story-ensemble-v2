import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function ProblemNode(props: NodeProps<NodeData>) {
  const {
    problemDimensions,
    updateProblemNode,
    regenerateProblemNode,
    generateProblemImage,
    updateNodeDimensions,
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
        regenerateProblemNode(props.id, instructions)
      }
      onRegenerateImage={() => generateProblemImage(props.id)}
      onUpdateDimensions={(newDimensions) => {
        updateNodeDimensions(props.id, newDimensions);
      }}
      onGenerateFeedback={() => generateProblemFeedback(props.id)}
      allDimensions={problemDimensions}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
