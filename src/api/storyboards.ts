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
Be specific, these captions will guide the visual representation of each frame and be forwarded to AI to generate the visuals.
    
CONTEXT: """
${options.context}
"""`
  } as const;

  const { captions } = await generateStructured(storyboardCaptionsSchema, [
    baseMessage
  ]);
  return captions;
}

const characterSchema = z
  .object({
    name: z.string().describe('Name of the character.'),
    appearance: z
      .object({
        facialFeatures: z
          .string()
          .describe(
            'Detailed description of facial features, including eye size, shape, spacing, nose shape, and mouth style.'
          ),
        hair: z
          .string()
          .describe('Hair details such as color, texture, length, and style.'),
        height: z
          .string()
          .describe(
            'Exact height, possibly with specific measurements in feet/inches or centimeters.'
          ),
        bodyType: z
          .string()
          .describe(
            'Body type or build of the character, described in detail, e.g., broad shoulders, slim waist.'
          ),
        clothing: z
          .string()
          .describe(
            'Extensive details on clothing, including fabric types, patterns, colors, and any significant adornments.'
          ),
        accessories: z
          .string()
          .describe(
            'List of accessories, detailed enough to reproduce in art, such as jewelry, glasses, weapons, etc.'
          )
      })
      .describe(
        "Detailed descriptions of the character's physical appearance and attire."
      ),
    role: z
      .string()
      .describe(
        'Role of the character in the storyboard, e.g., protagonist, antagonist.'
      ),
    emotionalState: z
      .string()
      .describe(
        'Current emotional state of the character in the scene, described in a way that impacts their posture or expression.'
      )
  })
  .describe('Details about a character in the storyboard.');

const styleSchema = z
  .object({
    colorPalette: z
      .array(z.string())
      .describe(
        'Specific colors to be used, with exact color codes if possible (e.g., #FF5733).'
      ),
    artisticStyle: z
      .string()
      .describe(
        'Description of the artistic style to be used, e.g., realistic, cartoonish, abstract, with references to known styles or works when applicable.'
      ),
    textureDetails: z
      .array(z.string())
      .describe(
        "Specific textures to be included, such as 'brushed metal', 'rough concrete', 'soft wool', with descriptions of where they are used."
      ),
    lineQuality: z
      .string()
      .describe(
        'Details about the line work, including thickness, continuity, and style (e.g., smooth, jagged, sketchy).'
      )
  })
  .describe('The visual style guidelines for the storyboard.');

const settingsSchema = z
  .object({
    location: z
      .string()
      .describe(
        'The primary setting of the scene, including detailed descriptions of the environment.'
      ),
    timeOfDay: z
      .string()
      .describe(
        'Specific time of day for the scene, including lighting conditions.'
      ),
    keyProps: z
      .array(z.string())
      .describe(
        'List of important props, each described in detail, including materials, colors, and historical era if applicable.'
      ),
    backgroundElements: z
      .array(z.string())
      .describe(
        'Detailed descriptions of background elements that should be included, specifying architectural styles, natural landscapes, or specific objects.'
      )
  })
  .describe('The settings and environmental details for the scene.');

const narrativeSchema = z
  .object({
    overallMessage: z
      .string()
      .describe(
        'The overall message or lesson the storyboard aims to convey, explained in a way that guides the artistic representation.'
      ),
    theme: z
      .string()
      .describe(
        'Central theme of the storyboard, described to inspire the visual and emotional tone of the art.'
      ),
    emotions: z
      .array(z.string())
      .describe(
        'List of key emotions that should be evoked or represented in the storyboard, with suggestions on how these should influence the visuals.'
      )
  })
  .describe(
    "Narrative elements that convey the storyboard's themes and emotions."
  );

const storyboardContinuitySpecificationSchema = z
  .object({
    style: styleSchema,
    settings: settingsSchema,
    characters: z.array(characterSchema),
    narrative: narrativeSchema
  })
  .describe('Storyboard Continuity Specification');

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
Be specific, these captions will guide the visual representation of each frame and be forwarded to AI to generate the visuals.

The storyboard has the following captions describing each frame.

CAPTIONS: """
${JSON.stringify(captions, null, 2)}
"""`
  } as const;

  const continuitySpecification = await generateStructured(
    storyboardContinuitySpecificationSchema,
    [baseMessage]
  );
  return continuitySpecification;
}

export async function generateStoryboardFrame(
  caption: string,
  continuitySpecification: z.infer<
    typeof storyboardContinuitySpecificationSchema
  >
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
