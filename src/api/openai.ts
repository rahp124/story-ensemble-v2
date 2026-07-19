import { getOpenAiKey } from '@/lib/envUtils';
import { apiUrl } from '@/lib/apiBase';
import OpenAI from 'openai';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { sketchFrameDataSchema, SketchFrameData, VisualCharacterDescription, VisualStylePreferences } from '@/types';

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

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 150
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const delay = baseDelayMs * 2 ** i;
        console.warn(`[retry] ${label} attempt ${i + 1}/${attempts} failed, retrying in ${delay}ms:`, err);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

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
        'Act 1 (Setup): Show the student in their current environment based on warm-up answers. Establish baseline. Do NOT include final solution.';
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
    'Cascade rule: the answers dictionary contains warm-up answers plus every prior scene\'s content and aesthetics (scene0_*, scene1_*, ...). Treat these as the canonical record of what has already happened. Preserve character clothing, posture, appearance, environment, lighting, and any custom details the student supplied in earlier panels. For any visual attribute, the most recent non-empty value across ALL prior scenes wins — never drop an earlier detail just because the most recent scene didn\'t mention it.';

  switch (frameIndex) {
    case 0:
      return 'Act 1 (Setup): Show the student in their current environment. Draw from warm-up answers (location, priority). Establish the baseline situation. Do NOT show any solution or resolution.';
    case 1:
      return `Act 2 (Conflict): The situation has deteriorated. Use "scene0_frustration" as the emotional core of this frame — visually show THAT specific frustration unfolding. The character's mindset (scene0_mindset) should be visible in their body language. ${cascade} Do NOT repeat the setup from frame 1. No solution.`;
    case 2:
      return `Act 3 (Action): The character is now actively trying to resolve the problem. Use "scene1_frustration" and "scene1_mindset" to show WHAT they attempted and HOW they feel about it. ${cascade} The struggle should still be visible — no clean resolution yet. Show a DIFFERENT location or action than the previous frames.`;
    case 3:
      return `Act 4 (Resolution): The character found a solution.

    PRIMARY (highest priority — the student's own words win): if "scene2_frustration", "scene2_custom", "scene3_frustration", or "scene3_custom" describes a specific solution (e.g. a kiosk, an app, a device, a piece of furniture, an environmental change), THAT is the solution depicted in this frame — even when it diverges from the Solution context below. The student's words override the pre-generated solution context. Render the solution literally as described.

    SECONDARY (fallback only — use ONLY when the student's answers above do not describe a specific concrete solution): ${context ? `Solution context: ${context}.` : '(none provided)'}

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
  const sceneKey = `scene${frameIndex}`;
  const currentCharAdjust = answers[`${sceneKey}_char_adjust`] ?? '';
  const currentActionAdjust = answers[`${sceneKey}_action_adjust`] ?? '';
  const currentEnvAdjust = answers[`${sceneKey}_env_adjust`] ?? '';
  const currentCustom = answers[`${sceneKey}_custom`] ?? '';

  const overrideInstruction = [
    currentCharAdjust ? `character adjustment: ${currentCharAdjust}` : '',
    currentActionAdjust ? `action adjustment: ${currentActionAdjust}` : '',
    currentEnvAdjust ? `environment adjustment: ${currentEnvAdjust}` : '',
    currentCustom ? `custom notes: ${currentCustom}` : ''
  ]
    .filter(Boolean)
    .join('\n');

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
              'Output JSON with a single key "imagePrompt". Value must be a visually specific, drawable scene description. No markdown, no extra keys. If current-scene visual adjustments are present, treat them as hard constraints and apply them explicitly in the prompt.'
          },
          {
            role: 'user',
            content: `Frame ${frameIndex + 1} of 4\n\nPacing: ${pacing}\n\nCurrent-scene visual adjustments (hard constraints):\n${overrideInstruction || 'none'}\n\nUser answers:\n${JSON.stringify(answers, null, 2)}\n\nReturn JSON: { "imagePrompt": "..." }`
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
      const { b64_json } = await withRetry('generateImageWithOpenAI/edit', () =>
        timed('generateImageWithOpenAI/edit (proxy → gpt-image-2)', async () => {
          const resp = await fetch(apiUrl('generate-edit'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: referenceImage, prompt: combinedPrompt, size, apiKey: getOpenAiKey() })
          });
          if (!resp.ok) {
            const body = await resp.json().catch(() => ({})) as { error?: string };
            throw new Error(`Proxy error ${resp.status}: ${body.error ?? 'unknown'}`);
          }
          return resp.json() as Promise<{ b64_json: string }>;
        })
      );
      return `data:image/png;base64,${b64_json}`;
    } catch (err) {
      console.warn('[generateImageWithOpenAI] proxy edit failed, falling back to generate:', err);
    }
  }

  const response = await withRetry('generateImageWithOpenAI/generate', () =>
    timed('generateImageWithOpenAI/generate (gpt-image-1)', () =>
      openai.images.generate({
        model: 'gpt-image-1',
        prompt: combinedPrompt,
        n: 1,
        size
      })
    )
  );

  const first = response.data?.[0];
  if (!first) throw new Error('OpenAI returned no image data');
  if (first.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first.url) return first.url;
  throw new Error('OpenAI returned image data with neither b64_json nor url');
}

const SKETCH_FRAME_TYPES = ['Context', 'Problem', 'Action', 'Resolution'] as const;

const normalizeSketchPosition = (value: unknown): 'left' | 'center' | 'right' | 'background' => {
  const validPositions = ['left', 'center', 'right', 'background'];
  if (typeof value === 'string' && validPositions.includes(value)) {
    return value as 'left' | 'center' | 'right' | 'background';
  }

  // Map common invalid values to valid ones
  const invalidToValidMap: Record<string, 'left' | 'center' | 'right' | 'background'> = {
    'foreground': 'center',
    'front': 'center',
    'middle': 'center',
    'top': 'center',
    'bottom': 'center',
    'top-left': 'left',
    'top-right': 'right',
    'bottom-left': 'left',
    'bottom-right': 'right'
  };

  if (typeof value === 'string' && value.toLowerCase() in invalidToValidMap) {
    return invalidToValidMap[value.toLowerCase()];
  }

  return 'center';
};

const normalizeFrameType = (
  value: unknown,
  index: number
): 'Context' | 'Problem' | 'Action' | 'Resolution' => {
  const expected = SKETCH_FRAME_TYPES[index];
  if (value === expected) return expected;

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (normalized === expected) return expected;
  }

  return expected;
};

const normalizeSketchObject = (obj: Record<string, unknown>, frameIndex: number): SketchFrameData => {
  const normalized = { ...obj };

  // Normalize frameType
  if (frameIndex >= 0 && frameIndex < SKETCH_FRAME_TYPES.length) {
    normalized.frameType = normalizeFrameType(obj.frameType, frameIndex);
  }

  // Ensure required string fields have defaults
  if (!normalized.settingLabel || typeof normalized.settingLabel !== 'string') {
    normalized.settingLabel = `Scene ${frameIndex + 1}`;
  }

  if (!normalized.caption || typeof normalized.caption !== 'string') {
    normalized.caption = `[Scene ${frameIndex + 1}]`;
  }

  // Ensure arrays exist
  if (!Array.isArray(normalized.actors)) {
    normalized.actors = [];
  }
  if (!Array.isArray(normalized.objects)) {
    normalized.objects = [];
  }

  // Normalize actor positions
  if (Array.isArray(normalized.actors)) {
    normalized.actors = normalized.actors.map((actor: Record<string, unknown>) => ({
      ...actor,
      position: normalizeSketchPosition(actor?.position)
    }));
  }

  // Normalize object positions
  if (Array.isArray(normalized.objects)) {
    normalized.objects = normalized.objects.map((object: Record<string, unknown>) => ({
      ...object,
      position: normalizeSketchPosition(object?.position)
    }));
  }

  // Normalize barrier positions
  if (Array.isArray(normalized.barriers)) {
    normalized.barriers = normalized.barriers.map((barrier: Record<string, unknown>) => ({
      ...barrier,
      position: normalizeSketchPosition(barrier?.position)
    }));
  }

  return normalized as SketchFrameData;
};

const sketchStoryboardSchema = z.object({
  frames: sketchFrameDataSchema.array().length(4)
});

export async function generateInitialSketchStoryboardFrames(
  answers: Record<string, string>,
  context = ''
): Promise<SketchFrameData[]> {
  const answerString = JSON.stringify(answers, null, 2);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 [SKETCH: GEN INPUT]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Context:', context || '(none)');
  console.log('\nAnswers JSON:');
  console.log(answerString);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const systemContent = `You are generating a LOW-FIDELITY UX STORYBOARD DATA for rapid prototyping, NOT a visual image.
Output ONLY pure JSON. No markdown, no extra text.

CRITICAL RULES:
- This is UX data for a sketch renderer. Use ONLY the allowed schema values.
- DO NOT include detailed appearance, gender, race, clothing, or visual style.
- Prioritize: user goal, setting, obstacle/friction, action, emotional state, outcome.
- For Context frames, show where the student is making the decision or starting the task, not the later destination.
- If the story is about getting food before another event, prefer the current food-decision setting (for example: student center, cafeteria, hallway, kiosk, counter) instead of the destination (for example: classroom), unless the destination is truly where the decision happens.
- Labels must be SHORT and READABLE (8-10 characters maximum).

REQUIRED FIELDS (every frame must include):
- frameType: MUST be exactly one of: "Context", "Problem", "Action", "Resolution"
- settingLabel: REQUIRED - brief 1-2 word label for location (e.g., "cafeteria", "office", "home")
- caption: REQUIRED - one-sentence description of what's happening
- actors: REQUIRED - array of characters (can be empty, but field must exist)
- objects: REQUIRED - array of scene elements (can be empty, but field must exist)

VALID VALUES (STRICT):
frameType order (do NOT reorder):
  1. "Context"
  2. "Problem"
  3. "Action"
  4. "Resolution"

position MUST be exactly one of: "left", "center", "right", "background"
- NEVER use: "foreground", "front", "middle", "top", "bottom"
- If unsure, use "center"

objectType MUST be one of: "counter", "table", "chair", "door", "phone", "screen", "queue", "clock", "bag", "stairs", "ramp", "sign", "vehicle", "generic"
- If unclear, use "generic"

emotion MUST be one of: "neutral", "confused", "frustrated", "relieved"
- Default to "neutral" unless critical

posture MUST be one of: "standing", "sitting", "walking", "waiting", "reaching"

SCHEMA RULES:
- Each frame must have actors (array), objects (array), optional barriers/arrows/thoughtBubble
- Each actor must have: id, name (short label), posture, emotion, position, description (brief, no visual style)
- Each object must have: id, type, position, optional description
- Each barrier must have: id, type, position, description`;

  const pacingInstructions = `Frame 1 (CONTEXT): Show the decision setting where the student is starting from. Keep it minimal, but anchored in the present choice.
Do NOT jump to the later destination if the student is deciding what to do before getting there.
Example: if the student needs healthy food before lecture, show student center / food options / time pressure, not just classroom.
REQUIRED: settingLabel (location), caption (one sentence)

Frame 2 (PROBLEM): Same actor, situation reveals frustration/problem. What blocks them? Show barrier clearly. No Act 1 repeat.
REQUIRED: settingLabel (location), caption (one sentence)

Frame 3 (ACTION): Actor attempts workaround or solves problem. What action? Show effort. DIFFERENT location/action from prior frames.
REQUIRED: settingLabel (location), caption (one sentence)

Frame 4 (RESOLUTION): Actor found solution or relief. What changed? Outcome visualized. Character satisfied/relieved. DISTINCT scene.
REQUIRED: settingLabel (location), caption (one sentence)
${context ? `\n\nSOLUTION HINT: ${context}` : ''}`;

  const userContent = `Generate a 4-frame low-fidelity storyboard sketch based on this user input:

${answerString}

${pacingInstructions}

Return ONLY a JSON object with key "frames" containing an array of exactly 4 SketchFrameData objects in this order:
1. frameType: "Context" with settingLabel and caption
2. frameType: "Problem" with settingLabel and caption
3. frameType: "Action" with settingLabel and caption
4. frameType: "Resolution" with settingLabel and caption

VERIFY BEFORE RETURNING:
- Exactly 4 frames in that exact order
- EVERY FRAME has settingLabel (string, not null/undefined)
- EVERY FRAME has caption (string, not null/undefined)
- All positions are only: left, center, right, or background
- All frameTypes match the order above exactly
- No extra fields`;

  openai.apiKey = getOpenAiKey();
  const response = await timed('generateInitialSketchStoryboardFrames (gpt-4o-mini)', () =>
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

  const parsed = JSON.parse(response || '{"frames":[]}');

  // Normalize each frame before validation
  if (Array.isArray(parsed.frames)) {
    parsed.frames = parsed.frames.map((frame: Record<string, unknown>, idx: number) =>
      normalizeSketchObject(frame, idx)
    );
  }

  const validated = sketchStoryboardSchema.parse(parsed);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ [SKETCH: GEN OUTPUT]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Generated ${validated.frames.length} sketch frames`);
  validated.frames.forEach((frame, idx) => {
    console.log(`Frame ${idx + 1}: ${frame.frameType} - "${frame.caption}" (${frame.actors.length} actors, ${frame.objects.length} objects)`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return validated.frames;
}

const normalizeSketchFrame = (frame: unknown): SketchFrameData => {
  if (!frame || typeof frame !== 'object') {
    throw new Error('Invalid frame data');
  }

  const obj = frame as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};

  // Required string fields
  normalized.frameType = obj.frameType || 'Context';
  normalized.settingLabel = obj.settingLabel ? String(obj.settingLabel).trim() : 'Scene';
  normalized.caption = obj.caption ? String(obj.caption).trim() : '[Scene]';

  // Normalize actors with defaults for missing fields
  if (Array.isArray(obj.actors)) {
    normalized.actors = obj.actors.map((actor: any, idx: number) => ({
      id: actor?.id || `actor-${idx + 1}`,
      name: actor?.name ? String(actor.name).trim() : `Actor ${idx + 1}`,
      posture: actor?.posture && ['standing', 'sitting', 'walking', 'waiting', 'reaching'].includes(actor.posture)
        ? actor.posture
        : 'standing',
      emotion: actor?.emotion && ['neutral', 'confused', 'frustrated', 'relieved'].includes(actor.emotion)
        ? actor.emotion
        : 'neutral',
      position: normalizeSketchPosition(actor?.position),
      description: actor?.description ? String(actor.description).trim() : `${actor?.name || `Actor ${idx + 1}`} in scene`,
      ...(actor?.mobility && typeof actor.mobility === 'string' ? { mobility: actor.mobility } : {})
    }));
  } else {
    normalized.actors = [];
  }

  // Normalize objects with defaults for missing fields
  if (Array.isArray(obj.objects)) {
    normalized.objects = obj.objects.map((object: any, idx: number) => {
      const type = object?.type && typeof object.type === 'string' ? object.type : 'generic';
      const validTypes = ['counter', 'table', 'chair', 'door', 'phone', 'screen', 'queue', 'clock', 'bag', 'stairs', 'ramp', 'sign', 'vehicle', 'generic'];
      return {
        id: object?.id || `object-${idx + 1}`,
        type: validTypes.includes(type) ? type : 'generic',
        position: normalizeSketchPosition(object?.position),
        description: object?.description ? String(object.description).trim() : `${type} in scene`,
        ...(object?.label && typeof object.label === 'string' ? { label: object.label } : {})
      };
    });
  } else {
    normalized.objects = [];
  }

  // Normalize barriers with defaults for missing fields
  if (Array.isArray(obj.barriers)) {
    normalized.barriers = obj.barriers
      .map((barrier: any, idx: number) => ({
        id: barrier?.id || `barrier-${idx + 1}`,
        type: barrier?.type ? String(barrier.type).trim() : 'obstacle',
        position: normalizeSketchPosition(barrier?.position),
        description: barrier?.description ? String(barrier.description).trim() : `${barrier?.type || 'obstacle'} blocking progress`
      }))
      .filter((b: any) => b && typeof b === 'object');
  }

  // Normalize arrows - keep only valid ones
  if (Array.isArray(obj.arrows)) {
    normalized.arrows = obj.arrows
      .filter((arrow: any) => arrow?.from && typeof arrow.from === 'string' && arrow?.to && typeof arrow.to === 'string')
      .map((arrow: any) => ({
        id: arrow.id || `arrow-${Math.random()}`,
        from: String(arrow.from),
        to: String(arrow.to),
        ...(arrow?.label && typeof arrow.label === 'string' ? { label: arrow.label } : {}),
        ...(arrow?.direction && ['left-to-right', 'right-to-left', 'top-to-bottom', 'bottom-to-top', 'diagonal'].includes(arrow.direction)
          ? { direction: arrow.direction }
          : {})
      }));
  }

  // Optional fields
  if (obj.thoughtBubble && typeof obj.thoughtBubble === 'string') {
    normalized.thoughtBubble = obj.thoughtBubble.trim();
  }

  return normalized as SketchFrameData;
};

export async function refineSketchFrameData(
  existingFrame: SketchFrameData,
  userFeedback: string,
  accumulatedContext?: Record<string, string>
): Promise<SketchFrameData> {
  const existingFrameJson = JSON.stringify(existingFrame, null, 2);
  const contextString = accumulatedContext ? JSON.stringify(accumulatedContext, null, 2) : '(none)';

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 [SKETCH: REFINE INPUT]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('User Feedback:', userFeedback);
  console.log('Existing Frame:', existingFrameJson);
  console.log('Context:', contextString);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const systemContent = `You are refining a LOW-FIDELITY UX STORYBOARD SKETCH based on user feedback.
Output ONLY pure JSON. No markdown, no extra text.

CRITICAL RULES:
- Apply student corrections strongly. If the student says to change something, change it.
- Preserve correct existing details unless the student changes them.
- Keep the frameType exactly as: "${existingFrame.frameType}"
- Keep settingLabel and overall narrative structure unless explicitly corrected.
- For Context frames, keep the settingLabel focused on the current decision location, not the later destination.
- If the existing frame points to the future destination instead of the decision scene, revise it toward the present setting even when the student did not name a specific place.
- Use ONLY the allowed schema values.
- Return a COMPLETE SketchFrameData object with ALL required fields.
- DO NOT omit required fields. EVERY field must have a value.
- DO NOT include detailed appearance, gender, race, clothing, or visual style.

READABILITY & SVG CONSTRAINTS:
- Caption MUST be under 90 characters
- Actor names should be SHORT: ideally one word (e.g., "Student", "Cashier", "Manager")
- Actor labels MUST be 12 characters or less
- Do NOT add background people/extras unless the student explicitly names them
- For Scene 1 (Context), prefer ONE main actor only
- For Context scenes, keep the setting grounded in where the student is deciding or starting, not the place they will reach later.
- Example: for "healthy food before lecture", prefer student center / cafeteria / food counter / hallway with food options, not a classroom-only scene.
- If multiple actors must be in the same frame, SPREAD them across positions:
  * Some at "left", some at "center", some at "right"
  * Move non-essential actors to "background" position
  * Never stack multiple actors at the exact same position
- Keep scene simple and uncluttered for SVG rendering

REQUIRED FIELDS (must be included and non-empty):
- frameType: MUST stay as "${existingFrame.frameType}"
- settingLabel: REQUIRED - brief location label (cannot be null/undefined)
- caption: REQUIRED - one-sentence description (cannot be null/undefined, max 90 chars)
- actors: REQUIRED array - EVERY actor must have ALL of:
  * id (string, existing or new)
  * name (string, SHORT - 1-2 words, 12 chars max, cannot be null/undefined)
  * posture (must be one of: standing, sitting, walking, waiting, reaching)
  * emotion (must be one of: neutral, confused, frustrated, relieved)
  * position (must be one of: left, center, right, background - SPREAD actors across positions)
  * description (string, CANNOT be null/undefined - e.g. "Student checking phone")
  * mobility (optional: wheelchair, cane, stroller, or unspecified)
- objects: REQUIRED array - EVERY object must have ALL of:
  * id (string, existing or new)
  * type (must be valid SketchObjectType: counter, table, chair, door, phone, screen, queue, clock, bag, stairs, ramp, sign, vehicle, generic)
  * position (must be one of: left, center, right, background)
  * description (string, CANNOT be null/undefined - e.g. "Checkout counter")
  * label (optional string, max 12 chars)
- barriers (optional array) - IF present, EVERY barrier must have ALL of:
  * id, type, position, description (all required)
- arrows (optional array) - IF present, keep only arrows with valid from/to strings
- thoughtBubble (optional string, under 50 chars)

DO NOT INCLUDE: userCorrections field

VALID VALUES (STRICT):
position MUST be exactly one of: "left", "center", "right", "background"
- NEVER use: "foreground", "front", "middle", "top", "bottom"

objectType MUST be one of: "counter", "table", "chair", "door", "phone", "screen", "queue", "clock", "bag", "stairs", "ramp", "sign", "vehicle", "generic"

emotion MUST be one of: "neutral", "confused", "frustrated", "relieved"

posture MUST be one of: "standing", "sitting", "walking", "waiting", "reaching"

BEFORE RETURNING VERIFY:
- Caption is under 90 characters
- Actor names are 1-2 words, under 12 chars each
- Every actor has description (not null, not empty)
- Every object has description (not null, not empty)
- All required fields are strings (not null/undefined)
- All actors/objects/barriers arrays exist
- All positions are valid (left/center/right/background)
- Multiple actors are spread across different positions, not stacked
- No "foreground" or invalid position values
- No unnecessary background people (only if user named them)`;

  const userContent = `You are refining a sketch frame based on user feedback.

EXISTING FRAME (frameType: "${existingFrame.frameType}"):
${existingFrameJson}

USER FEEDBACK:
${userFeedback}

${accumulatedContext ? `NARRATIVE CONTEXT:\n${contextString}` : ''}

HARD OVERRIDE RULES:
- If MAIN ACTOR EMOTION/STATE OVERRIDE is present, update the primary actor's emotion/state accordingly.
- Do not ignore the override.
- Preserve the actor role and name (for example, keep the student as a student).
- If the exact emotion is not one of the allowed enum values, map it to the closest available value:
  tired / rushed / overwhelmed / anxious / stressed -> frustrated
  unsure / lost / confused -> confused
  happy / relieved / satisfied -> relieved
  calm / neutral / okay -> neutral
- Also reflect the state visually where possible through posture, body language, or a status cue.

Apply the student's feedback to refine this frame. Keep all correct details, change what the student asks for.

IMPORTANT REMINDERS FOR READABILITY:
- Keep caption SHORT (max 90 chars, ideally 1 sentence)
- Use SHORT actor names (1-2 words, max 12 chars): "Student", "Cashier", not descriptive names
- Spread actors across positions: left/center/right/background (never all at "center")
- Only add background people if user explicitly named them
- For Context scenes, prefer just ONE main actor
- All labels must fit inside SVG (max 12 chars)

Keep frameType exactly as "${existingFrame.frameType}" unless explicitly corrected.
Return ONLY a JSON object matching the SketchFrameData schema (single frame, not an array).
Do NOT include userCorrections field.`;

  openai.apiKey = getOpenAiKey();
  const response = await timed('refineSketchFrameData (gpt-4o-mini)', () =>
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

  // Normalize before validation - fills missing required fields
  const normalized = normalizeSketchFrame(parsed);
  const validated = sketchFrameDataSchema.parse(normalized);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✨ [SKETCH: REFINE OUTPUT]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Refined frame: ${validated.frameType} - "${validated.caption}"`);
  console.log(`Actors: ${validated.actors.length}, Objects: ${validated.objects.length}, Barriers: ${validated.barriers?.length ?? 0}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return validated;
}

export async function generateImagePromptFromSketch(
  sketch: SketchFrameData,
  visualStylePreferences: VisualStylePreferences,
  caption: string,
  visualCharacterDescriptions: VisualCharacterDescription[] = []
): Promise<string> {
  const styleDescriptions: Record<string, string> = {
    simple_sketch: 'Simple line-based sketch style, minimalist',
    clean_ux_illustration: 'Modern, clean UX illustration style, professional',
    comic_panel: 'Sequential comic panel art style with borders',
    realistic_scene: 'Photorealistic or highly detailed rendering'
  };

  const detailDescriptions: Record<string, string> = {
    low: 'Simplified elements with minimal detail',
    medium: 'Balanced level of detail and clarity',
    high: 'Rich, intricate details throughout'
  };

  const peopleDescriptions: Record<string, string> = {
    generic_figures: 'Generic stick figures or simple silhouettes',
    more_human_detail: 'Expressive faces and humanoid bodies',
    match_context: 'Reflect the described demographic context'
  };

  const environmentDescriptions: Record<string, string> = {
    minimal: 'Sparse, clean backgrounds with minimal detail',
    moderate: 'Contextual environmental details present',
    detailed: 'Rich, detailed environmental storytelling'
  };

  const toneDescriptions: Record<string, string> = {
    neutral: 'Objective, neutral tone',
    warm: 'Friendly, inviting, warm feeling',
    serious: 'Professional, formal, serious tone',
    urgent: 'Energetic, immediate, urgent feeling'
  };

  // Build detailed prompt from sketch structure
  const sketchElements: string[] = [];

  if (visualCharacterDescriptions.length > 0) {
    const characterDesc = visualCharacterDescriptions
      .map((character) => `${character.Name}: ${character.BriefVisualDescription} (${character.Age}, ${character.Gender}, ${character.Ethnicity})`)
      .join('; ');
    sketchElements.push(`Character identity: ${characterDesc}`);
  }

  if (sketch.actors && sketch.actors.length > 0) {
    const actorDesc = sketch.actors
      .map(a => `${a.name || 'Person'} (${a.posture}, ${a.emotion} emotion, positioned ${a.position})`)
      .join('; ');
    sketchElements.push(`Characters: ${actorDesc}`);
  }

  if (sketch.objects && sketch.objects.length > 0) {
    const objectDesc = sketch.objects
      .map(o => `${o.type} at ${o.position}${o.description ? ` (${o.description})` : ''}`)
      .join('; ');
    sketchElements.push(`Objects/elements: ${objectDesc}`);
  }

  if (sketch.barriers && sketch.barriers.length > 0) {
    const barrierDesc = sketch.barriers
      .map(b => `${b.type} at ${b.position}: ${b.description}`)
      .join('; ');
    sketchElements.push(`Obstacles/barriers: ${barrierDesc}`);
  }

  if (sketch.thoughtBubble) {
    sketchElements.push(`Internal monologue/thought: "${sketch.thoughtBubble}"`);
  }

  if (sketch.userCorrections && sketch.userCorrections.length > 0) {
    sketchElements.push(`Locked user corrections: ${sketch.userCorrections.join('; ')}`);
  }

  const frameSpecificDirection = (() => {
    switch (sketch.frameType) {
      case 'Context':
        return 'This is the context frame. Make the setting the main visual anchor and keep the character inside or near that environment. Do not default to a couch, sofa, bedroom, cafe, or generic living-room vibe unless the locked sketch explicitly says so.';
      case 'Problem':
        return 'This is the problem frame. Emphasize blockage, uncertainty, or friction without changing the story.';
      case 'Action':
        return 'This is the action frame. Emphasize a concrete attempt, pathway, or workaround without inventing a new narrative.';
      case 'Resolution':
        return 'This is the resolution frame. Emphasize a close, satisfied outcome with clear success while preserving the locked story.';
      default:
        return 'Render the locked storyboard frame faithfully.';
    }
  })();

  const userContent = `Convert this low-fidelity sketch frame into a detailed image generation prompt.

Render this exact storyboard frame. Do not change the story.
The caption/narrative must remain: "${caption}".
Use the locked sketch structure as the source of truth.
Do not invent a new setting, activity, or emotional situation.

FRAME CAPTION: "${caption}"
FRAME TYPE: ${sketch.frameType}
SETTING: ${sketch.settingLabel}

${frameSpecificDirection}

The same character must remain visually consistent across the storyboard.
Preserve the character's face, hairstyle, clothing, and overall identity from the supplied character descriptions and reference image.

If the sketch includes user corrections or extra locked guidance, preserve them exactly and treat them as constraints.

SKETCH STRUCTURE:
${sketchElements.join('\n')}

VISUAL STYLE DIRECTION:
- Style: ${styleDescriptions[visualStylePreferences.visualStyle] || 'Clean illustration'}
- Detail Level: ${detailDescriptions[visualStylePreferences.detailLevel] || 'Medium'}
- People: ${peopleDescriptions[visualStylePreferences.peopleRepresentation] || 'Generic figures'}
- Environment: ${environmentDescriptions[visualStylePreferences.environmentDetail] || 'Moderate'}
- Tone: ${toneDescriptions[visualStylePreferences.tone] || 'Neutral'}
${visualStylePreferences.mustShow ? `\nMUST SHOW: ${visualStylePreferences.mustShow}` : ''}
${visualStylePreferences.mustAvoid ? `\nMUST AVOID: ${visualStylePreferences.mustAvoid}` : ''}

Create a vivid, specific image prompt that brings this sketch to life while respecting the visual style direction and user preferences. Focus on composition, lighting, mood, and key visual elements that tell the story.`;

  openai.apiKey = getOpenAiKey();
  const response = await timed(`generateImagePromptFromSketch ${sketch.frameType} (gpt-4o-mini)`, () =>
    openai.chat.completions
      .create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Output JSON with a single key "imagePrompt". Value must be a visually specific, drawable scene description optimized for image generation. No markdown, no extra keys.'
          },
          {
            role: 'user',
            content: userContent
          }
        ]
      })
      .then((c) => c.choices[0].message.content)
  );

  const parsed = JSON.parse(response || '{"imagePrompt":""}');
  return parsed.imagePrompt || '';
}

