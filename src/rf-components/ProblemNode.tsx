import { NodeProps } from 'reactflow';
import { ProblemNodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function ProblemNode(props: NodeProps<ProblemNodeData>) {
  const { updateProblemNode, regenerateProblemNodes } = useStore();

  return (
    <BaseNode
      nodeName="Problem"
      nodeProps={props}
      nodeBackgroundClass="bg-red-100"
      textAreaBackgroundClass="bg-red-50"
      content={props.data.problem}
      onUpdateContent={(content) => updateProblemNode(props.id, content)}
      onRegenerateContent={() => regenerateProblemNodes([props.id])}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
