import { Dimension } from './types';

/**
 * Create each permutation of dimensions
 * @param dimensions
 */
export function allDimensionAssignments(
  dimensions: Dimension[],
  maxPermutations: number
) {
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

  // Select a random subset of the permutations
  unpinnedAssignments = shuffleArray(unpinnedAssignments).slice(
    0,
    maxPermutations
  );

  const allAssignments = unpinnedAssignments.map((assignment) => [
    ...assignment,
    ...pinnedDimensions
  ]);

  return allAssignments;
}

/**
 * Function to shuffle an array using the Fisher-Yates algorithm.
 * @param array - The array to shuffle.
 * @returns A new array with the elements shuffled.
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffledArray = [...array];
  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Get a random index from 0 to i
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
  }
  return shuffledArray;
}