// ─── Designer storyboard mode ─────────────────────────────────────────────────

const designerCaptionSchema = z.object({ caption: z.string().min(1) });

export async function generateDesignerContentCaption(args: {
  frameType: 'Context' | 'Problem' | 'Action' | 'Resolution';
  currentCaption: string;
  contentAnswers: Record<string, string>;
}): Promise<string> {
  const userContent = `Rewrite the storyboard panel caption in the participant's first-person voice so it reflects their responses for this scene.

Frame type: ${args.frameType}
Current caption: """${args.currentCaption}"""

Participant's content answers (JSON):
"""
${JSON.stringify(args.contentAnswers, null, 2)}
"""

Requirements:
- 1 to 2 sentences, present-tense, under 220 characters.
- Write in first person (I / me / my), matching the participant's voice in their answers. Do not rewrite as third person (they / the student / the participant).
- Keep the same scene and viewpoint as the current caption; only update what the answers actually changed.
- Do not invent new characters, locations, or props that aren't supported by the answers.
- No markdown, no quotes, no leading label.`;

  const result = await generateStructured(designerCaptionSchema, userContent);
  return result.caption;
}

type DesignerFrameType = 'Context' | 'Problem' | 'Action' | 'Resolution';

const DESIGNER_SINGLE_FRAME_DIRECTIVE =
  'Render exactly one storyboard frame as a single illustrated panel (same format as the other panels in a 4-frame storyboard). No multi-panel layouts, comic grids, split screens, film strips, or collages.';

