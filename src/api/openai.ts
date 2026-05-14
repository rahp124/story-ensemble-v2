import { getOpenAiKey } from '@/lib/envUtils';
import OpenAI from 'openai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const openai = new OpenAI({
  apiKey: getOpenAiKey(),
  dangerouslyAllowBrowser: true
});

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  console.log(`⏱ [TIMING] ${label}: ${(performance.now() - start).toFixed(0)}ms`);
  return result;
}

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
  const response = await timed('generateStructured (gpt-4o)', () =>
    openai.chat.completions
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
      .then((completion) => completion.choices[0].message.content)
  );

  const result = JSON.parse(response || '');
  const validatedResult = zodSchema.parse(result);

  return validatedResult;
}

export async function generateString(prompt: string) {
  openai.apiKey = getOpenAiKey();
  const response = await timed('generateString (gpt-4o)', () =>
    openai.chat.completions
      .create({
        model: 'gpt-4o-2024-05-13',
        response_format: {
          type: 'text'
        },
        messages: [{ role: 'user', content: prompt }]
      })
      .then((completion) => completion.choices[0].message.content)
  );

  return response || '';
}

const dynamicFrameDataSchema = z.object({
  caption: z.string().min(1),
  imagePrompt: z.string().min(1)
});

export async function generateDynamicFrameData(
  frameIndex: number,
  answers: Record<string, string>,
  context = ''
): Promise<{ caption: string; imagePrompt: string }> {
  const answerString = JSON.stringify(answers, null, 2);

  // Log pipeline input
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔵 [PIPELINE: TEXT GEN INPUT]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Frame Index: ${frameIndex}`);
  console.log(`Context: ${context || '(none)'}`);
  console.log('\nAnswers JSON:');
  console.log(answerString);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let pacingInstruction = '';
  switch (frameIndex) {
    case 0:
      pacingInstruction =
        'Act 1 (Setup): Show the user in their current environment based on warm-up answers. Establish baseline. Do NOT include final solution.';
      break;
    case 1:
      pacingInstruction =
        'Act 2 (Conflict): The situation has worsened. Use "scene0_frustration" as the emotional core — visually show THAT specific frustration happening. Show the character\'s mindset (scene0_mindset) in their body language. Do NOT repeat the Act 1 setup. No solution.';
      break;
    case 2:
      pacingInstruction =
        'Act 3 (Action): The character is now actively trying to solve the problem. Use "scene1_frustration" and "scene1_mindset" to show what they attempted and how they feel. Struggle is still visible. Show a DIFFERENT location or action than previous frames. No resolution yet.';
      break;
    case 3:
      pacingInstruction = `Act 4 (Resolution): The character found relief. Use "scene2_frustration" and "scene3_frustration" to understand what changed. ${context ? `Solution context: ${context}.` : ''} Show the character satisfied in a visually DISTINCT scene. Show relief and resolution.`;
      break;
    default:
      pacingInstruction =
        'Generate a coherent storyboard frame that follows narrative pacing and uses only user-provided facts.';
      break;
  }

  const systemContent = `You are an expert UX storyboard director.
Output STRICT JSON with keys: caption, imagePrompt.
Hard rules:
- Never reveal final solution before Act 4.
- Use only details grounded in provided answers.
- Caption must be one sentence for this exact frame.
- imagePrompt must be visually specific and drawable.
- If story_progression appears in the answers: the next frame MUST NOT re-show any situation already described there. Advance the story.
- If frame1_caption, frame2_caption, or similar keys appear in the answers: preserve the exact same character appearance (clothing, physical description) in both the new caption and imagePrompt. Do not invent new appearance details.
- No markdown, no extra keys.`;

  const userContent = `Current Step: Frame ${frameIndex + 1} of 4

User answers:
${answerString}

STRICT PACING INSTRUCTION:
${pacingInstruction}

Return JSON with:
1) caption
2) imagePrompt`;

  openai.apiKey = getOpenAiKey();
  const response = await timed(`generateDynamicFrameData frame ${frameIndex} (gpt-4o-mini)`, () =>
    openai.chat.completions
      .create({
        model: 'gpt-4o-mini',
        response_format: {
          type: 'json_object'
        },
        messages: [
          {
            role: 'system',
            content: systemContent
          },
          {
            role: 'user',
            content: userContent
          }
        ]
      })
      .then((completion) => completion.choices[0].message.content)
  );

  const parsed = JSON.parse(response || '{}');
  const validated = dynamicFrameDataSchema.parse(parsed);

  // Log pipeline output
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🟢 [PIPELINE: TEXT GEN OUTPUT]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Frame Index: ${frameIndex}`);
  console.table({
    'Caption': validated.caption,
    'Image Prompt': validated.imagePrompt
  });
  console.log('\nFull JSON:');
  console.log(JSON.stringify(validated, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return validated;
}

const imagePromptOnlySchema = z.object({ imagePrompt: z.string().min(1) });
const captionOnlySchema = z.object({ caption: z.string().min(1) });
const titleOnlySchema = z.object({ title: z.string().min(1) });

export async function generateStoryboardTitle(
  answers: Record<string, string>,
  captions: string[],
  context = ''
): Promise<string> {
  openai.apiKey = getOpenAiKey();
  const response = await timed('generateStoryboardTitle (gpt-4o-mini)', () =>
    openai.chat.completions
      .create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Output JSON with a single key "title". Value must be a short, punchy storyboard title (3 to 7 words, Title Case, no quotes, no trailing punctuation) that captures the persona\'s journey from problem to resolution. No markdown, no extra keys.'
          },
          {
            role: 'user',
            content: `Generate a title for this 4-frame storyboard.\n\nUser answers:\n${JSON.stringify(answers, null, 2)}\n\nFrame captions in order:\n${captions.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n${context ? `Solution context: ${context}\n\n` : ''}Return JSON: { "title": "..." }`
          }
        ]
      })
      .then((c) => c.choices[0].message.content)
  );

  return titleOnlySchema.parse(JSON.parse(response || '{}')).title;
}

