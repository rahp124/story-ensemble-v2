import { Node } from 'reactflow';

function getAbsolutePosition(nodes: Node[], allNodes: Node[]) {
  const idToNode = Object.fromEntries(allNodes.map((node) => [node.id, node]));

  return nodes.map((node) => {
    if (node.positionAbsolute) {
      return node.positionAbsolute;
    }

    if (node.parentId && node.extent === 'parent') {
      const parentNode = idToNode[node.parentId];
      if (!parentNode) return node.position;

      const parentPosition = parentNode.positionAbsolute ?? parentNode.position;

      return {
        x: parentPosition.x + node.position.x - parentNode.width! / 2,
        y: parentPosition.y + node.position.y - parentNode.height! / 2
      };
    }

    return node.position;
  });
}

export function calculateNewDependentCenter(
  dependencies: Node[],
  allNodes: Node[],
  dependentDimensions: {
    height: number;
    margin: number;
  }
) {
  const dependencyBoundaries = calculateNodeBoundaries(dependencies, allNodes);

  return {
    x: dependencyBoundaries.centerX,
    y:
      dependencyBoundaries.maxY +
      dependentDimensions.margin +
      dependentDimensions.height / 2
  };
}

export function calculateNodeBoundaries(nodes: Node[], allNodes: Node[]) {
  const nodePositions = getAbsolutePosition(nodes, allNodes);

  const minX = Math.min(
    ...nodes.map((node, idx) => nodePositions[idx].x - node.width! / 2)
  );
  const maxX = Math.max(
    ...nodes.map((node, idx) => nodePositions[idx].x + node.width! / 2)
  );
  const centerX = (minX + maxX) / 2;

  const minY = Math.min(
    ...nodes.map((node, idx) => nodePositions[idx].y - node.height! / 2)
  );
  const maxY = Math.max(
    ...nodes.map((node, idx) => nodePositions[idx].y + node.height! / 2)
  );
  const centerY = (minY + maxY) / 2;

  return {
    minX,
    maxX,
    centerX,

    minY,
    maxY,
    centerY
  };
}

export function calculateNodePositionAttributes(
  numberOfNodes: number,
  nodeDimensions: {
    width: number;
    height: number;
    padding: number;
  },
  center: {
    x: number;
    y: number;
  }
) {
  const { width, height, padding } = nodeDimensions;
  const { x: centerX, y: centerY } = center;

  const totalWidth = width * numberOfNodes + padding * (numberOfNodes - 1);
  const startX = centerX - totalWidth / 2 + width / 2;

  return Array.from({ length: numberOfNodes }, (_, index) => ({
    width,
    height,
    style: {
      width,
      height
    },
    position: {
      x: startX + index * (width + padding),
      y: centerY
    }
  }));
}

export function calculateNodePositionAttributesWithParent(
  numberOfNodes: number,
  nodeDimensions: {
    width: number;
    height: number;
    padding: number;
    parentPadding: number;
  },
  center: {
    x: number;
    y: number;
  }
) {
  const { width, height, padding, parentPadding } = nodeDimensions;

  const parentHeight = height + parentPadding * 2;
  const parentWidth =
    width * numberOfNodes + padding * (numberOfNodes - 1) + parentPadding * 2;

  const parentPositionAttributes = calculateNodePositionAttributes(
    1,
    {
      width: parentWidth,
      height: parentHeight,
      padding: 0
    },
    center
  )[0];

  const nodePositionAttributes = calculateNodePositionAttributes(
    numberOfNodes,
    {
      width,
      height,
      padding
    },
    {
      x: parentWidth / 2,
      y: parentHeight / 2
    }
  );

  return {
    parentPositionAttributes: parentPositionAttributes,
    nodesPositionAttributes: nodePositionAttributes.map((node) => ({
      ...node,
      extent: 'parent' as const
    }))
  };
}
