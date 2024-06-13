import { z } from 'zod';
import { generateStructured } from './openai';
import { generateImage } from './stableDiffusion';

const imagePromptPrompt = `Using following idea generate an image prompt and image negative prompt to generate an illustrative image which represents the key elements of the idea.`;

export const imagePromptSchema = z.object({
  prompt: z.string(),
  negativePrompt: z.string()
});

export async function generateIllustrativeImage(idea: string) {
  const prompt = `${imagePromptPrompt}

Idea: """
${idea}
"""`;

  const imagePrompt = await generateStructured(imagePromptSchema, prompt);

  return await generateImage(imagePrompt);
}
