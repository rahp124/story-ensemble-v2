import { Dimension, newDimensionsSchema } from '@/types';
import { generateString, generateStructured } from './openai';

export async function generateSolutionDimensions(
  existingDimensions: Dimension[],
  context: string
): Promise<Dimension[]> {
  const prompt = `
Dimensions define a solution space of possibilities. Each dimension has a set of values that it can be assigned. Combinations of dimensions and values can be used to generate a set of solutions.
Given a set of existing dimensions and user instructions. Generate a set of new dimensions if needed to fully explore the solution space.
Dimensions that have already been assigned should be considered pinned which can inform the generation of new dimensions.
If there are no existing dimensions, make sure to generate a set of dimensions to explore the solution space.

Existing Dimensions: """
${JSON.stringify(existingDimensions, null, 2)}
"""

Instructions: """
${context}
"""`;

  const { newDimensions } = await generateStructured(
    newDimensionsSchema,
    prompt
  );

  return newDimensions.map((dimension) => ({
    ...dimension,
    currentValues: []
  }));
}

export async function generateSolution(
  problems: string[],
  dimensionValues: Dimension[],
  instructions: string
) {
  const prompt = `You are a product and user experience designer.

Given a list of problems generate a solution. This solution is defined by a set of dimensions and assigned values. The dimensions and values should be used to generate a solution that addresses the problems.
Additionally take into account user instructions.

Problems: """
${JSON.stringify(problems, null, 2)}
"""

Dimensions: """
${JSON.stringify(dimensionValues, null, 2)}
"""

Instructions: """
${instructions}
"""`;

  return await generateString(prompt);
}
