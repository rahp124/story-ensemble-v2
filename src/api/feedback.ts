import { z } from 'zod';
import { generateStructured } from './openai';

const feedbackSchema = z.object({
  feedback: z.string().array()
});

export async function generatePersonaFeedback(node: unknown) {
  const prompt = `You are an UX designer given a persona.
Brainstorm questions to evaluate this persona being used for design thinking.

- Consider any information that is missing, but could be useful.
  - Example: If we know the persona is a salesperson, it may be useful to know what kind of product they sell?
- Consider the accuracy and consistency of the persona.
  - Example: If a persona is experienced, but only has a few years of experience this may be incorrect.
- Consider alternative persona values which may be useful.
  - Example: If a persona is a salesperson, could a sales manager be another useful persona to consider.

Persona: """
${JSON.stringify(node)}
"""`;

  const { feedback } = await generateStructured(feedbackSchema, prompt);
  return feedback;
}

export async function generateProblemFeedback(node: unknown) {
  const prompt = `You are an UX designer given a problem statement.
Brainstorm questions to evaluate this problem statement being used for design thinking.
Focus on the quality of the problem statement rather than solutions.

- Consider if any information that is missing, but could be useful.
  - Example: If we know a salesperson is struggling to find qualified leads, it may be useful to know what strategies they have tried.
- Consider the accuracy and consistency of the problem statement
  - Example: If a salesperson struggles to make connection, but can find qualified leads, this may be incorrect since qualified leads require connections.
- Consider alternative or related problem statements which may be useful
  - Example: If a salesperson struggles to find qualified leads, they may also struggle with finding leads in general.

Problem: """
${JSON.stringify(node)}
"""`;

  const { feedback } = await generateStructured(feedbackSchema, prompt);
  return feedback;
}

export async function generateSolutionFeedback(node: unknown) {
  const prompt = `You are an UX designer given a solution.
Brainstorm questions to evaluate this solution being used for design thinking.

- Consider if any information that is missing, but could be useful.
  - Example: If we want to create a networking mobile app, what are the key features of the app?
- Consider the accuracy and consistency of the solution
  - Example: A high-tech drone solution to deliver food to low-income families may be infeasible as the solution may be too expensive.
- Consider alternative or related solutions which may be useful
  - Example: If our solutions helps a salesperson find leads, it may be useful to also have a solution for qualifying those leads.

Solution: """
${JSON.stringify(node)}
"""`;

  const { feedback } = await generateStructured(feedbackSchema, prompt);
  return feedback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateStoryboardFeedback(storyboard: any) {
  const prompt = `You are an UX designer given a storyboard.
Brainstorm questions to evaluate this storyboard being used for design thinking.

Storyboard: """
${JSON.stringify(storyboard, null, 2)}
"""`;

  const { feedback } = await generateStructured(feedbackSchema, prompt);
  return feedback;
}

export async function generateMultipleNodeFeedback(nodes: unknown[]) {
  const prompt = `You are an UX designer given a list of nodes representing personas, problems, solutions, and storyboards.
Brainstorm questions to evaluate these nodes being used for design thinking.

Nodes: """
${JSON.stringify(nodes)}
"""`;

  const { feedback } = await generateStructured(feedbackSchema, prompt);
  return feedback;
}

const connectedFeedbackSchema = z.object({
  feedbacks: z
    .object({
      feedbackSummary: z.string(),
      affectedNodes: z.string().array(),
      feedback: z.string()
    })
    .array()
});
export type ConnectedFeedback = z.infer<
  typeof connectedFeedbackSchema
>['feedbacks'];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateConnectedFeedback(nodes: any, edges: any) {
  const prompt = `You are an UX designer given a list of nodes and the edges between these nodes.
Each node represents a persona, problem, or solution idea used in design thinking.

Come up with some helpful feedback on groups of nodes.

Nodes: """
${JSON.stringify(nodes)}
"""

Edges: """
${JSON.stringify(edges)}
"""`;

  const { feedbacks } = await generateStructured(
    connectedFeedbackSchema,
    prompt
  );
  return feedbacks;
}
