import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Persona);

export default function PersonaNode(props: NodeProps<NodeData>) {
  const {
    updatePersonaNode,
    regeneratePersonaNodes,

    generatePersonaImage,
    generatePersonaFeedback
  } = useStore();

  return (
    <BaseNode
      nodeName={
        <span>
          <span className="mr-1">{displayAttributes.emoji}</span> Persona
        </span>
      }
      nodeProps={props}
      nodeBackgroundClass={displayAttributes.backgroundClass}
      content={props.data.content}
      onUpdateContent={(content) => updatePersonaNode(props.id, content)}
      onRegenerateImage={() => generatePersonaImage(props.id)}
      onRegenerateContent={async (instructions) =>
        regeneratePersonaNodes([props.id], instructions)
      }
      onGenerateFeedback={() => generatePersonaFeedback(props.id)}
      targetHandle={false}
      sourceHandle={true}
    />
  );
}
