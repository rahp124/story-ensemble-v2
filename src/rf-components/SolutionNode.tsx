import { NodeProps } from 'reactflow';
import { SolutionNodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function SolutionNode(props: NodeProps<SolutionNodeData>) {
  const { updateSolutionNode, regenerateSolutionNodes } = useStore();

  return (
    <BaseNode
      nodeProps={props}
      color="blue"
      content={props.data.solution}
      onUpdateContent={(content) => updateSolutionNode(props.id, content)}
      onRegenerateContent={() => regenerateSolutionNodes([props.id])}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
