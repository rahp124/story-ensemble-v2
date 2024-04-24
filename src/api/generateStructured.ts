import OpenAI from 'openai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { openai } from './openai';

export async function generateStructured<
  // Restrict to objects as OpenAI JSON mode struggles to generate arrays
  T extends z.AnyZodObject
>(
  zodSchema: T,
  messages: OpenAI.ChatCompletionMessageParam[]
): Promise<z.infer<T>> {
  const jsonSchema = JSON.stringify(zodToJsonSchema(zodSchema, 'schema'));

  const systemContent = `Output a JSON object or array that fits the schema based on the user message.

  JSON SCHEMA: """
  ${jsonSchema}
  """
  `;

  const message = await openai.chat.completions
    .create({
      model: 'gpt-4-turbo-preview',
      response_format: {
        type: 'json_object'
      },
      messages: [
        {
          role: 'system',
          content: systemContent
        },
        ...messages
      ]
    })
    .then((completion) => completion.choices[0].message.content);

  const result = JSON.parse(message || '');
  const validatedResult = zodSchema.parse(result) as z.infer<T>;

  return validatedResult;
}
