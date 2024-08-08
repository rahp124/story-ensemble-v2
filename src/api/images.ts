import { z } from 'zod';
import { generateStructured } from './openai';
import { generateImage } from './stableDiffusion';

export async function generateProblemIllustrativeImage(problem: unknown) {
  const prompt = `Generate an image which depicts a problem and helps to build empathy.
Generate a prompt for the which describes the scene that depicts the problem. Negative prompts describe what the scene should not include.

Problem: """
${JSON.stringify(problem)}
"""`;

  const imagePrompt = await generateStructured(imagePromptSchema, prompt);

  return await generateImage({ ...imagePrompt, aspectRatio: '16:9' });
}

const imagePromptPrompt = `Using following idea generate an image prompt and image negative prompt to generate an illustrative image which represents the key elements of the idea.
Describe a scene which is a visual metaphor for the persona, problem, or solution described in the idea.
Prompts should be short and focus on the visual metaphor and does not overly describe the characters.
Describe the image in a literal visual elements of the image, not the message or meaning of the image.`;

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

  return await generateImage({ ...imagePrompt, aspectRatio: '16:9' });
}
