import { NodeType } from '@/nodes';
import { Node, NodeToolbar } from 'reactflow';
import { Button } from './ui/button';

export interface SelectionToolbarProps {
  selectedNodes: Node[];
  onEditPersonas: () => void;
  // right: number;
  // bottom: number;
}
export default function SelectionToolbarMenu(props: SelectionToolbarProps) {
  const { selectedNodes, onEditPersonas } = props;
  const showEditPersona = props.selectedNodes.some(
    (node) => node.type === NodeType.Persona
  );

  return (
    <NodeToolbar
      isVisible={true}
      // position="top"
      nodeId={selectedNodes.map((node) => node.id)}
    >
      {showEditPersona && (
        <Button variant="outline" size="sm" onClick={onEditPersonas}>
          Edit personas
        </Button>
      )}
      <Button variant="outline" size="sm">
        Generate problem statements
      </Button>
    </NodeToolbar>
  );
}
