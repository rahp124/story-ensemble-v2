import { Dimension } from './types';

/**
 * Create each permutation of dimensions
 * @param dimensions
 */
export function generateRandomAssignments(
  dimensions: Dimension[],
  numAssignments: number
) {
  const pinnedDimensions = dimensions.filter(
    (dimension) => dimension.currentValues.length > 0
  );
  const unpinnedDimensions = dimensions.filter(
    (dimension) => dimension.currentValues.length === 0
  );

  const unpinnedAssignments: Dimension[][] = [];

  for (let i = 0; i < numAssignments; i++) {
    const assignment = unpinnedDimensions.map((dimension) => {
      const randomValue =
        dimension.values[Math.floor(Math.random() * dimension.values.length)];
      return { ...dimension, currentValues: [randomValue] };
    });
    unpinnedAssignments.push(assignment);
  }

  const allAssignments = unpinnedAssignments.map((assignment) => [
    ...assignment,
    ...pinnedDimensions
  ]);

  return allAssignments;
}
