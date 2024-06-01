import { Dimension, newDimensionsSchema } from '@/types';
import { generateString, generateStructured } from './openai';

export async function generateSolutionDimensions(
  existingDimensions: Dimension[],
  context: string
): Promise<Dimension[]> {
  const prompt = `You are an AI assistant tasked with enhancing the creative and divergent thinking process for design thinking.
Your goal is to generate a comprehensive list of dimensions (attributes with a set of allowed values) that can be used to create detailed solution ideas.
These dimensions will help designers explore various aspects of potential solutions to address a given problem effectively.

Given a set of existing dimensions and user instructions, generate a set of new dimensions if needed to fully explore the solution space.
These dimensions should help characterize and define possible solutions, their features, benefits, and other aspects specific to just solution ideas.
DO NOT suggest dimensions that describe the context or problems!!!

Existing Dimensions: """
${JSON.stringify(existingDimensions, null, 2)}
"""

Context: """
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
  dimensionValues: Dimension[],
  instructions: string
) {
  const prompt = `You are an AI assistant tasked with creating a detailed solution idea for design thinking based on specific dimensions and their assigned values.
Use the given dimensions to generate a coherent and realistic solution idea that can help designers address the identified problem effectively.
Limit each solution idea to 1-2 sentences. Don't add any Markdown or HTML formatting or line breaks, just plain text.

Dimensions: """
${JSON.stringify(dimensionValues, null, 2)}
"""

Context: """
${instructions}
"""`;

  return await generateString(prompt);
}
