import { NodeType } from '@/rf-components';
import { Node, NodeToolbar, Position } from 'reactflow';
import { Button } from '@mantine/core';
import { CopyIcon } from 'lucide-react';

export interface SelectionToolbarProps {
  selectedNodes: Node[];
  onMergePersonas: () => void;
  onGenerateProblems: () => void;
  onGenerateSolutions: () => void;
  onGenerateStoryboard: () => void;
  onDuplicate: () => void;
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
  const buttons = [
    {
      show: showGenerateProblems,
      label: 'Generate problems 🚨',
      onClick: props.onGenerateProblems
    },
    {
      show: showGenerateSolutions,
      label: 'Generate solutions 💡',
      onClick: props.onGenerateSolutions
    },
    {
      show: true,
      label: 'Generate storyboard 🎞',
      onClick: props.onGenerateStoryboard
    },
    { show: true, label: <CopyIcon />, onClick: props.onDuplicate }
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
          .map(({ label, onClick }, idx) => (
            <Button
              key={idx}
              variant="light"
              size="compact-md"
              onClick={onClick}
            >
              {label}
            </Button>
          ))}
      </Button.Group>
    </NodeToolbar>
  );
}
