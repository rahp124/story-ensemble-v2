import { getOpenAiKey } from '@/lib/envUtils';
import OpenAI from 'openai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const openai = new OpenAI({
  apiKey: getOpenAiKey(),
  dangerouslyAllowBrowser: true
});

// TODO retry on failure
// TODO handle max token length error
export async function generateStructured<
  // Restrict to objects as OpenAI JSON mode struggles to generate arrays
  T extends z.AnyZodObject
>(zodSchema: T, prompt: string): Promise<z.infer<T>> {
  const jsonSchema = JSON.stringify(zodToJsonSchema(zodSchema, 'schema'));

  const systemContent = `Output a JSON object that fits the schema based on the user message.

  JSON SCHEMA: """
  ${jsonSchema}
  """
  `;

  openai.apiKey = getOpenAiKey();
  const response = await openai.chat.completions
    .create({
      model: 'gpt-4o-2024-05-13',
      response_format: {
        type: 'json_object'
      },
      messages: [
        {
          role: 'system',
          content: systemContent
        },
        { role: 'user', content: prompt }
      ]
    })
    .then((completion) => completion.choices[0].message.content);

  const result = JSON.parse(response || '');
  const validatedResult = zodSchema.parse(result);

  return validatedResult;
}

export async function generateString(prompt: string) {
  openai.apiKey = getOpenAiKey();
  const response = await openai.chat.completions
    .create({
      model: 'gpt-4o-2024-05-13',
      response_format: {
        type: 'text'
      },
      messages: [{ role: 'user', content: prompt }]
    })
    .then((completion) => completion.choices[0].message.content);

  return response || '';
}

export async function generateImageWithOpenAI({
  prompt,
  negativePrompt = '',
  stylePreset
}: {
  prompt: string;
  negativePrompt?: string;
  stylePreset?: string;
}) {
  openai.apiKey = getOpenAiKey();

  let combinedPrompt = prompt;
  if (stylePreset) {
    combinedPrompt += `, ${stylePreset} style`;
  }
  if (negativePrompt) {
    combinedPrompt += `. Avoid: ${negativePrompt}`;
  }

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: combinedPrompt,
    n: 1,
    size: '1024x1024',
    response_format: 'b64_json'
  });
  const image = response.data[0].b64_json;
  return `data:image/webp;base64,${image}`;
}
