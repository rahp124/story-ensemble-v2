import { Node } from 'reactflow';

export function calculateDependentCenter(
  dependencies: Node[],
  dependentDimensions: {
    height: number;
    margin: number;
  }
) {
  const dependencyBoundaries = calculateNodeBoundaries(dependencies);

  return {
    x: dependencyBoundaries.centerX,
    y:
      dependencyBoundaries.maxY +
      dependentDimensions.margin +
      dependentDimensions.height / 2
  };
}

export function calculateNodeBoundaries(nodes: Node[]) {
  const minX = Math.min(
    ...nodes.map((node) => node.positionAbsolute!.x - node.width! / 2)
  );
  const maxX = Math.max(
    ...nodes.map((node) => node.positionAbsolute!.x + node.width! / 2)
  );
  const centerX = (minX + maxX) / 2;

  const minY = Math.min(
    ...nodes.map((node) => node.positionAbsolute!.y - node.height! / 2)
  );
  const maxY = Math.max(
    ...nodes.map((node) => node.positionAbsolute!.y + node.height! / 2)
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
