import { generateStructured, generateString } from './openai';
import { Dimension, newDimensionsSchema } from '@/types';

export async function generateProblemDimensions(
  existingDimensions: Dimension[],
  context: string
): Promise<Dimension[]> {
  const prompt = 'TODO' + existingDimensions + context;

  const { newDimensions } = await generateStructured(
    newDimensionsSchema,
    prompt
  );

  return newDimensions.map((dimension) => ({
    ...dimension,
    currentValues: []
  }));
}

export async function generateProblem(
  dimensionValues: Dimension[],
  context: string
) {
  const prompt = `TODO` + dimensionValues + context;

  return await generateString(prompt);
}
