import { useState } from 'react';
import { useOnSelectionChange, Node } from 'reactflow';

export const useSelectedNodes = () => {
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);

  useOnSelectionChange({
    onChange({ nodes }) {
      setSelectedNodes(nodes);
    }
  });

  return { selectedNodes };
};
