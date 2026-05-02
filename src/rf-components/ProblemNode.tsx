import { NodeProps } from 'reactflow';
import { NodeData } from '@/types';
import { useStore } from '@/store';
import BaseNode from './BaseNode';
import { NodeType, nodeTypeDisplayAttributes } from '.';
import { useDisplayStore } from '@/lib/displayStore';
import {
  findDirectDependencies,
  findDirectDependents
} from '@/lib/graphHelper';

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Problem);

export default function ProblemNode(props: NodeProps<NodeData>) {
  const {
    regenerating,
    setRegeneratingNode,

    setPreviousChangedValuesById,
    addPreviousChangedValuesById
  } = useDisplayStore((state) => ({
    regenerating: state.regeneratingNodes.has(props.id),
    setRegeneratingNode: state.setRegeneratingNode,

    setPreviousChangedValuesById: state.setPreviousChangedValuesById,
    addPreviousChangedValuesById: state.addPreviousChangedValuesById
  }));

  const {
    edges,
    regeneratePersonaNodes,
    generateProblemImage,
    regenerateProblemNodes,
    regenerateSolutionNodes,
    regenerateStoryboardNode,
    addStudyEvent
  } = useStore((state) => ({
    edges: state.edges,

    regeneratePersonaNodes: state.regeneratePersonaNodes,

    generateProblemImage: state.generateProblemImage,
    regenerateProblemNodes: state.regenerateProblemNodes,

    regenerateSolutionNodes: state.regenerateSolutionNodes,

    regenerateStoryboardNode: state.regenerateStoryboardNode,

    addStudyEvent: state.addStudyEvent
  }));

  return (
    <BaseNode
      emoji={displayAttributes.emoji}
      nodeName="Problem"
      nodeProps={props}
      nodeBackgroundClass={displayAttributes.backgroundClass}
      content={props.data.content}
      onRegenerateImage={() => generateProblemImage(props.id)}
      showImageSection={false}
      dependenciesUpdatedText="Personas updated."
      dependentsUpdatedText="Solutions updated."
      bothUpdatedText="Personas & solutions updated."
      onSync={async () => {
        if (regenerating) return;

        setRegeneratingNode(props.id, true);

        const {
          previousChangedValuesById: _previousChangedValuesById,
          regeneratedImageNodeIds
        } = await regenerateProblemNodes(
          [props.id],
          props.data.outOfSync && props.data.dependentsOutOfSync
            ? 'Regenerate problem based on updated personas and solutions'
            : props.data.outOfSync
            ? 'Regenerate problem based on updated personas'
            : 'Regenerate problem based on updated solutions',
          props.data.dependentsOutOfSync,
          props.data.outOfSync,
          !props.data.dependentsOutOfSync,
          !props.data.outOfSync
        );
        setPreviousChangedValuesById(_previousChangedValuesById);

        addStudyEvent({
          initiator: 'user',
          type: 'SYNC_REGENERATE_PROBLEMS',
          count: 1,
          data: {
            sourceNodeType: 'PROBLEM'
          }
        });

        regeneratedImageNodeIds.forEach(async (idPromise) => {
          setRegeneratingNode(await idPromise, false);
        });
      }}
      onSyncDown={async () => {
        if (regenerating) return;

        setRegeneratingNode(props.id, true);

        const {
          previousChangedValuesById: _previousChangedValuesById,
          regeneratedImageNodeIds
        } = await regenerateProblemNodes(
          [props.id],
          'Regenerate problem based on updated personas',
          false,
          true,
          true,
          false
        );
        setPreviousChangedValuesById(_previousChangedValuesById);

        addStudyEvent({
          initiator: 'user',
          type: 'SYNC_ALL_REGENERATE_PROBLEMS',
          count: 1,
          data: {
            sourceNodeType: 'PROBLEM'
          }
        });

        regeneratedImageNodeIds.forEach(async (idPromise) => {
          setRegeneratingNode(await idPromise, false);
        });

        const solutionIds = findDirectDependents([props.id], edges).filter(
          (id) => id.startsWith('solution-')
        );
        if (solutionIds.length > 0) {
          await Promise.all(
            solutionIds.map(async (solutionId) => {
              setRegeneratingNode(solutionId, true);

              const {
                previousChangedValuesById: _previousChangedValuesById,
                regeneratedImageNodeIds
              } = await regenerateSolutionNodes(
                [solutionId],
                'Regenerate solution based on updated problems',
                false,
                true,
                true,
                false
              );

              addPreviousChangedValuesById(_previousChangedValuesById);

              regeneratedImageNodeIds.forEach(async (idPromise) => {
                setRegeneratingNode(await idPromise, false);
              });
            })
          );

          addStudyEvent({
            initiator: 'user',
            type: 'SYNC_ALL_REGENERATE_SOLUTIONS',
            count: solutionIds.length,
            data: {
              sourceNodeType: 'PROBLEM'
            }
          });
        }

        const storyboardIds = findDirectDependents(solutionIds, edges).filter(
          (id) => id.startsWith('storyboard-')
        );
        if (storyboardIds.length > 0) {
          await Promise.all(
            storyboardIds.map(async (storyboardId) => {
              setRegeneratingNode(storyboardId, true);

              await regenerateStoryboardNode(
                storyboardId,
                'Regenerate storyboard based on updated personas, problems, and solutions',
                false
              );

              setRegeneratingNode(storyboardId, false);
            })
          );

          addStudyEvent({
            initiator: 'user',
            type: 'SYNC_ALL_REGENERATE_STORYBOARDS',
            count: storyboardIds.length,
            data: {
              sourceNodeType: 'PROBLEM'
            }
          });
        }
      }}
      onSyncUp={async () => {
        if (regenerating) return;

        setRegeneratingNode(props.id, true);

        const {
          previousChangedValuesById: _previousChangedValuesById,
          regeneratedImageNodeIds
        } = await regenerateProblemNodes(
          [props.id],
          "Regenerate problem based on updated solutions. Don't talk about solutions in generated problems. Find the problems that may lead to updated solutions.",
          true,
          false,
          false,
          true
        );
        setPreviousChangedValuesById(_previousChangedValuesById);

        addStudyEvent({
          initiator: 'user',
          type: 'SYNC_UP_REGENERATE_PROBLEMS',
          count: 1,
          data: {
            sourceNodeType: 'PROBLEM'
          }
        });

        regeneratedImageNodeIds.forEach(async (idPromise) => {
          setRegeneratingNode(await idPromise, false);
        });

        const personaIds = findDirectDependencies([props.id], edges).filter(
          (id) => id.startsWith('persona-')
        );
        if (personaIds.length > 0) {
          await Promise.all(
            personaIds.map(async (personaId) => {
              setRegeneratingNode(personaId, true);

              const {
                previousChangedValuesById: _previousChangedValuesById,
                regeneratedImageNodeIds
              } = await regeneratePersonaNodes(
                [personaId],
                "Regenerate persona based on updated problems. The persona's needs and challenges should reflect updated problems.",
                true,
                false
              );

              addPreviousChangedValuesById(_previousChangedValuesById);

              regeneratedImageNodeIds.forEach(async (idPromise) => {
                setRegeneratingNode(await idPromise, false);
              });
            })
          );

          addStudyEvent({
            initiator: 'user',
            type: 'SYNC_UP_REGENERATE_PERSONAS',
            count: personaIds.length,
            data: {
              sourceNodeType: 'PROBLEM'
            }
          });
        }
      }}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
