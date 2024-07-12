import { problemSchema } from '@/types';
import { generateStructured } from './openai';
import { z } from 'zod';

const PROBLEM_STATEMENT_PROMPT = `A problem statement is a description of an issue designers are trying to solve.
A good problem statement should be centered on specific people and their needs.
It should be narrow enough to be manageable but broad enough to explore a variety of solutions.
A problem statement should be a statement and not a question.
A problem statement should not suggest solutions.

Keep values short and to the point and use emojis where possible.
Avoid repeating the same information in different values.`;

export async function generateProblems(
  context: unknown,
  numberOfVariations?: number
) {
  const prompt = `${PROBLEM_STATEMENT_PROMPT}
Create ${
    numberOfVariations ?? 'multiple'
  } problem statements based on the given context.

Context: """
${JSON.stringify(context)}`;

  const problemsSchema =
    numberOfVariations !== undefined
      ? problemSchema.array().length(numberOfVariations)
      : problemSchema.array().min(1);
  const schema = z.object({
    problems: problemsSchema
  });

  const { problems } = await generateStructured(schema, prompt);
  return problems;
}

export async function regenerateProblems(
  problems: unknown[],
  context: unknown
) {
  const prompt = `${PROBLEM_STATEMENT_PROMPT}
Update the given problem statements based on the new context/instructions.
Keep the essence of the problem statement intact, but make necessary changes to ensure cohesiveness.

Problems: """
${JSON.stringify(problems)}
"""

Context: """
${JSON.stringify(context)}
"""`;

  const schema = z.object({
    updatedProblems: problemSchema.array().length(problems.length)
  });

  const { updatedProblems } = await generateStructured(schema, prompt);
  return updatedProblems;
}
