import { NodeProps } from 'reactflow';
import { PersonaNodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function PersonaNode(props: NodeProps<PersonaNodeData>) {
  const { updatePersonaNode, regeneratePersonaNodes } = useStore();

  return (
    <BaseNode
      nodeName="Persona"
      nodeProps={props}
      nodeBackgroundClass="bg-yellow-100"
      textAreaBackgroundClass="bg-yellow-50"
      content={props.data.persona}
      onUpdateContent={(content) => updatePersonaNode(props.id, content)}
      onRegenerateContent={() => regeneratePersonaNodes([props.id])}
      targetHandle={false}
      sourceHandle={true}
    />
  );
}
