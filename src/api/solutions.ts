import { z } from 'zod';
import { generateStructured } from './generateStructured';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

const solutionsSchema = z.object({
  solutions: z.array(z.string())
});

export async function generateSolutions(context: string, problems: string[]) {
  const baseMessage = {
    role: 'user',
    content: `Generate 3 solutions relevant to the following context: ${context}`
  } as const;
  const personaContextMessage = {
    role: 'user',
    content: `The solutions should apply to the following problems or related problems. However, solutions should be phrased in a general way that doesn't mention the problems directly.
    
PROBLEMS: """
${JSON.stringify(problems, null, 2)}
"""
`
  } as const;

  const messages: ChatCompletionMessageParam[] = [baseMessage];
  if (problems.length > 0) {
    messages.push(personaContextMessage);
  }

  const { solutions } = await generateStructured(solutionsSchema, messages);
  return solutions;
}

export const mockSolutions = [
  'Implementing drone technology for efficient delivery of fresh ingredients.',
  'Utilizing drone technology to enhance access to diverse and affordable food options in remote areas.',
  'Deploying drone solutions to streamline meal preparation and improve nutritional outcomes in hard-to-access locations.'
];
