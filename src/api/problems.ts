import { generateStructured } from './openai';
import { z } from 'zod';

const PROBLEM_STATEMENT_PROMPT = `A problem statement is a description of an issue designers are trying to solve.
A good problem statement should be centered on specific people and their needs.
It should be narrow enough to be manageable but broad enough to explore a variety of solutions.
A problem statement should be a statement and not a question.
A problem statement should not suggest solutions.`;

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
      ? z.string().array().length(numberOfVariations)
      : z.string().array().min(1);
  const schema = z.object({
    problems: problemsSchema
  });

  const { problems } = await generateStructured(schema, prompt);
  return problems;
}

export async function regenerateProblems(problems: string[], context: unknown) {
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
    updatedProblems: z.string().array().length(problems.length)
  });

  const { updatedProblems } = await generateStructured(schema, prompt);
  return updatedProblems;
}
