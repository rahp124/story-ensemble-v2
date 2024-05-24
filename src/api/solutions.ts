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

const solutionSchema = z.object({
  solution: z.string()
});
export async function regenerateSolution(
  problems: string[],
  changes: { previous: string; current: string }[],
  previousSolution: string
) {
  const baseMessage = {
    role: 'user',
    content: `A solution was is relevant to some problems. Regenerate the solutions based on the new changes.
Do not come up with multiple solutions. Come up with a single solution that addresses all the changes and differences.
Ensure solutions are 1-2 sentences.
    `
  } as const;
  const problemsMessage = {
    role: 'user',
    content: `PROBLEMS: """
${JSON.stringify(problems, null, 2)}
"""`
  } as const;
  const changesMessage = {
    role: 'user',
    content: `CHANGES: """
${JSON.stringify(changes, null, 2)}
"""`
  } as const;
  const previousSolutionMessage = {
    role: 'user',
    content: `PREVIOUS SOLUTION: """
${previousSolution}
"""`
  } as const;

  const messages: ChatCompletionMessageParam[] = [
    baseMessage,
    problemsMessage,
    changesMessage,
    previousSolutionMessage
  ];

  const { solution } = await generateStructured(solutionSchema, messages);
  return solution;
}

export const mockSolutions = [
  'Implementing drone technology for efficient delivery of fresh ingredients.',
  'Utilizing drone technology to enhance access to diverse and affordable food options in remote areas.',
  'Deploying drone solutions to streamline meal preparation and improve nutritional outcomes in hard-to-access locations.'
];
