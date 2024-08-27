import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Persona);

export default function PersonaNode(props: NodeProps<NodeData>) {
  const generatePersonaImage = useStore((state) => state.generatePersonaImage);

  return (
    <BaseNode
      emoji={displayAttributes.emoji}
      nodeName="Persona"
      nodeProps={props}
      nodeBackgroundClass={displayAttributes.backgroundClass}
      content={props.data.content}
      onRegenerateImage={() => generatePersonaImage(props.id)}
      targetHandle={false}
      sourceHandle={true}
      dependentsUpdatedText="Problems updated."
    />
  );
}
