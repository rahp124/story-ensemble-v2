import { z } from 'zod';
import { generateStructured } from './generateStructured';

const storyboardTitlesSchema = z.object({
  titles: z.array(z.string())
});
const STORYBOARD_TITLE_PROMPT = `
Generate 4 different storyboard titles for a user design storyboard based on the provided context.
The title is a sentence summarize a story about the user situation, problem, solution, and resolution.

Examples:

Given Context: 'Bill is a gardener who has trouble reading small print. Create an app that helps him learn about plants using videos.'
Output: 'A seed catalog app that lets users watch videos instead of reading plant info.'

Given Context: 'Rob is a student who struggles with public speaking. Create a virtual reality game to help him overcome his fear.'
Output: 'A virtual reality game that helps users overcome their fear of public speaking.'
`;
export async function generateStoryboardTitles(context: string) {
  const contextPrompt = `
CONTEXT: """
${context}
"""
`;
  const messageContent = [STORYBOARD_TITLE_PROMPT, contextPrompt];

  const messages = messageContent.map(
    (content) =>
      ({
        role: 'user',
        content
      } as const)
  );
  const { titles } = await generateStructured(storyboardTitlesSchema, messages);
  return titles;
}
const frameOutlineSchema = z.object({
  description: z.string(),
  imagePrompt: z.string(),
  imageNegativePrompt: z.string(),
  caption: z.string()
});
export type FrameOutline = z.infer<typeof frameOutlineSchema>;
const storyboardOutlineSchema = z.object({
  outlines: z
    .array(
      z.object({
        outline: frameOutlineSchema.array().min(4)
      })
    )
    .min(4)
});
export type StoryboardOutlines = z.infer<typeof storyboardOutlineSchema>;
const STORYBOARD_OUTLINE_PROMPT = `
You are an experienced UX designer.

Generate 4 different storyboard outlines for a user design storyboard based on the provided context.
You must generate 4 different outlines, each with at least 4 frames.

The frame outline contains a brief description for each frame in the storyboard.
The description should tell a cohesive story about the user situation, problem, solution, and resolution.
Each frame description should describe the key story elements and actions in the frame.

Each frame outline contains an image prompt and imageNegativePrompt used to generate visuals for the storyboard frame.
The image prompt should be based on the frame description but focus on describing the visual elements.
The image prompt should firstly describe the subject using rich adjectives. Additionally it should describe the setting, lighting, and any other relevant visual details.
Wrap terms in (term:weight) to adjust the importance of the term in the image. The weight should be a number between 0 and 1.
Do not set the weight for random terms, only for essential terms required for the subject and action.
The image prompts within a single outline should be consistent in style and tone to ensure cohesive visual narrative.
Consider using specific details such as colors, textures, and other style modifiers.
Quality boosters such as beautiful, majestic, incredible can be used to boost the quality of the generated image.
Shot types such as wide shot, medium shot, close-up, etc. can be used to specify the framing of the image. Choose the shot type that best suits the frame description.
The imagePrompt shouldn't use ambiguous nouns such as names, but should instead visually describe the person.
The negative prompt should omit things that are difficult for AI to generate or are not relevant to the frame
such as text or specific details that are not essential to the visual representation. This can be left blank if not applicable.
Disfigured, deformed hands, blurry, grainy, bad eyes, and similar negative prompts can be used to avoid unwanted results.

Each frame outline also contains a caption that will be displayed directly below the visuals as part of the storyboard.
The caption should aim to clarify or add context to the visual image.
The caption should be shorter than the frame description since it will be displayed directly below the visual image.

Example:
Context: "Bill is a gardener who has trouble reading small print. Create an app that helps him learn about plants using videos."
Output: [
  {
    "description": "Man in a grocery store struggles to read the small print and the grocery store is too loud. Show a man looking frustrated while trying to read a seed packet.",
    "imagePrompt": "",
    "imageNegativePrompt": "blurry, deformed",
    "caption": "Bill has a hard time reading the small print in the loud store"
  },
  {
    "description": "The man leaves the grocery store frustrated without buying anything. Make sure to show the man looking disappointed and leaving empty-handed.",
    "imagePrompt": "",
    "imageNegativePrompt": "blurry, deformed",
    "caption": "Frustrated, he leaves without buying anything"
  },
  {
    "description": "At home, the man uses the app to learn about plants through videos. Show the man sitting comfortably on his couch watching a video on his phone.",
    "imagePrompt": "",
    "imageNegativePrompt": "blurry, deformed",
    "caption": "At home, he watches videos on the seed catalog shopping app"
  },
  {
    "description": "The man is happy that he can learn about plants in the comfort of his own home. The man should look content and engaged while watching the video.",
    "imagePrompt": "",
    "imageNegativePrompt": "blurry, deformed",
    "caption": "Bill happily watches more videos about plants he's curious about"
  }
]
`;
export async function generateStoryboardOutlines(context: string) {
  const contextPrompt = `
CONTEXT: """
${context}
"""`;
  const messageContent = [STORYBOARD_OUTLINE_PROMPT, contextPrompt];

  const messages = messageContent.map(
    (content) =>
      ({
        role: 'user',
        content
      } as const)
  );
  const { outlines } = await generateStructured(
    storyboardOutlineSchema,
    messages
  );
  return outlines;
}

