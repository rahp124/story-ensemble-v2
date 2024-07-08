import { NodeType } from '@/rf-components';
import { Node, NodeToolbar, Position } from 'reactflow';
import { Button, Tooltip } from '@mantine/core';
import {
  BlocksIcon,
  CopyIcon,
  NetworkIcon,
  SquareStackIcon
} from 'lucide-react';

export interface SelectionToolbarProps {
  selectedNodes: Node[];

  onGenerateProblems: () => void;
  onGenerateSolutions: () => void;
  onGenerateStoryboard: () => void;

  onGenerateSimilarPersonas: () => void;
  onGenerateSimilarProblems: () => void;
  onGenerateSimilarSolutions: () => void;
  onGenerateSimilarStoryboard: () => void;

  onDuplicate: () => void;

  onRemoveFromGroup: () => void;
}
export default function SelectionToolbarMenu(props: SelectionToolbarProps) {
  const nonParentNodes = props.selectedNodes.filter(
    (node) => !node.id.startsWith('parent-')
  );

  const showGenerateProblems =
    nonParentNodes.length > 0 &&
    nonParentNodes.every((node) => node.type === NodeType.Persona);
  const showGenerateSolutions =
    nonParentNodes.length > 0 &&
    nonParentNodes.every((node) => node.type === NodeType.Problem);
  const showGenerateStoryboard = nonParentNodes.length > 0;

  const showRemoveFromGroup =
    nonParentNodes.length > 0 &&
    nonParentNodes.every((node) => !!node.parentId);

  const showGenerateSimilarPersonas =
    nonParentNodes.length > 0 &&
    nonParentNodes.every((node) => node.type === NodeType.Persona);
  const showGenerateSimilarProblems =
    nonParentNodes.length > 0 &&
    nonParentNodes.every((node) => node.type === NodeType.Problem);
  const showGenerateSimilarSolutions =
    nonParentNodes.length > 0 &&
    nonParentNodes.every((node) => node.type === NodeType.Solution);
  const showGenerateSimilarStoryboard =
    nonParentNodes.length > 0 &&
    nonParentNodes.every((node) => node.type === NodeType.Storyboard);

  const buttons = [
    {
      show: showGenerateProblems,
      tooltip: 'Generate problems from the selected personas',
      leftSection: <NetworkIcon className="size-4" />,
      label: 'Problems 🚨',
      onClick: props.onGenerateProblems
    },
    {
      show: showGenerateSolutions,
      tooltip: 'Generate solutions from the selected problems',
      leftSection: <NetworkIcon className="size-4" />,
      label: 'Solutions 💡',
      onClick: props.onGenerateSolutions
    },
    {
      show: showGenerateStoryboard,
      tooltip: 'Generate a storyboard from the selected nodes',
      leftSection: <NetworkIcon className="size-4" />,
      label: 'Storyboard 🎞',
      onClick: props.onGenerateStoryboard
    },
    {
      show: showGenerateSimilarPersonas,
      tooltip: 'Generate personas similar to the selected personas',
      leftSection: <SquareStackIcon className="size-4" />,
      label: 'Personas 👤',
      onClick: props.onGenerateSimilarPersonas
    },
    {
      show: showGenerateSimilarProblems,
      tooltip: 'Generate problems similar to the selected problems',
      leftSection: <SquareStackIcon className="size-4" />,
      label: 'Problems 🚨',
      onClick: props.onGenerateSimilarProblems
    },
    {
      show: showGenerateSimilarSolutions,
      tooltip: 'Generate solutions similar to the selected solutions',
      leftSection: <SquareStackIcon className="size-4" />,
      label: 'Solutions 💡',
      onClick: props.onGenerateSimilarSolutions
    },
    {
      show: showGenerateSimilarStoryboard,
      tooltip: 'Generate a storyboard similar to the selected storyboards',
      leftSection: <SquareStackIcon className="size-4" />,
      label: 'Storyboard 🎞',
      onClick: props.onGenerateSimilarStoryboard
    },
    {
      show: true,
      tooltip: 'Duplicate',
      label: <CopyIcon className="size-4" />,
      onClick: props.onDuplicate
    },
    {
      show: showRemoveFromGroup,
      tooltip: 'Remove from group',
      label: <BlocksIcon className="size-4" />,
      onClick: props.onRemoveFromGroup
    }
  ];

  return (
    <NodeToolbar
      isVisible={true}
      position={Position.Bottom}
      nodeId={props.selectedNodes.map((node) => node.id)}
    >
      <Button.Group>
        {buttons
          .filter(({ show }) => show)
          .map(({ tooltip, leftSection, label, onClick }, idx) => {
            const buttonElement = (
              <Button
                key={idx}
                variant="filled"
                color="dark"
                size="xs"
                onClick={onClick}
                leftSection={leftSection}
              >
                {label}
              </Button>
            );

            if (tooltip) {
              return (
                <Tooltip key={idx} label={tooltip} position="top">
                  {buttonElement}
                </Tooltip>
              );
            }

            return buttonElement;
          })}
      </Button.Group>
    </NodeToolbar>
  );
}
