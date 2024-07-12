import { NodeType } from '@/rf-components';
import { NodeData, StoryboardNodeData } from '@/types';
import { Node } from 'reactflow';
export function getSanitizedNodeContents(nodes: Node<NodeData>[]) {
  return nodes.map((node) => {
    if (node.type === NodeType.Storyboard) {
      const storyboardNode = node as Node<StoryboardNodeData>;
      const { storyboard } = storyboardNode.data;
      const sanitizedStoryboard = {
        title: storyboard.title,
        outline: storyboard.outline.map((frame) => ({
          frameType: frame.frameType,
          description: frame.description,
          caption: frame.caption
        }))
      };
      return sanitizedStoryboard;
    }

    return node.data.content;
  });
}
