import { Dimension } from './types';

/**
 * Create each permutation of dimensions
 * @param dimensions
 */
export function generateRandomAssignments(
  dimensions: Dimension[],
  numAssignments: number
) {
  const assignments: Dimension[][] = [];

  for (let i = 0; i < numAssignments; i++) {
    const assignment = dimensions.map((dimension) => {
      const possibleValues = dimension.currentValues.length
        ? dimension.currentValues
        : dimension.values;
      const randomValue =
        possibleValues[Math.floor(Math.random() * possibleValues.length)];
      return { ...dimension, currentValues: [randomValue] };
    });
    assignments.push(assignment);
  }

  return assignments;
}
