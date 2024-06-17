import { NodeProps } from 'reactflow';
import { ProblemNodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function ProblemNode(props: NodeProps<ProblemNodeData>) {
  const {
    problemDimensions,
    updateProblemNode,
    regenerateProblemNodes,
    generateProblemImage,
    updateNode
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
      content={props.data.problem}
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
      allDimensions={problemDimensions}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
