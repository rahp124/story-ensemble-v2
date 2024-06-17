import { NodeProps } from 'reactflow';
import { SolutionNodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function SolutionNode(props: NodeProps<SolutionNodeData>) {
  const {
    solutionDimensions,
    updateSolutionNode,
    regenerateSolutionNodes,
    generateSolutionImage
  } = useStore();

  return (
    <BaseNode
      nodeName={
        <span>
          <span className="mr-1">💡</span> Solution
        </span>
      }
      nodeProps={props}
      nodeBackgroundClass="bg-blue-100"
      textAreaBackgroundClass="bg-blue-50"
      content={props.data.solution}
      onUpdateContent={(content) => updateSolutionNode(props.id, content)}
      onRegenerateContent={() => regenerateSolutionNodes([props.id])}
      onRegenerateImage={() => generateSolutionImage(props.id)}
      allDimensions={solutionDimensions}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
