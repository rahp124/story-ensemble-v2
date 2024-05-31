import { z } from 'zod';
import { generateStructured } from './generateStructured';
import { personaSchema, Persona } from '@/types';

const personaListSchema = z.object({
  personas: z.array(personaSchema)
});

export async function generatePersonas(context: string) {
  return generateStructured(personaListSchema, [
    {
      role: 'user',
      content: `Generate a 3 distinct, representative personas that have different challenges relevant to the following context: ${context}`
    }
  ]);
}

export async function editPersonas(personas: Persona[], directions: string) {
  const content = `Edit the following personas based on the directions. Feel free to add additional personas if needed.

PERSONAS: """
${JSON.stringify(personas, null, 2)}
"""

DIRECTIONS: """
${directions}
"""`;

  return generateStructured(personaListSchema, [
    {
      role: 'user',
      content
    }
  ]);
}
