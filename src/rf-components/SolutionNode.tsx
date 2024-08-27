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

const displayAttributes = nodeTypeDisplayAttributes(NodeType.Solution);

export default function SolutionNode(props: NodeProps<NodeData>) {
  const {
    regenerating,
    setRegeneratingNode,

    previousChangedValuesById,
    setPreviousChangedValuesById
  } = useDisplayStore((state) => ({
    regenerating: state.regeneratingNodes.has(props.id),
    setRegeneratingNode: state.setRegeneratingNode,

    previousChangedValuesById: state.previousChangedValuesById,
    setPreviousChangedValuesById: state.setPreviousChangedValuesById
  }));

  const {
    edges,

    generateSolutionImage,
    regenerateSolutionNodes,

    regeneratePersonaNodes,
    regenerateProblemNodes,
    regenerateStoryboardNode,

    addStudyEvent
  } = useStore((state) => ({
    edges: state.edges,

    generateSolutionImage: state.generateSolutionImage,
    regenerateSolutionNodes: state.regenerateSolutionNodes,

    regeneratePersonaNodes: state.regeneratePersonaNodes,
    regenerateProblemNodes: state.regenerateProblemNodes,
    regenerateStoryboardNode: state.regenerateStoryboardNode,

    addStudyEvent: state.addStudyEvent
  }));

  return (
    <BaseNode
      emoji={displayAttributes.emoji}
      nodeName="Solution"
      nodeProps={props}
      nodeBackgroundClass={displayAttributes.backgroundClass}
      content={props.data.content}
      onRegenerateImage={() => generateSolutionImage(props.id)}
      dependenciesUpdatedText="Problems updated."
      dependentsUpdatedText="Storyboards updated."
      bothUpdatedText="Problems & storyboards updated."
      onSync={async () => {
        if (regenerating) return;

        setRegeneratingNode(props.id, true);

        const {
          previousChangedValuesById: _previousChangedValuesById,
          regeneratedImageNodeIds
        } = await regenerateSolutionNodes(
          [props.id],
          props.data.outOfSync && props.data.dependentsOutOfSync
            ? 'Regenerate solution based on updated problems and storyboards'
            : props.data.outOfSync
            ? 'Regenerate solution based on updated problems'
            : 'Regenerate solution based on updated storyboards',
          props.data.dependentsOutOfSync,
          props.data.outOfSync
        );
        setPreviousChangedValuesById(_previousChangedValuesById);

        addStudyEvent({
          initiator: 'user',
          type: 'SYNC_REGENERATE_SOLUTIONS',
          count: 1,
          data: {
            sourceNodeType: 'SOLUTION'
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
        } = await regenerateSolutionNodes(
          [props.id],
          'Regenerate solution based on updated problems',
          false,
          true
        );

        addStudyEvent({
          initiator: 'user',
          type: 'SYNC_ALL_REGENERATE_SOLUTIONS',
          count: 1,
          data: {
            sourceNodeType: 'SOLUTION'
          }
        });

        setPreviousChangedValuesById(_previousChangedValuesById);

        regeneratedImageNodeIds.forEach(async (idPromise) => {
          setRegeneratingNode(await idPromise, false);
        });

        const storyboardIds = findDirectDependents([props.id], edges).filter(
          (id) => id.startsWith('storyboard-')
        );
        if (storyboardIds.length > 0) {
          await Promise.all(
            storyboardIds.map(async (storyboardId) => {
              setRegeneratingNode(storyboardId, true);

              await regenerateStoryboardNode(
                storyboardId,
                'Regenerate storyboard based on updated personas, problems, and solutions'
              );

              setRegeneratingNode(storyboardId, false);
            })
          );

          addStudyEvent({
            initiator: 'user',
            type: 'SYNC_ALL_REGENERATE_STORYBOARDS',
            count: storyboardIds.length,
            data: {
              sourceNodeType: 'SOLUTION'
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
        } = await regenerateSolutionNodes(
          [props.id],
          'Regenerate solution based on updated storyboards',
          true,
          false
        );
        setPreviousChangedValuesById(_previousChangedValuesById);

        addStudyEvent({
          initiator: 'user',
          type: 'SYNC_UP_REGENERATE_SOLUTIONS',
          count: 1,
          data: {
            sourceNodeType: 'SOLUTION'
          }
        });

        regeneratedImageNodeIds.forEach(async (idPromise) => {
          setRegeneratingNode(await idPromise, false);
        });

        const problemIds = findDirectDependencies([props.id], edges).filter(
          (id) => id.startsWith('problem-')
        );
        if (problemIds.length) {
          await Promise.all(
            problemIds.map(async (problemId) => {
              setRegeneratingNode(problemId, true);

              const {
                previousChangedValuesById: _previousChangedValuesById,
                regeneratedImageNodeIds
              } = await regenerateProblemNodes(
                [problemId],
                'Regenerate problem based on updated solutions',
                true,
                false
              );

              setPreviousChangedValuesById({
                ...previousChangedValuesById,
                ..._previousChangedValuesById
              });

              regeneratedImageNodeIds.forEach(async (idPromise) => {
                setRegeneratingNode(await idPromise, false);
              });
            })
          );

          addStudyEvent({
            initiator: 'user',
            type: 'SYNC_UP_REGENERATE_PROBLEMS',
            count: problemIds.length,
            data: {
              sourceNodeType: 'SOLUTION'
            }
          });
        }

        const personaIds = findDirectDependencies(problemIds, edges).filter(
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
                'Regenerate persona based on updated problems',
                true
              );

              setPreviousChangedValuesById({
                ...previousChangedValuesById,
                ..._previousChangedValuesById
              });

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
              sourceNodeType: 'SOLUTION'
            }
          });
        }
      }}
      targetHandle={true}
      sourceHandle={true}
    />
  );
}