const DESIGNER_NO_TEXT_DIRECTIVE =
  'Do not render any text, words, letters, numbers, labels, captions, signs with readable writing, speech bubbles, or UI chrome inside the image.';

export function getDesignerFrameCompositionDirective(frameType: DesignerFrameType): string {
  switch (frameType) {
    case 'Context':
      return 'Composition: make the setting the main visual anchor and place the character inside or near that environment.';
    case 'Problem':
      return 'Composition: emphasize blockage, uncertainty, or friction without changing the story role of this frame.';
    case 'Action':
      return 'Composition: emphasize a concrete attempt, pathway, or workaround in progress without inventing a new narrative.';
    case 'Resolution':
      return 'Composition: emphasize a clear, satisfied outcome with visible success while preserving narrative continuity.';
    default:
      return 'Composition: render a clear storyboard panel appropriate for this frame type.';
  }
}

function buildDesignerContentCompositionTail(
  frameType: DesignerFrameType,
  mode: 'create' | 'edit'
): string {
  const frameDirective = getDesignerFrameCompositionDirective(frameType);
  if (mode === 'create') {
    return [
      DESIGNER_SINGLE_FRAME_DIRECTIVE,
      'Create a clear, readable storyboard illustration that reflects the participant\'s answers and fits the frame type.',
      frameDirective,
      'Focus on composition, lighting, mood, and key visual elements that tell the story for this frame type.'
    ].join(' ');
  }
  return [
    'Content edit: update the visible scene so it reflects the participant\'s answers, keeping the original composition and frame type.',
    frameDirective
  ].join(' ');
}

