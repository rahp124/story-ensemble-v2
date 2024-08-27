import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';
import { useDisplayStore } from '@/lib/displayStore';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Persona);

export default function PersonaNode(props: NodeProps<NodeData>) {
  const {
    regenerating,
    setRegeneratingNode,

    setPreviousChangedValuesById
  } = useDisplayStore((state) => ({
    regenerating: state.regeneratingNodes.has(props.id),
    setRegeneratingNode: state.setRegeneratingNode,

    setPreviousChangedValuesById: state.setPreviousChangedValuesById
  }));

  const { generatePersonaImage, regeneratePersonaNodes, addStudyEvent } =
    useStore((state) => ({
      regeneratePersonaNodes: state.regeneratePersonaNodes,
      generatePersonaImage: state.generatePersonaImage,

      addStudyEvent: state.addStudyEvent
    }));

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
      onSync={async () => {
        if (regenerating) return;

        setRegeneratingNode(props.id, true);

        const {
          previousChangedValuesById: _previousChangedValuesById,
          regeneratedImageNodeIds
        } = await regeneratePersonaNodes(
          [props.id],
          'Regenerate persona based on updated problems',
          true
        );
        setPreviousChangedValuesById(_previousChangedValuesById);

        addStudyEvent({
          initiator: 'user',
          type: 'SYNC_REGENERATE_PERSONAS',
          count: 1,
          data: {
            outOfSync: props.data.outOfSync,
            dependentsOutOfSync: props.data.dependentsOutOfSync
          }
        });

        regeneratedImageNodeIds.forEach(async (idPromise) => {
          setRegeneratingNode(await idPromise, false);
        });
      }}
    />
  );
}
