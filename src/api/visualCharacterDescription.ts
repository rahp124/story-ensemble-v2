import { visualCharacterDescriptionSchema } from '@/types';
import { generateStructured } from './openai';
import { z } from 'zod';

const VISUAL_CHARACTER_DESCRIPTION_API = `Generate visual character descriptions used to ensure visual consistency between different artists and illustrations.`;

export async function generateVisualCharacterDescriptions(idea: unknown) {
  const prompt = `${VISUAL_CHARACTER_DESCRIPTION_API}
  
Generate a visual character description used to illustrate the following idea.

Idea: """
${JSON.stringify(idea)}
"""`;

  const { visualCharacterDescriptions } = await generateStructured(
    z.object({
      visualCharacterDescriptions: z.array(visualCharacterDescriptionSchema)
    }),
    prompt
  );

  return visualCharacterDescriptions;
}