export function buildDesignerImageEditPrompt(args: {
  frameType: DesignerFrameType;
  stage: 'content' | 'aesthetic';
  currentCaption: string;
  contentAnswers: Record<string, string>;
  reflectionAnswers?: Record<string, string>;
  aestheticNotes?: { character?: string; action?: string; environment?: string; custom?: string };
  createFromScratch?: boolean;
  hasPriorPanelReference?: boolean;
  hasCharacterProfileReference?: boolean;
  referenceCaption?: string;
}): string {
  const blocks: string[] = [];

  if (args.createFromScratch) {
    blocks.push(`Generate a new storyboard panel (frame type: ${args.frameType}) from the participant's responses.`);
    if (args.hasPriorPanelReference) {
      blocks.push(
        'The attached reference image is from the previous storyboard panel. Use it ONLY to maintain character identity (face, hair, clothing), rendering style, and color palette. Do NOT reuse the prior panel\'s scene content, composition, camera angle, character pose or action, props, or setting details. The new panel must depict a distinct moment for this frame type from the participant\'s answers.'
      );
      if (args.referenceCaption?.trim()) {
        blocks.push(
          `Prior panel caption (narrative continuity only — not a visual template): "${args.referenceCaption.trim()}"`
        );
      }
    }
    if (args.hasCharacterProfileReference) {
      blocks.push(
        'The attached reference image is the participant\'s character portrait headshot. Use it as the sole visual anchor for the protagonist\'s face, hair, and clothing identity. Do NOT copy scene composition, pose, props, or setting from the portrait — it is a headshot only. Use the participant\'s content answers to determine the scene, setting, and what the character is doing; use the portrait only for who the character looks like. Render the new storyboard panel scene from the participant\'s answers while keeping the character recognizable.'
      );
    }
  } else {
    blocks.push(`Edit this storyboard panel (frame type: ${args.frameType}) to better match the participant's perspective.`);
    if (args.currentCaption.trim()) {
      blocks.push(`Current caption: "${args.currentCaption}"`);
    }
    if (args.hasCharacterProfileReference) {
      blocks.push(
        'The participant has a saved character portrait. Preserve the protagonist\'s face, hair, and clothing identity from that portrait while applying the requested edits.'
      );
    }
  }

  const trimmedContent = Object.fromEntries(
    Object.entries(args.contentAnswers).filter(([, v]) => (v ?? '').trim().length > 0)
  );
  if (Object.keys(trimmedContent).length > 0) {
    blocks.push(`Participant's content answers:\n${JSON.stringify(trimmedContent, null, 2)}`);
  }

  if (args.stage === 'aesthetic') {
    const trimmedReflection = Object.fromEntries(
      Object.entries(args.reflectionAnswers ?? {}).filter(([, v]) => (v ?? '').trim().length > 0)
    );
    if (Object.keys(trimmedReflection).length > 0) {
      blocks.push(`Participant's reflection on this scene:\n${JSON.stringify(trimmedReflection, null, 2)}`);
    }

    const notes = args.aestheticNotes ?? {};
    const noteLines = [
      notes.character ? `Character adjustment: ${notes.character}` : '',
      notes.action ? `Action adjustment: ${notes.action}` : '',
      notes.environment ? `Environment adjustment: ${notes.environment}` : '',
      notes.custom ? `Other directives: ${notes.custom}` : ''
    ].filter(Boolean);
    if (noteLines.length > 0) {
      blocks.push(`Aesthetic adjustments to apply:\n${noteLines.join('\n')}`);
    }

    if (notes.action?.trim()) {
      blocks.push('Aesthetic-only edit: adjust visual style, lighting, character, environment, and action/pose as described. DO NOT change the story or who/what is in the scene beyond the action adjustment.');
    } else {
      blocks.push('Aesthetic-only edit: adjust visual style, lighting, character, and environment as described. DO NOT change the story, action, or who/what is in the scene.');
    }
  } else if (args.createFromScratch) {
    blocks.push(DESIGNER_NO_TEXT_DIRECTIVE);
    blocks.push(buildDesignerContentCompositionTail(args.frameType, 'create'));
  } else {
    blocks.push(buildDesignerContentCompositionTail(args.frameType, 'edit'));
  }

  return blocks.join('\n\n');
}

