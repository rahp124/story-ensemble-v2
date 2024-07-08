import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

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
          <span className="mr-1">💡</span> Solution
        </span>
      }
      nodeProps={props}
      nodeBackgroundClass="bg-blue-100"
      textAreaBackgroundClass="bg-blue-50"
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
