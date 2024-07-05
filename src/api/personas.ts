import { generateStructured } from './openai';
import { z } from 'zod';

const USER_PERSONA_PROMPT = `User personas are detailed descriptions of fictional characters that represent different user types. They help designers gain empathy for their users and understand their needs, goals, and behaviors.`;

export async function generatePersonas(
  context: unknown,
  numberOfVariations?: number
) {
  const prompt = `${USER_PERSONA_PROMPT}
Create ${numberOfVariations ?? 'multiple'} personas based on the given context.

Context: """
${JSON.stringify(context)}
"""`;

  const personasSchema =
    numberOfVariations !== undefined
      ? z.string().array().length(numberOfVariations)
      : z.string().array().min(1);
  const schema = z.object({
    personas: personasSchema
  });

  const { personas } = await generateStructured(schema, prompt);
  return personas;
}

export async function regeneratePersonas(personas: string[], context: unknown) {
  const prompt = `${USER_PERSONA_PROMPT}
Update the given personas based on the new context/instructions keep the essence of the persona intact, but make necessary changes to ensure cohesiveness with the new context.

Personas: """
${JSON.stringify(personas)}
"""

Context: """
${JSON.stringify(context)}
"""`;

  const schema = z.object({
    updatedPersonas: z.string().array().length(personas.length)
  });

  const { updatedPersonas } = await generateStructured(schema, prompt);
  return updatedPersonas;
}
