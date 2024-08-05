import { Node } from 'reactflow';

export function calculateNewDependentCenter(
  dependencies: Node[],
  dependentDimensions: {
    width: number;
    height: number;
    margin: number;
  },
  position: 'bottom' | 'right' = 'bottom'
) {
  const dependencyBoundaries = calculateNodeBoundaries(dependencies);

  if (position === 'bottom') {
    return {
      x: dependencyBoundaries.centerX,
      y:
        dependencyBoundaries.maxY +
        dependentDimensions.margin +
        dependentDimensions.height / 2
    };
  } else {
    return {
      x:
        dependencyBoundaries.maxX +
        dependentDimensions.margin +
        dependentDimensions.width / 2,
      y: dependencyBoundaries.centerY
    };
  }
}

export function calculateNodeBoundaries(nodes: Node[]) {
  const minX = Math.min(
    ...nodes.map((node) => node.position.x - node.width! / 2)
  );
  const maxX = Math.max(
    ...nodes.map((node) => node.position.x + node.width! / 2)
  );
  const centerX = (minX + maxX) / 2;

  const minY = Math.min(
    ...nodes.map((node) => node.position.y - node.height! / 2)
  );
  const maxY = Math.max(
    ...nodes.map((node) => node.position.y + node.height! / 2)
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
  center: {
    x: number;
    y: number;
  },
  numberOfNodes: number = 1,
  nodeDimensions: {
    width: number;
    height: number;
    gap: number;
  } = {
    width: 400,
    height: 500,
    gap: 50
  }
) {
  const { width, height, gap } = nodeDimensions;
  const { x: centerX, y: centerY } = center;

  const totalWidth = width * numberOfNodes + gap * (numberOfNodes - 1);
  const startX = centerX - totalWidth / 2 + width / 2;

  return Array.from({ length: numberOfNodes }, (_, index) => ({
    width,
    height,
    style: {
      width,
      height
    },
    position: {
      x: startX + index * (width + gap),
      y: centerY
    }
  }));
}

export function calculateDependentNodePositionAttributes(
  dependencies: Node[],
  position: 'bottom' | 'right' = 'bottom',
  numberOfNodes: number = 1,
  nodeDimensions: {
    width: number;
    height: number;
    gap: number;
    margin: number;
  } = {
    width: 400,
    height: 500,
    gap: 50,
    margin: 100
  }
) {
  const { width, height, gap, margin } = nodeDimensions;

  const totalWidth = width * numberOfNodes + gap * (numberOfNodes - 1);

  const center = calculateNewDependentCenter(
    dependencies,
    {
      width: totalWidth,
      height,
      margin
    },
    position
  );

  return calculateNodePositionAttributes(center, numberOfNodes, nodeDimensions);
}
