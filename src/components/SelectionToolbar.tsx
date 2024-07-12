import { NodeType } from '@/rf-components';
import { Node, NodeToolbar, Position } from 'reactflow';
import { Button, Tooltip } from '@mantine/core';
import {
  CopyIcon,
  MessageSquareIcon,
  NetworkIcon,
  PencilIcon,
  SquareStackIcon
} from 'lucide-react';

export interface SelectionToolbarProps {
  selectedNodes: Node[];

  onGenerateProblems: () => void;
  onGenerateSolutions: () => void;
  onGenerateStoryboard: () => void;

  onGenerateMorePersonas: () => void;
  onGenerateMoreProblems: () => void;
  onGenerateMoreSolutions: () => void;
  onGenerateMoreStoryboard: () => void;

  onFeedback: () => void;
  onRegenerate: () => void;

  onDuplicate: () => void;
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
  const showGenerateStoryboard =
    nonParentNodes.length > 0 &&
    !nonParentNodes.some((node) => node.type === NodeType.Storyboard);

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
      tooltip: 'Generate more personas based on the selected personas',
      leftSection: <SquareStackIcon className="size-4" />,
      label: 'Personas 👤',
      onClick: props.onGenerateMorePersonas
    },
    {
      show: showGenerateSimilarProblems,
      tooltip: 'Generate more problems based on the selected problems',
      leftSection: <SquareStackIcon className="size-4" />,
      label: 'Problems 🚨',
      onClick: props.onGenerateMoreProblems
    },
    {
      show: showGenerateSimilarSolutions,
      tooltip: 'Generate more solutions based on the selected solutions',
      leftSection: <SquareStackIcon className="size-4" />,
      label: 'Solutions 💡',
      onClick: props.onGenerateMoreSolutions
    },
    {
      show: showGenerateSimilarStoryboard,
      tooltip: 'Generate another storyboard based on the selected storyboards',
      leftSection: <SquareStackIcon className="size-4" />,
      label: 'Storyboard 🎞',
      onClick: props.onGenerateMoreStoryboard
    },
    {
      show: nonParentNodes.length > 0,
      tooltip: 'View feedback',
      label: <MessageSquareIcon className="size-4" />,
      onClick: props.onFeedback
    },
    {
      show: nonParentNodes.length > 0,
      tooltip: 'Regenerate',
      label: <PencilIcon className="size-4" />,
      onClick: props.onRegenerate
    },
    {
      show: true,
      tooltip: 'Duplicate',
      label: <CopyIcon className="size-4" />,
      onClick: props.onDuplicate
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
