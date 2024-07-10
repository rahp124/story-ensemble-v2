import { z } from 'zod';
import { generateStructured } from './openai';

const tagsSchema = z.object({
  personaAttributes: z.object({
    bio: z.string(),
    needs: z.string(),
    challenges: z.string()
  }),
  tags: z.string().array().max(10)
});

export async function generatePersonaTags(content: string) {
  const prompt = `You are service which generates tags from a text description of a user persona.
These tags will be displayed to users as an easier to skim summary of the text description.
Generate at most 10 tags that best summarize and differentiate the persona.
Order tags in order of importance for comprehension.
Tags should be short and descriptive and make sense on their own.
Each tag should summarize a specific aspect of the persona such as their bio, needs, and challenges.
Use emojis when possible to enhance comprehension.

Content: """
${content}
"""`;

  const { tags } = await generateStructured(tagsSchema, prompt);
  return tags;
}
