import { z } from 'zod';
import { generateStructured } from './generateStructured';
import { Dimension, newDimensionsSchema } from '@/types';

export async function generateSolutionDimensions(
  existingDimensions: Dimension[],
  instructions: string
): Promise<Dimension[]> {
  const prompt = `
Dimensions define a solution space of possibilities. Each dimension has a set of values that it can be assigned. Combinations of dimensions and values can be used to generate a set of solutions.
Given a set of existing dimensions and user instructions. Generate a set of new dimensions if needed to fully explore the solution space.
Dimensions that have already been assigned should be considered pinned which can inform the generation of new dimensions.
If there are no existing dimensions, make sure to generate a set of dimensions to explore the solution space.

Existing Dimensions: """
${JSON.stringify(existingDimensions, null, 2)}
"""

Instructions: """
${instructions}
"""`;

  const { newDimensions } = await generateStructured(newDimensionsSchema, [
    { role: 'user', content: prompt }
  ]);
  return newDimensions.map((dimension) => ({
    ...dimension,
    currentValues: []
  }));
}

export async function generateSolution(
  problems: string[],
  dimensionValues: Dimension[],
  instructions: string
) {
  const prompt = `You are a product and user experience designer.

Given a list of problems generate a solution. This solution is defined by a set of dimensions and assigned values. The dimensions and values should be used to generate a solution that addresses the problems.
Additionally take into account user instructions.

Problems: """
${JSON.stringify(problems, null, 2)}
"""

Dimensions: """
${JSON.stringify(dimensionValues, null, 2)}
"""

Instructions: """
${instructions}
"""`;

  const { solution } = await generateStructured(
    z.object({ solution: z.string() }),
    [{ role: 'user', content: prompt }]
  );
  return solution;
}
// export async function generateSolutions(context: string, problems: string[]) {
//   const baseMessage = {
//     role: 'user',
//     content: `Generate 3 solutions relevant to the following context: ${context}`
//   } as const;
//   const personaContextMessage = {
//     role: 'user',
//     content: `The solutions should apply to the following problems or related problems. However, solutions should be phrased in a general way that doesn't mention the problems directly.

// PROBLEMS: """
// ${JSON.stringify(problems, null, 2)}
// """
// `
//   } as const;

//   const messages: ChatCompletionMessageParam[] = [baseMessage];
//   if (problems.length > 0) {
//     messages.push(personaContextMessage);
//   }

//   const { solutions } = await generateStructured(solutionsSchema, messages);
//   return solutions;
// }

// export async function generateSolution(
//   currentSolutions: Record<
//     string,
//     {
//       id: string;
//       problems: string[];
//       solution: string;
//     }
//   >,
//   instructions: string
// ) {
//   const solutionsSchema = z.object(
//     Object.keys(currentSolutions).reduce(
//       (acc: Record<string, z.ZodString>, key) => {
//         acc[key] = z.string();
//         return acc;
//       },
//       {}
//     )
//   );

//   const prompt = `You are an experienced product and user experience designer.
// Below is a map of solutions which contains a draft solution and a list of problems they should address indexed by id. There is also a set of instructions for updating the solutions.
// Your task is to update and improve the solutions so that they each cohesively addresses all the problems listed and to follow the instructions.
// The solutions should approach the problems in a variety of ways in order to provide a comprehensive exploration of the solution space.
// The solutions should be 1-2 sentences long. Describe the solution in a neutral way.
// You must update each solution, by outputting map of ids to the updated solutions.

// Current Solutions:
// ${JSON.stringify(currentSolutions, null, 2)}

// Instructions:
// ${instructions}

// Updated Solutions:
// `;

//   const response = await generateStructured(solutionsSchema, [
//     { role: 'user', content: prompt }
//   ]);
//   return response;
// }
