import { nanoid } from 'nanoid';
import { generateString, generateStructured } from './openai';
import { Dimension, newDimensionsSchema } from '@/types';
import { z } from 'zod';

export async function generatePersonaDimensions(
  existingDimensions: Dimension[],
  context: string
): Promise<Dimension[]> {
  const prompt = `Generate a unique and orthogonal dimensions (attributes with a set of allowed values) that can be used to explore and categorize possible personas.
Given a set of existing dimensions and context, generate new dimensions if needed to explore the persona space.
Only generate the principal orthogonal dimensions.
  
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
    id: `persona-dim-${nanoid()}`,
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

export async function classifyPersona(
  persona: string,
  dimensions: Dimension[]
) {
  // Given a persona and a set of dimensions classify the persona using the dimensions
  const dimensionSchema = z.object({
    classifiedDimensions: z
      .union(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        dimensions.map((d) => {
          return z.object({
            id: z.literal(d.id),
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            currentValues: z.array(z.union(d.values.map((v) => z.literal(v))))
          });
        })
      )
      .array()
  });

  const prompt = `You are an AI assistant tasked with classifying a persona based on specific dimensions.
Given a list of dimensions and a persona classify the personas by specifying the persona's dimension value in the currentValues array

Persona: """
${persona}
"""

Dimensions: """
${JSON.stringify(dimensions, null, 2)}
"""
`;

  const classifiedDimensions: { id: string; currentValues: string[] }[] = (
    await generateStructured(dimensionSchema, prompt)
  ).classifiedDimensions;

  const newDimensions = dimensions.map((d) => {
    const classifiedDimension = classifiedDimensions.find(
      (cd) => cd.id === d.id
    );

    return {
      ...d,
      currentValues: classifiedDimension?.currentValues || []
    };
  });

  return newDimensions;
}

export async function mergePersonas(
  personas: string[],
  dimensions: Dimension[],
  instructions: string
) {
  const prompt = `You are an AI assistant tasked with merging multiple personas into a single persona.
Limit each persona to 1-2 sentences. Don't add any Markdown or HTML formatting or line breaks, just plain text.

Personas: """
${personas.join('\n')}
"""

Instructions: """
${instructions}
"""
`;

  const mergedPersona = await generateString(prompt);

  const mergedDimensions = await classifyPersona(mergedPersona, dimensions);

  return { mergedPersona, mergedDimensions };
}
