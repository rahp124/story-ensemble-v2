import { z } from 'zod';
import { generateStructured } from './openai';

const recommendationsSchema = z.object({
  recommendations: z.array(z.string()).max(4)
});

const DEPENDENT_PROBLEM_PROMPT = `Generate autocomplete suggestions for descriptions of a general group of problems based on the provided personas.
Suggestions should be a couple of words.`;

const DEPENDENT_SOLUTION_PROMPT = `Generate autocomplete suggestions for descriptions of a general group of solutions based on the provided problems.
Suggestions should be a couple of words.`;

const DEPENDENT_STORYBOARD_PROMPT = `Generate autocomplete suggestions for the title of a general group of storyboards based on the provided personas, problems, and solutions.
The title should generally describe the plot of the storyboard.`;

function dependentNodePrompt(
  nodeToGenerate: 'Problem' | 'Solution' | 'Storyboard' | string
) {
  if (nodeToGenerate === 'Problem') {
    return DEPENDENT_PROBLEM_PROMPT;
  } else if (nodeToGenerate === 'Solution') {
    return DEPENDENT_SOLUTION_PROMPT;
  } else if (nodeToGenerate === 'Storyboard') {
    return DEPENDENT_STORYBOARD_PROMPT;
  } else {
    return '';
  }
}

export async function generateDependentNodeDescriptionRecommendations(
  dependencyNodes: unknown[],
  nodeToGenerate: 'Problem' | 'Solution' | 'Storyboard' | string
) {
  const prompt = `${dependentNodePrompt(nodeToGenerate)}

Nodes: """
${JSON.stringify(dependencyNodes)}
"""`;

  const { recommendations } = await generateStructured(
    recommendationsSchema,
    prompt
  );
  return recommendations;
}
