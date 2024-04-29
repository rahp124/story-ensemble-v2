import { NodeType } from '@/rf-components';
import { Node, NodeToolbar } from 'reactflow';
import { Button } from './ui/button';

export interface SelectionToolbarProps {
  selectedNodes: Node[];
  onEditPersonas: () => void;
  onGenerateProblems: () => void;
}
export default function SelectionToolbarMenu(props: SelectionToolbarProps) {
  // const showEditPersona = props.selectedNodes.some(
  //   (node) => node.type === NodeType.Persona
  // );
  const showGenerateProblems = props.selectedNodes.some(
    (node) => node.type === NodeType.Persona
  );

  return (
    <NodeToolbar
      isVisible={true}
      // position="top"
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
      </div>
    </NodeToolbar>
  );
}
