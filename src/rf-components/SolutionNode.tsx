import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function SolutionNode(props: NodeProps<NodeData>) {
  const {
    solutionDimensions,
    updateSolutionNode,
    regenerateSolutionNode,
    generateSolutionImage,
    updateNode,
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
        regenerateSolutionNode(props.id, instructions)
      }
      onRegenerateImage={() => generateSolutionImage(props.id)}
      onUpdateDimensions={(newDimensions) => {
        updateNode(props.id, {
          data: {
            dimensions: newDimensions,
            outOfSync: true
          }
        });
      }}
      onGenerateFeedback={() => generateSolutionFeedback(props.id)}
      allDimensions={solutionDimensions}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
