import { Dimension } from './types';

/**
 * Create each permutation of dimensions
 * @param dimensions
 */
export function allDimensionAssignments(dimensions: Dimension[]) {
  const pinnedDimensions = dimensions.filter(
    (dimension) => dimension.currentValues.length > 0
  );
  const unpinnedDimensions = dimensions.filter(
    (dimension) => dimension.currentValues.length === 0
  );
  let unpinnedAssignments: Dimension[][] = [[]];
  for (const dimension of unpinnedDimensions) {
    const newAssignments: Dimension[][] = [];
    for (const assignment of unpinnedAssignments) {
      for (const value of dimension.values) {
        newAssignments.push([
          ...assignment,
          { ...dimension, currentValues: [value] }
        ]);
      }
    }
    unpinnedAssignments = newAssignments;
  }
  // Create all possible assignments for unpinned dimensions

  const allAssignments = unpinnedAssignments.map((assignment) => [
    ...assignment,
    ...pinnedDimensions
  ]);

  const string = allAssignments
    .map((assignment) =>
      assignment
        .map(
          (dimension) =>
            `${dimension.name}: ${dimension.currentValues.join(', ')}`
        )
        .join(', ')
    )
    .join('\n');

  return allAssignments;
}
