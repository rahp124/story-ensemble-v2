import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';

export default function PersonaNode(props: NodeProps<NodeData>) {
  const {
    personaDimensions,
    updatePersonaNode,
    regeneratePersonaNode,
    generatePersonaImage,
    updateNodeDimensions,
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
      onRegenerateContent={async (instructions) =>
        regeneratePersonaNode(props.id, instructions)
      }
      onUpdateDimensions={(newDimensions) => {
        updateNodeDimensions(props.id, newDimensions);
      }}
      onGenerateFeedback={() => generatePersonaFeedback(props.id)}
      allDimensions={personaDimensions}
      targetHandle={false}
      sourceHandle={true}
    />
  );
}