function buildPacingInstruction(frameIndex: number, context: string): string {
  const cascade =
    'Cascade rule: the answers dictionary contains warm-up answers plus every prior scene\'s content and aesthetics (scene0_*, scene1_*, ...). Treat these as the canonical record of what has already happened. Preserve character clothing, posture, appearance, environment, lighting, and any custom details the user supplied in earlier panels. For any visual attribute, the most recent non-empty value across ALL prior scenes wins — never drop an earlier detail just because the most recent scene didn\'t mention it.';

  switch (frameIndex) {
    case 0:
      return 'Act 1 (Setup): Show the user in their current environment. Draw from warm-up answers (location, priority). Establish the baseline situation. Do NOT show any solution or resolution.';
    case 1:
      return `Act 2 (Conflict): The situation has deteriorated. Use "scene0_frustration" as the emotional core of this frame — visually show THAT specific frustration unfolding. The character's mindset (scene0_mindset) should be visible in their body language. ${cascade} Do NOT repeat the setup from frame 1. No solution.`;
    case 2:
      return `Act 3 (Action): The character is now actively trying to resolve the problem. Use "scene1_frustration" and "scene1_mindset" to show WHAT they attempted and HOW they feel about it. ${cascade} The struggle should still be visible — no clean resolution yet. Show a DIFFERENT location or action than the previous frames.`;
    case 3:
      return `Act 4 (Resolution): The character found a solution.

PRIMARY (highest priority — the user's own words win): if "scene2_frustration", "scene2_custom", "scene3_frustration", or "scene3_custom" describes a specific solution (e.g. a kiosk, an app, a device, a piece of furniture, an environmental change), THAT is the solution depicted in this frame — even when it diverges from the Solution context below. The user's words override the pre-generated solution context. Render the solution literally as described.

SECONDARY (fallback only — use ONLY when the user's answers above do not describe a specific concrete solution): ${context ? `Solution context: ${context}.` : '(none provided)'}

${cascade}

Show the character relieved and satisfied, interacting with the solution defined by the rule above, in a visually DISTINCT scene from all previous frames.`;
    default:
      return 'Generate a coherent storyboard frame following narrative pacing.';
  }
}