// const storyboardFramesSchema = z.object({
//   frames: z
//     .object({
//       imagePrompt: z.string(),
//       imageNegativePrompt: z.string(),
//       caption: z.string()
//     })
//     .array()
// });
// const STORYBOARD_FRAME_PROMPT = `
// You are an experienced UX designer.

// Generate stable diffusion image prompts and captions for a user design storyboard based on the provided context.
// The image prompts should generate consistent and cohesive visuals for each frame in the storyboard.

// `;
// export async function generateStoryboardFrames() {}

// const storyboardCaptionsSchema = z.object({
//   captions: z.array(z.string())
// });

// export interface GenerateStoryboardCaptionsOptions {
//   numFrames: number;
//   context: string;
// }
// export async function generateStoryboardCaptions(
//   options: GenerateStoryboardCaptionsOptions
// ) {
//   const baseMessage = {
//     role: 'user',
//     content: `Generate captions for a design storyboard relevant to the following context.
// The storyboard should have frames dedicated to establishing the situation, problem, solution, and resolution.
// These frames will be displayed directly below the visuals as part of the storyboard.
// The storyboard has ${options.numFrames} frames.
// Do not prefix the captions with the frame number or any other identifier.
// Be specific, these captions will guide the visual representation of each frame and be forwarded to AI to generate the visuals.

// CONTEXT: """
// ${options.context}
// """`
//   } as const;

//   const { captions } = await generateStructured(storyboardCaptionsSchema, [
//     baseMessage
//   ]);
//   return captions;
// }

// const characterSchema = z
//   .object({
//     name: z.string().describe('Name of the character.'),
//     appearance: z
//       .object({
//         facialFeatures: z
//           .string()
//           .describe(
//             'Detailed description of facial features, including eye size, shape, spacing, nose shape, and mouth style.'
//           ),
//         hair: z
//           .string()
//           .describe('Hair details such as color, texture, length, and style.'),
//         height: z
//           .string()
//           .describe(
//             'Exact height, possibly with specific measurements in feet/inches or centimeters.'
//           ),
//         bodyType: z
//           .string()
//           .describe(
//             'Body type or build of the character, described in detail, e.g., broad shoulders, slim waist.'
//           ),
//         clothing: z
//           .string()
//           .describe(
//             'Extensive details on clothing, including fabric types, patterns, colors, and any significant adornments.'
//           ),
//         accessories: z
//           .string()
//           .describe(
//             'List of accessories, detailed enough to reproduce in art, such as jewelry, glasses, weapons, etc.'
//           )
//       })
//       .describe(
//         "Detailed descriptions of the character's physical appearance and attire."
//       ),
//     role: z
//       .string()
//       .describe(
//         'Role of the character in the storyboard, e.g., protagonist, antagonist.'
//       ),
//     emotionalState: z
//       .string()
//       .describe(
//         'Current emotional state of the character in the scene, described in a way that impacts their posture or expression.'
//       )
//   })
//   .describe('Details about a character in the storyboard.');

