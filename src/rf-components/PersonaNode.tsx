import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function PersonaNode(props: NodeProps<NodeData>) {
  const {
    personaDimensions,
    updatePersonaNode,
    regeneratePersonaNodes,
    generatePersonaImage,
    updateNode,
    generatePersonaFeedback
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
      content={props.data.content}
      onUpdateContent={(content) => updatePersonaNode(props.id, content)}
      onRegenerateImage={() => generatePersonaImage(props.id)}
      onRegenerateContent={() => regeneratePersonaNodes([props.id])}
      onUpdateDimensions={(newDimensions) => {
        updateNode(props.id, {
          data: {
            dimensions: newDimensions,
            outOfSync: true
          }
        });
      }}
      onGenerateFeedback={() => generatePersonaFeedback(props.id)}
      allDimensions={personaDimensions}
      targetHandle={false}
      sourceHandle={true}
    />
  );
}
