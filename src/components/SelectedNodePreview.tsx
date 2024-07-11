import { Node } from 'reactflow';
import { Accordion } from '@mantine/core';
import { NodeType, nodeTypeDisplayAttributes } from '@/rf-components';
import { NodeData } from '@/types';
import { NodeContent } from './NodeContent';

interface SelectedNodePreviewProps {
  selectedNodes: Node<NodeData>[];
}
export function SelectedNodePreview(props: SelectedNodePreviewProps) {
  const { selectedNodes } = props;

  if (selectedNodes.length === 0) return null;

  const personaNodes = selectedNodes.filter(
    (node) => node.type === NodeType.Persona
  );
  const problemNodes = selectedNodes.filter(
    (node) => node.type === NodeType.Problem
  );
  const solutionNodes = selectedNodes.filter(
    (node) => node.type === NodeType.Solution
  );
  const nodesToPreview = [...personaNodes, ...problemNodes, ...solutionNodes];

  return (
    <Accordion defaultValue={selectedNodes[0].id}>
      {nodesToPreview.map((node) => {
        const { emoji, backgroundClass } = nodeTypeDisplayAttributes(
          node.type as NodeType
        );
        const content = node.data.content;

        return (
          <Accordion.Item
            key={node.id}
            value={node.id}
            className={backgroundClass}
          >
            <Accordion.Control icon={emoji}>{content.Name}</Accordion.Control>
            <Accordion.Panel>
              <NodeContent content={content} />
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