export async function generateImagePrompt(
  frameIndex: number,
  answers: Record<string, string>,
  context = ''
): Promise<string> {
  const pacing = buildPacingInstruction(frameIndex, context);

  openai.apiKey = getOpenAiKey();
  const response = await timed(`generateImagePrompt frame ${frameIndex} (gpt-4o-mini)`, () =>
    openai.chat.completions
      .create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Output JSON with a single key "imagePrompt". Value must be a visually specific, drawable scene description. No markdown, no extra keys.'
          },
          {
            role: 'user',
            content: `Frame ${frameIndex + 1} of 4\n\nPacing: ${pacing}\n\nUser answers:\n${JSON.stringify(answers, null, 2)}\n\nReturn JSON: { "imagePrompt": "..." }`
          }
        ]
      })
      .then((c) => c.choices[0].message.content)
  );

  return imagePromptOnlySchema.parse(JSON.parse(response || '{}')).imagePrompt;
}

export async function generateTextContent(
  frameIndex: number,
  answers: Record<string, string>,
  context = ''
): Promise<string> {
  const pacing = buildPacingInstruction(frameIndex, context);

  openai.apiKey = getOpenAiKey();
  const response = await timed(`generateTextContent frame ${frameIndex} (gpt-4o-mini)`, () =>
    openai.chat.completions
      .create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Output JSON with a single key "caption". Value must be one sentence grounded in user answers. No markdown, no extra keys.'
          },
          {
            role: 'user',
            content: `Frame ${frameIndex + 1} of 4\n\nPacing: ${pacing}\n\nUser answers:\n${JSON.stringify(answers, null, 2)}\n\nReturn JSON: { "caption": "..." }`
          }
        ]
      })
      .then((c) => c.choices[0].message.content)
  );

  return captionOnlySchema.parse(JSON.parse(response || '{}')).caption;
}

export async function generateImageWithOpenAI({
  prompt,
  negativePrompt = '',
  stylePreset,
  referenceImage,
  size = '1024x1024'
}: {
  prompt: string;
  negativePrompt?: string;
  stylePreset?: string;
  referenceImage?: string;
  size?: '1024x1024' | '512x512';
}): Promise<string> {
  openai.apiKey = getOpenAiKey();

  let combinedPrompt = prompt;
  if (stylePreset) combinedPrompt += `, ${stylePreset} style`;
  if (negativePrompt) combinedPrompt += `. Avoid: ${negativePrompt}`;

  if (referenceImage) {
    try {
      const { b64_json } = await timed('generateImageWithOpenAI/edit (proxy → gpt-image-2)', async () => {
        const resp = await fetch('/api/generate-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: referenceImage, prompt: combinedPrompt, size, apiKey: getOpenAiKey() })
        });
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({})) as { error?: string };
          throw new Error(`Proxy error ${resp.status}: ${body.error ?? 'unknown'}`);
        }
        return resp.json() as Promise<{ b64_json: string }>;
      });
      return `data:image/png;base64,${b64_json}`;
    } catch (err) {
      console.warn('[generateImageWithOpenAI] proxy edit failed, falling back to generate:', err);
    }
  }

  const response = await timed('generateImageWithOpenAI/generate (gpt-image-1)', () =>
    openai.images.generate({
      model: 'gpt-image-1',
      prompt: combinedPrompt,
      n: 1,
      size
    })
  );

  const first = response.data?.[0];
  if (!first) throw new Error('OpenAI returned no image data');
  if (first.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first.url) return first.url;
  throw new Error('OpenAI returned image data with neither b64_json nor url');
}
