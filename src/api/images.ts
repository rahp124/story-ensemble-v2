import { z } from 'zod';
import { generateStructured } from './openai';
import { generateImage } from './stableDiffusion';

const imagePromptPrompt = `Using following idea generate an image prompt and image negative prompt to generate an illustrative image which represents the key elements of the idea.
Include the full name of each person in the prompt to ensure consistent characters.`;

export const imagePromptSchema = z.object({
  prompt: z.string(),
  negativePrompt: z.string()
});

export async function generateIllustrativeImage(idea: unknown) {
  const prompt = `${imagePromptPrompt}

Idea: """
${JSON.stringify(idea)}
"""`;

  const imagePrompt = await generateStructured(imagePromptSchema, prompt);

  return await generateImage(imagePrompt);
}
