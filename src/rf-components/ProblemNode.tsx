import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function ProblemNode(props: NodeProps<NodeData>) {
  const {
    problemDimensions,
    updateProblemNode,
    regenerateProblemNodes,
    generateProblemImage,
    updateNode,
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
      onRegenerateContent={() => regenerateProblemNodes([props.id])}
      onRegenerateImage={() => generateProblemImage(props.id)}
      onUpdateDimensions={(newDimensions) => {
        updateNode(props.id, {
          data: {
            dimensions: newDimensions,
            outOfSync: true
          }
        });
      }}
      onGenerateFeedback={() => generateProblemFeedback(props.id)}
      allDimensions={problemDimensions}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
