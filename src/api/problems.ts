import { z } from 'zod';
import { generateStructured } from './generateStructured';
import { Persona } from './personas';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';

const problemsSchema = z.object({
  problems: z.array(z.string())
});

export async function generateProblems(context: string, personas: Persona[]) {
  const baseMessage = {
    role: 'user',
    content: `Generate 3 problems statements relevant to the following context: ${context}`
  } as const;
  const personaContextMessage = {
    role: 'user',
    content: `The problem statements should apply to people that match following personas. However, phrase problems in a general way that doesn't mention the personas directly.
    
PERSONAS: """
${JSON.stringify(personas, null, 2)}
"""
`
  } as const;

  const messages: ChatCompletionMessageParam[] = [baseMessage];
  if (personas.length > 0) {
    messages.push(personaContextMessage);
  }

  const { problems } = await generateStructured(problemsSchema, messages);
  return problems;
}

export const mockProblems = [
  'Limited access to fresh and affordable ingredients…w-income families seeking nutritious meal options',
  'Lack of cooking skills and time constraints preven…s from preparing healthy meals for their families',
  'Limited availability of grocery stores offering di…ds of low-income families residing in rural areas'
];
