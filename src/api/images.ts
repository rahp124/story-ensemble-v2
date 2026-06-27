import { z } from 'zod';
import {
  generateImageWithOpenAI,
  generateStructured,
  generateDesignerContentCaption,
  buildDesignerImageEditPrompt
} from './openai';
import { generateImage } from './stableDiffusion';
import { editImageWithFluxKontext, generateImageWithFlux } from './fal';
import { resolveImageProvider } from '@/lib/envUtils';
import type { FrameOutline, DesignerAestheticNotes } from '@/types';

const NO_TEXT_IN_IMAGE =
  'Do not render any text, words, letters, numbers, labels, captions, signs with readable writing, speech bubbles, or UI chrome inside the image.';
const NO_TEXT_NEGATIVE =
  'text, words, letters, numbers, typography, captions, labels, speech bubbles, watermarks';

export async function generateStoryboardImage(opts: {
  prompt: string;
  negativePrompt?: string;
  stylePreset?: string;
  referenceImage?: string;
  size?: '1024x1024' | '512x512';
  applyNoText?: boolean;
}): Promise<string> {
  const shouldApplyNoText = !opts.referenceImage || opts.applyNoText === true;
  const prompt = shouldApplyNoText ? `${opts.prompt}\n\n${NO_TEXT_IN_IMAGE}` : opts.prompt;
  const negativePrompt = shouldApplyNoText
    ? [opts.negativePrompt, NO_TEXT_NEGATIVE].filter(Boolean).join(', ')
    : opts.negativePrompt;

  const provider = resolveImageProvider();

  if (provider === 'fal') {
    try {
      if (opts.referenceImage) {
        return await editImageWithFluxKontext({
          prompt,
          referenceImage: opts.referenceImage,
          negativePrompt,
          stylePreset: opts.stylePreset
        });
      }
      return await generateImageWithFlux({
        prompt,
        negativePrompt,
        stylePreset: opts.stylePreset
      });
    } catch (err) {
      console.warn('[generateStoryboardImage] fal failed, falling back to OpenAI:', err);
      return await generateImageWithOpenAI({ ...opts, prompt, negativePrompt });
    }
  }

  if (provider === 'stability') {
    return await generateImage({
      prompt,
      negativePrompt: negativePrompt ?? '',
      stylePreset: opts.stylePreset as Parameters<typeof generateImage>[0]['stylePreset'],
      referenceImage: opts.referenceImage
    });
  }

  return await generateImageWithOpenAI({ ...opts, prompt, negativePrompt });
}

export async function generateProblemIllustrativeImage(problem: unknown) {
  const prompt = `Generate an image which depicts a problem and helps to build empathy.
Generate a prompt for the which describes the scene that depicts the problem. Negative prompts describe what the scene should not include.

Problem: """
${JSON.stringify(problem)}
"""`;

  const imagePrompt = await generateStructured(imagePromptSchema, prompt);

  return await generateStoryboardImage(imagePrompt);
}

const imagePromptPrompt = `Using following idea generate an image prompt and image negative prompt to generate an illustrative image which represents the key elements of the idea.
Describe a scene which is a visual metaphor for the persona, problem, or solution described in the idea.
Prompts should be short and focus on the visual metaphor and does not overly describe the characters.
Describe the image in a literal visual elements of the image, not the message or meaning of the image.`;

export const imagePromptSchema = z.object({
  prompt: z.string(),
  negativePrompt: z.string()
});

export async function generateIllustrativeImage(idea: unknown) {
  const prompt = `${imagePromptPrompt}

Idea: """
${JSON.stringify(idea)}
"""`;

  const imagePrompt = await generateStructured(imagePromptSchema, prompt);

  return await generateStoryboardImage(imagePrompt);
}

async function toDataUrl(input: string): Promise<string> {
  if (!input) return input;
  if (input.startsWith('data:')) return input;
  const resp = await fetch(input);
  if (!resp.ok) throw new Error(`toDataUrl: failed to fetch ${input} (${resp.status})`);
  const blob = await resp.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export type DesignerSceneImageResult = {
  image: string;
  caption?: string;
};

export async function generateDesignerSceneImage(args: {
  currentImage: string;
  currentCaption: string;
  frameType: FrameOutline['frameType'];
  contentAnswers: Record<string, string>;
  reflectionAnswers?: Record<string, string>;
  aestheticNotes?: DesignerAestheticNotes;
  stage: 'content' | 'aesthetic';
  createFromScratch?: boolean;
  referenceImage?: string;
  referenceCaption?: string;
}): Promise<DesignerSceneImageResult> {
  const createFromScratch =
    args.createFromScratch ?? (!args.currentImage.trim() && args.stage === 'content');

  const hasPriorPanelReference = !!args.referenceImage?.trim();

  const prompt = buildDesignerImageEditPrompt({
    frameType: args.frameType,
    stage: args.stage,
    currentCaption: args.currentCaption,
    contentAnswers: args.contentAnswers,
    reflectionAnswers: args.reflectionAnswers,
    aestheticNotes: args.aestheticNotes,
    createFromScratch,
    hasPriorPanelReference,
    referenceCaption: args.referenceCaption
  });

  const refSource =
    !createFromScratch && args.currentImage.trim()
      ? args.currentImage
      : (args.referenceImage?.trim() ?? '');
  const refDataUrl = refSource ? await toDataUrl(refSource) : '';
  const modeLabel = createFromScratch
    ? hasPriorPanelReference
      ? 'create+anchor'
      : 'create'
    : 'edit';
  console.log(
    `[DesignerMode] preparing image ${modeLabel} (stage=${args.stage}, refIsDataUrl=${refDataUrl.startsWith('data:')})`
  );

  const imagePromise = generateStoryboardImage({
    prompt,
<<<<<<< HEAD
    applyNoText: createFromScratch,
=======
    applyNoText: createFromScratch || args.stage === 'content',
>>>>>>> f5be281 (generate own frame flow)
    ...(refDataUrl ? { referenceImage: refDataUrl } : {})
  });

  if (args.stage === 'content') {
    const [image, caption] = await Promise.all([
      imagePromise,
      generateDesignerContentCaption({
        frameType: args.frameType,
        currentCaption: args.currentCaption,
        contentAnswers: args.contentAnswers
      })
    ]);
    return { image, caption };
  }

  const image = await imagePromise;
  return { image };
}
