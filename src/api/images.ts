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

export async function generateStoryboardImage(opts: {
  prompt: string;
  negativePrompt?: string;
  stylePreset?: string;
  referenceImage?: string;
  size?: '1024x1024' | '512x512';
}): Promise<string> {
  const provider = resolveImageProvider();

  if (provider === 'fal') {
    try {
      if (opts.referenceImage) {
        return await editImageWithFluxKontext({
          prompt: opts.prompt,
          referenceImage: opts.referenceImage,
          negativePrompt: opts.negativePrompt,
          stylePreset: opts.stylePreset
        });
      }
      return await generateImageWithFlux({
        prompt: opts.prompt,
        negativePrompt: opts.negativePrompt,
        stylePreset: opts.stylePreset
      });
    } catch (err) {
      console.warn('[generateStoryboardImage] fal failed, falling back to OpenAI:', err);
      return await generateImageWithOpenAI(opts);
    }
  }

  if (provider === 'stability') {
    return await generateImage({
      prompt: opts.prompt,
      negativePrompt: opts.negativePrompt ?? '',
      stylePreset: opts.stylePreset as Parameters<typeof generateImage>[0]['stylePreset'],
      referenceImage: opts.referenceImage
    });
  }

  return await generateImageWithOpenAI(opts);
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
}): Promise<DesignerSceneImageResult> {
  const prompt = buildDesignerImageEditPrompt({
    frameType: args.frameType,
    stage: args.stage,
    currentCaption: args.currentCaption,
    contentAnswers: args.contentAnswers,
    reflectionAnswers: args.reflectionAnswers,
    aestheticNotes: args.aestheticNotes
  });

  const imagePromise = generateStoryboardImage({
    prompt,
    referenceImage: args.currentImage
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
