import { Node } from 'reactflow';
import { Accordion } from '@mantine/core';
import { NodeType, nodeTypeDisplayAttributes } from '@/rf-components';
import { NodeData, StoryboardNodeData } from '@/types';
import { NodeContent } from './NodeContent';

interface SelectedNodePreviewProps {
  selectedNodes: Node<NodeData>[];
  changedKeysById?: Record<string, string[]>;
}
export function SelectedNodePreview(props: SelectedNodePreviewProps) {
  const { selectedNodes, changedKeysById = {} } = props;

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
  const storyboardNodes = selectedNodes.filter(
    (node) => node.type === NodeType.Storyboard
  ) as Node<StoryboardNodeData>[];
  const nodesToPreview = [
    ...personaNodes,
    ...problemNodes,
    ...solutionNodes,
    ...storyboardNodes
  ];

  return (
    <Accordion defaultValue={selectedNodes[0].id}>
      {nodesToPreview.map((node) => {
        const { emoji, backgroundClass } = nodeTypeDisplayAttributes(
          node.type as NodeType
        );
        const content = node.data.content;
        const storyboardTitle =
          node.type === NodeType.Storyboard
            ? (node as Node<StoryboardNodeData>).data?.storyboard?.title
            : '';

        return (
          <Accordion.Item
            key={node.id}
            value={node.id}
            className={backgroundClass}
          >
            {node.type === NodeType.Storyboard ? (
              <>
                <Accordion.Control icon={emoji} disabled>
                  {storyboardTitle}
                </Accordion.Control>
              </>
            ) : (
              <>
                <Accordion.Control icon={emoji}>
                  {content.Name}
                </Accordion.Control>
                <Accordion.Panel>
                  <NodeContent
                    content={content}
                    changedKeys={changedKeysById[node.id]}
                  />
                </Accordion.Panel>
              </>
            )}
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