// const styleSchema = z
//   .object({
//     colorPalette: z
//       .array(z.string())
//       .describe(
//         'Specific colors to be used, with exact color codes if possible (e.g., #FF5733).'
//       ),
//     artisticStyle: z
//       .string()
//       .describe(
//         'Description of the artistic style to be used, e.g., realistic, cartoonish, abstract, with references to known styles or works when applicable.'
//       ),
//     textureDetails: z
//       .array(z.string())
//       .describe(
//         "Specific textures to be included, such as 'brushed metal', 'rough concrete', 'soft wool', with descriptions of where they are used."
//       ),
//     lineQuality: z
//       .string()
//       .describe(
//         'Details about the line work, including thickness, continuity, and style (e.g., smooth, jagged, sketchy).'
//       )
//   })
//   .describe('The visual style guidelines for the storyboard.');

// const settingsSchema = z
//   .object({
//     location: z
//       .string()
//       .describe(
//         'The primary setting of the scene, including detailed descriptions of the environment.'
//       ),
//     timeOfDay: z
//       .string()
//       .describe(
//         'Specific time of day for the scene, including lighting conditions.'
//       ),
//     keyProps: z
//       .array(z.string())
//       .describe(
//         'List of important props, each described in detail, including materials, colors, and historical era if applicable.'
//       ),
//     backgroundElements: z
//       .array(z.string())
//       .describe(
//         'Detailed descriptions of background elements that should be included, specifying architectural styles, natural landscapes, or specific objects.'
//       )
//   })
//   .describe('The settings and environmental details for the scene.');

// const narrativeSchema = z
//   .object({
//     overallMessage: z
//       .string()
//       .describe(
//         'The overall message or lesson the storyboard aims to convey, explained in a way that guides the artistic representation.'
//       ),
//     theme: z
//       .string()
//       .describe(
//         'Central theme of the storyboard, described to inspire the visual and emotional tone of the art.'
//       ),
//     emotions: z
//       .array(z.string())
//       .describe(
//         'List of key emotions that should be evoked or represented in the storyboard, with suggestions on how these should influence the visuals.'
//       )
//   })
//   .describe(
//     "Narrative elements that convey the storyboard's themes and emotions."
//   );

// const storyboardContinuitySpecificationSchema = z
//   .object({
//     style: styleSchema,
//     settings: settingsSchema,
//     characters: z.array(characterSchema),
//     narrative: narrativeSchema
//   })
//   .describe('Storyboard Continuity Specification');

// export async function generateStoryboardContinuitySpecification(
//   captions: string[]
// ) {
//   const baseMessage = {
//     role: 'user',
//     content: `Generate a storyboard continuity specification.
// This specification will be provided to a designer responsible for creating each frame independently.
// It's important that each designer can work on their frame without needing to see the other frames while maintaining continuity across all frames.

// It is important that the specification is very detailed and describe the visuals such as the style, character, and setting. Describe nuances such as facial features, clothing, and other visual elements that must be consistent across all frames.
// The specification should also describe the overall message, theme, and emotions that the storyboard should convey.
// Be specific, these captions will guide the visual representation of each frame and be forwarded to AI to generate the visuals.

// The storyboard has the following captions describing each frame.

// CAPTIONS: """
// ${JSON.stringify(captions, null, 2)}
// """`
//   } as const;

//   const continuitySpecification = await generateStructured(
//     storyboardContinuitySpecificationSchema,
//     [baseMessage]
//   );
//   return continuitySpecification;
// }

// export async function generateStoryboardFrame(
//   caption: string,
//   continuitySpecification: z.infer<
//     typeof storyboardContinuitySpecificationSchema
//   >
// ) {
//   const image = await openai.images.generate({
//     model: 'dall-e-3',
//     prompt: `Generate a design storyboard frame based on the following caption and continuity specification.

// You are responsible for creating only one frame of a storyboard. Strictly follow the continuity specification to ensure that your frame is consistent with the other frames.
// Do not include any text in the frame. The caption will be displayed directly below the frame as part of the storyboard.

// CAPTION: """${caption}"""

// CONTINUITY SPECIFICATION: """
// ${continuitySpecification}
// """`,
//     n: 1,
//     quality: 'standard',
//     response_format: 'url'
//   });
//   return image.data[0].url;
// }
