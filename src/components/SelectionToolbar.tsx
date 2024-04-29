import { NodeType } from '@/rf-components';
import { Node, NodeToolbar, Position } from 'reactflow';
import { Button } from './ui/button';

export interface SelectionToolbarProps {
  selectedNodes: Node[];
  onEditPersonas: () => void;
  onGenerateProblems: () => void;
  onGenerateSolutions: () => void;
}
export default function SelectionToolbarMenu(props: SelectionToolbarProps) {
  // const showEditPersona = props.selectedNodes.some(
  //   (node) => node.type === NodeType.Persona
  // );
  const showGenerateProblems = props.selectedNodes.some(
    (node) => node.type === NodeType.Persona
  );
  const showGenerateSolutions = props.selectedNodes.some(
    (node) => node.type === NodeType.Problem
  );
  const showGenerateStoryboards = props.selectedNodes.some(
    (node) => node.type === NodeType.Solution
  );

  return (
    <NodeToolbar
      isVisible={true}
      position={Position.Bottom}
      nodeId={props.selectedNodes.map((node) => node.id)}
    >
      <div className="flex gap-2">
        {/* {showEditPersona && (
          <Button variant="outline" size="sm" onClick={props.onEditPersonas}>
            Edit personas
          </Button>
        )} */}
        {showGenerateProblems && (
          <Button
            variant="outline"
            size="sm"
            onClick={props.onGenerateProblems}
          >
            Generate problem statements
          </Button>
        )}
        {showGenerateSolutions && (
          <Button
            variant="outline"
            size="sm"
            onClick={props.onGenerateSolutions}
          >
            Generate solutions
          </Button>
        )}
        {showGenerateStoryboards && (
          <Button variant="outline" size="sm">
            Generate storyboards
          </Button>
        )}
      </div>
    </NodeToolbar>
  );
}
