import { solutionSchema } from '@/types';
import { generateStructured } from './openai';
import { z } from 'zod';

const SOLUTION_PROMPT = `A design solution is a proposal for addressing specific problems or user needs.
Solutions don't have to be perfect, but instead should be a starting point for further refinement and iteration.`;

export async function generateSolutions(
  context: unknown,
  numberOfVariations?: number
) {
  const prompt = `${SOLUTION_PROMPT}
Create ${numberOfVariations ?? 'multiple'} solutions based on the given context.

Context: """
${JSON.stringify(context)}`;

  const solutionsSchema =
    numberOfVariations !== undefined
      ? solutionSchema.array().length(numberOfVariations)
      : solutionSchema.array().min(1);
  const schema = z.object({
    solutions: solutionsSchema
  });

  const { solutions } = await generateStructured(schema, prompt);
  return solutions;
}

export async function regenerateSolutions(
  solutions: string[],
  context: unknown
) {
  const prompt = `${SOLUTION_PROMPT}
Update the given solutions based on the new context/instructions.
Keep the essence of the problem statement intact, but make necessary changes to ensure cohesiveness.

Problems: """
${JSON.stringify(solutions)}
"""

Context: """
${JSON.stringify(context)}
"""`;

  const schema = z.object({
    updateSolutions: solutionSchema.array().length(solutions.length)
  });

  const { updateSolutions } = await generateStructured(schema, prompt);
  return updateSolutions;
}
