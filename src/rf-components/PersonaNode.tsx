import { NodeProps } from 'reactflow';
import { PersonaNodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function PersonaNode(props: NodeProps<PersonaNodeData>) {
  const {
    personaDimensions,
    updatePersonaNode,
    regeneratePersonaNodes,
    generatePersonaImage
  } = useStore();

  return (
    <BaseNode
      nodeName={
        <span>
          <span className="mr-1">👤</span> Persona
        </span>
      }
      nodeProps={props}
      nodeBackgroundClass="bg-yellow-100"
      textAreaBackgroundClass="bg-yellow-50"
      content={props.data.persona}
      onUpdateContent={(content) => updatePersonaNode(props.id, content)}
      onRegenerateImage={() => generatePersonaImage(props.id)}
      onRegenerateContent={() => regeneratePersonaNodes([props.id])}
      allDimensions={personaDimensions}
      targetHandle={false}
      sourceHandle={true}
    />
  );
}
