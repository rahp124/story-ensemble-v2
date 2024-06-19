import { NodeType } from '@/rf-components';
import { Node, NodeToolbar, Position } from 'reactflow';
import { Button } from '@mantine/core';

export interface SelectionToolbarProps {
  selectedNodes: Node[];
  onMergePersonas: () => void;
  onGenerateProblems: () => void;
  onGenerateSolutions: () => void;
  onGenerateStoryboard: () => void;
}
export default function SelectionToolbarMenu(props: SelectionToolbarProps) {
  const showMergePersonas =
    props.selectedNodes.filter((node) => node.type === NodeType.Persona)
      .length > 1;
  const showGenerateProblems = props.selectedNodes.some(
    (node) => node.type === NodeType.Persona
  );
  const showGenerateSolutions = props.selectedNodes.some(
    (node) => node.type === NodeType.Problem
  );

  return (
    <NodeToolbar
      isVisible={true}
      position={Position.Bottom}
      nodeId={props.selectedNodes.map((node) => node.id)}
    >
      <Button.Group>
        {showMergePersonas && (
          <Button variant="outline" size="xs" onClick={props.onMergePersonas}>
            Merge personas
          </Button>
        )}
        {showGenerateProblems && (
          <Button
            variant="outline"
            size="xs"
            onClick={props.onGenerateProblems}
          >
            Generate problem statements
          </Button>
        )}
        {showGenerateSolutions && (
          <Button
            variant="outline"
            size="xs"
            onClick={props.onGenerateSolutions}
          >
            Generate solutions
          </Button>
        )}
        <Button
          variant="outline"
          size="xs"
          onClick={props.onGenerateStoryboard}
        >
          Generate storyboard
        </Button>
      </Button.Group>
    </NodeToolbar>
  );
}
