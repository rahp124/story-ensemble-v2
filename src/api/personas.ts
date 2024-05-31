import { generateString, generateStructured } from './openai';
import { Dimension, newDimensionsSchema } from '@/types';

export async function generatePersonaDimensions(
  existingDimensions: Dimension[],
  context: string
): Promise<Dimension[]> {
  const prompt = `You are an AI assistant tasked with enhancing the creative and divergent thinking process for design thinking.
Your goal is to generate a comprehensive list of dimensions (attributes with a set of allowed values) that can be used to create detailed personas.
These dimensions will help designers understand and empathize with their target audience better.
Given a set of existing dimensions and user instructions, generate a set of new dimensions if needed to fully explore the persona space.
  
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

export async function generatePersona(
  dimensionValues: Dimension[],
  context: string
) {
  const prompt = `You are an AI assistant tasked with creating a detailed persona for design thinking based on specific dimensions and their assigned values.
Use the given assignments to generate a coherent and realistic persona that can help designers understand and empathize with their target audience.
Limit each persona to 1-2 sentences. Don't add any Markdown or HTML formatting or line breaks, just plain text.

Dimensions: """
${JSON.stringify(dimensionValues, null, 2)}
"""

Context: """
${context}
"""`;

  return await generateString(prompt);
}
