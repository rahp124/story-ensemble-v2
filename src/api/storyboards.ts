import { z } from 'zod';
import { generateStructured } from './generateStructured';
import { openai } from './openai';

const storyboardCaptionsSchema = z.object({
  captions: z.array(z.string())
});

export interface GenerateStoryboardCaptionsOptions {
  numFrames: number;
  context: string;
}
export async function generateStoryboardCaptions(
  options: GenerateStoryboardCaptionsOptions
) {
  const baseMessage = {
    role: 'user',
    content: `Generate captions for a design storyboard relevant to the following context.
The storyboard should have frames dedicated to establishing the situation, problem, solution, and resolution.
These frames will be displayed directly below the visuals as part of the storyboard.
The storyboard has ${options.numFrames} frames.
Do not prefix the captions with the frame number or any other identifier.
    
CONTEXT: """
${options.context}
"""`
  } as const;

  const { captions } = await generateStructured(storyboardCaptionsSchema, [
    baseMessage
  ]);
  return captions;
}

const storyboardContinuitySpecificationSchema = z.object({
  continuitySpecification: z.string()
});
export async function generateStoryboardContinuitySpecification(
  captions: string[]
) {
  const baseMessage = {
    role: 'user',
    content: `Generate a storyboard continuity specification.
This specification will be provided to a designer responsible for creating each frame independently.
It's important that each designer can work on their frame without needing to see the other frames while maintaining continuity across all frames.

It is important that the specification is very detailed and describe the visuals such as the style, character, and setting. Describe nuances such as facial features, clothing, and other visual elements that must be consistent across all frames.
The specification should also describe the overall message, theme, and emotions that the storyboard should convey.

The storyboard has the following captions describing each frame.

CAPTIONS: """
${JSON.stringify(captions, null, 2)}
"""`
  } as const;

  const { continuitySpecification } = await generateStructured(
    storyboardContinuitySpecificationSchema,
    [baseMessage]
  );
  return continuitySpecification;
}

export async function generateStoryboardFrame(
  caption: string,
  continuitySpecification: string
) {
  const image = await openai.images.generate({
    model: 'dall-e-3',
    prompt: `Generate a design storyboard frame based on the following caption and continuity specification.

You are responsible for creating only one frame of a storyboard. Strictly follow the continuity specification to ensure that your frame is consistent with the other frames.
Do not include any text in the frame. The caption will be displayed directly below the frame as part of the storyboard.

CAPTION: """${caption}"""

CONTINUITY SPECIFICATION: """
${continuitySpecification}
"""`,
    n: 1,
    quality: 'standard',
    response_format: 'url'
  });
  return image.data[0].url;
}