export function buildCharacterProfileEditPrompt(adjustments: {
  face?: string;
  hairAccessories?: string;
  clothing?: string;
}): string {
  const blocks: string[] = [
    'Edit this character portrait headshot to better match the participant.',
    'Keep a clean portrait composition: head and shoulders, neutral or simple background, facing the camera.',
    'Do NOT change the framing to a full scene, action shot, or storyboard panel.'
  ];

  const noteLines = [
    adjustments.face?.trim() ? `Face adjustment: ${adjustments.face.trim()}` : '',
    adjustments.hairAccessories?.trim()
      ? `Hair / accessories adjustment: ${adjustments.hairAccessories.trim()}`
      : '',
    adjustments.clothing?.trim() ? `Clothing adjustment: ${adjustments.clothing.trim()}` : ''
  ].filter(Boolean);

  if (noteLines.length > 0) {
    blocks.push(`Apply only these adjustments:\n${noteLines.join('\n')}`);
  } else {
    blocks.push('Make subtle refinements while preserving the overall likeness from the reference image.');
  }

  blocks.push(
    'Preserve the participant\'s identity. Apply only the described changes to face, hair/accessories, and clothing.'
  );

  return blocks.join('\n\n');
}

export function buildComicHeadshotPrompt(): string {
  return [
    'Redraw this photo as an abstract comic book style character portrait headshot (style: Scott Pilgrim comic style).',
    'Clean portrait composition: head and shoulders only, facing directly forward toward the camera, simple neutral background.',
    'Impressionist comic book illustration style: clean linework with symbolic facial features reminiscient of American indie comics and Japanese manga, like Scott Pilgrim.',
    "Preserve the person's general likeness: skin tone, hairstyle and color, and any glasses or accessories visible in the photo. Do NOT include details such as realistic teeth or shading.",
    'Do NOT change the framing to a full-body shot, action scene, or storyboard panel.'
  ].join('\n\n');
}
