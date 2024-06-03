import { nanoid } from 'nanoid';
import { generateStructured, generateString } from './openai';
import { Dimension, newDimensionsSchema } from '@/types';

export async function generateProblemDimensions(
  existingDimensions: Dimension[],
  context: string
): Promise<Dimension[]> {
  const prompt = `You are an AI assistant tasked with enhancing the creative and divergent thinking process for design thinking.
Your goal is to generate a comprehensive list of dimensions (attributes with a set of allowed values) that can be used to create detailed problem statements.
These dimensions will help designers understand and frame the problems they are addressing better.

Given a set of existing dimensions and user instructions, generate a set of new dimensions if needed to fully explore the problem space.
These dimensions should help characterize and define possible problems the root cause, consequences, participants, and other aspects specific to just problem statements.
DO NOT suggest dimensions that describe the context or solutions!!!
  
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
    id: `problem-dim-${nanoid()}`,
    currentValues: []
  }));
}

export async function generateProblem(
  dimensionValues: Dimension[],
  context: string
) {
  const prompt = `Using the assigned values for each dimension, generate a detailed problem statement.
Structure the problem statement as follows: "As an [occupation or role], they struggle with [problem] because of [cause], which leads to [consequence]."
Ensure the problem statement is realistic and provides a comprehensive understanding of the issue.

Example: As an entry-level professional, they struggle with making informed investment decisions because of a lack of knowledge, which leads to high levels of stress and missed financial opportunities.

Limit each problem statement to 1-2 sentences. Don't add any Markdown or HTML formatting or line breaks, just plain text.

Dimensions: """
${JSON.stringify(dimensionValues, null, 2)}
"""

Context: """
${context}
"""`;

  return await generateString(prompt);
}
