import { NodeType } from '@/rf-components';
import { Node, NodeToolbar, Position } from 'reactflow';
import { Button, Tooltip } from '@mantine/core';
import { BlocksIcon, CopyIcon, PlusIcon } from 'lucide-react';

export interface SelectionToolbarProps {
  selectedNodes: Node[];
  onMergePersonas: () => void;
  onGenerateProblems: () => void;
  onGenerateSolutions: () => void;
  onGenerateStoryboard: () => void;
  onDuplicate: () => void;
  onRemoveFromGroup: () => void;
}
export default function SelectionToolbarMenu(props: SelectionToolbarProps) {
  // const showMergePersonas =
  //   props.selectedNodes.filter((node) => node.type === NodeType.Persona)
  //     .length > 1;
  const showGenerateProblems = props.selectedNodes.some(
    (node) => node.type === NodeType.Persona
  );
  const showGenerateSolutions = props.selectedNodes.some(
    (node) => node.type === NodeType.Problem
  );
  const showRemoveFromGroup = props.selectedNodes.every(
    (node) => !!node.parentId
  );

  const buttons = [
    {
      show: showGenerateProblems,
      leftSection: <PlusIcon className="size-4" />,
      label: 'Problems 🚨',
      onClick: props.onGenerateProblems
    },
    {
      show: showGenerateSolutions,
      leftSection: <PlusIcon className="size-4" />,
      label: 'Solutions 💡',
      onClick: props.onGenerateSolutions
    },
    {
      show: true,
      leftSection: <PlusIcon className="size-4" />,
      label: 'Storyboard 🎞',
      onClick: props.onGenerateStoryboard
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
