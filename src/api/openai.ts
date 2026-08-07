import { getOpenAiKey } from '@/lib/envUtils';
import { apiUrl } from '@/lib/apiBase';
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

const imagePromptOnlySchema = z.object({ imagePrompt: z.string().min(1) });
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
    currentEnvAdjust ? `background adjustment: ${currentEnvAdjust}` : '',
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

// ─── Designer storyboard mode ─────────────────────────────────────────────────

const designerCaptionSchema = z.object({ caption: z.string().min(1) });
const designerTitleSchema = z.object({ title: z.string().min(1) });

type DesignerFrameType = 'Context' | 'Problem' | 'Action' | 'Resolution';

export async function generateDesignerStoryboardTitle(
  frames: {
    frameType: DesignerFrameType;
    caption: string;
    contentAnswers?: Record<string, string>;
    reflectionAnswers?: Record<string, string>;
  }[]
): Promise<string> {
  const storySummary = frames
    .map((frame, i) => {
      const contentAnswers = Object.fromEntries(
        Object.entries(frame.contentAnswers ?? {}).filter(([, v]) => (v ?? '').trim().length > 0)
      );
      const reflectionAnswers = Object.fromEntries(
        Object.entries(frame.reflectionAnswers ?? {}).filter(([, v]) => (v ?? '').trim().length > 0)
      );
      return [
        `Panel ${i + 1} (${frame.frameType}):`,
        `  Caption: ${frame.caption || '(none)'}`,
        Object.keys(contentAnswers).length > 0
          ? `  Content answers: ${JSON.stringify(contentAnswers, null, 2)}`
          : '',
        Object.keys(reflectionAnswers).length > 0
          ? `  Reflection answers: ${JSON.stringify(reflectionAnswers, null, 2)}`
          : ''
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');

  const userContent = `Summarize this 4-panel UX storyboard into a concise title.

Participant story (captions and answers in order):
"""
${storySummary}
"""

Requirements:
- 3 to 8 words, Title Case.
- Capture the persona's journey from problem to resolution.
- Ground the title only in the supplied captions and answers; do not invent details.
- No quotes, no trailing punctuation, no markdown, no leading label.
- Return JSON: { "title": "..." }`;

  const result = await generateStructured(designerTitleSchema, userContent);
  return result.title;
}

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

const DESIGNER_SINGLE_FRAME_DIRECTIVE =
  'Render exactly one storyboard frame as a single illustrated panel (same format as the other panels in a 4-frame storyboard). No multi-panel layouts, comic grids, split screens, film strips, or collages.';

const DESIGNER_NO_TEXT_DIRECTIVE =
  'Do not render any text, words, letters, numbers, labels, captions, signs with readable writing, speech bubbles, or UI chrome inside the image.';

function getDesignerFrameCompositionDirective(frameType: DesignerFrameType): string {
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
      notes.environment ? `Background adjustment: ${notes.environment}` : '',
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
