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

const MORE_PERSONA_PROMPT = `Generate autocomplete suggestions for descriptions of a general group of personas which differ from the provided personas.
Suggestions should be a couple of words.`;
const MORE_PROBLEM_PROMPT = `Generate autocomplete suggestions for descriptions of a general group of problems which differ from the provided problems.
Suggestions should be a couple of words.`;
const MORE_SOLUTION_PROMPT = `Generate autocomplete suggestions for descriptions of a general group of solutions which differ from the provided solutions.
Suggestions should be a couple of words.`;
const MORE_STORYBOARD_PROMPT = `Generate autocomplete suggestions for the title of a general group of storyboards which differ from the provided storyboards.
The title should generally describe the plot of the storyboard.`;

function moreNodePrompt(
  nodeToGenerate: 'Persona' | 'Problem' | 'Solution' | 'Storyboard' | string
) {
  if (nodeToGenerate === 'Persona') {
    return MORE_PERSONA_PROMPT;
  } else if (nodeToGenerate === 'Problem') {
    return MORE_PROBLEM_PROMPT;
  } else if (nodeToGenerate === 'Solution') {
    return MORE_SOLUTION_PROMPT;
  } else if (nodeToGenerate === 'Storyboard') {
    return MORE_STORYBOARD_PROMPT;
  } else {
    return '';
  }
}

export async function generateMoreNodeDescriptionRecommendations(
  dependencyNodes: unknown[],
  nodeToGenerate: 'Persona' | 'Problem' | 'Solution' | 'Storyboard' | string
) {
  const prompt = `${moreNodePrompt(nodeToGenerate)}

Nodes: """
${JSON.stringify(dependencyNodes)}
"""`;

  const { recommendations } = await generateStructured(
    recommendationsSchema,
    prompt
  );
  return recommendations;
}

const UPDATE_NODE_PROMPT = `Generate suggestions for specific instructions to update/change the following design thinking nodes.
Nodes will be either personas, problems, solutions, or storyboards.
Suggestions should focus on variations or edits to existing nodes.
Constrain suggestions to 100 characters.`;

export async function generateUpdateNodeDescriptionRecommendations(
  nodes: unknown[]
) {
  const prompt = `${UPDATE_NODE_PROMPT}

Nodes: """
${JSON.stringify(nodes)}
"""`;

  const { recommendations } = await generateStructured(
    recommendationsSchema,
    prompt
  );
  return recommendations;
}
