import { generateStructured } from './openai';
import {
  frameImagePromptSchema,
  FrameOutline,
  storyboardOutlineSchema
} from '@/types';
import { z } from 'zod';

export async function generateStoryboardOutline(context: unknown) {
  const prompt = `
You are an AI assistant tasked with creating a detailed storyboard outline for design thinking based on specific dimensions and their assigned values.
Use the given dimensions to generate a coherent storyboard outline to visualize a problem, solution, and the surrounding context.

The title is a sentence summarize a story about the user situation, problem, solution, and resolution.
Example title: 'A seed catalog app that lets users watch videos instead of reading plant info.'

Generate an outline with at least 4 frames.

The frame outline contains a brief description for each frame in the storyboard.
The description should tell a cohesive story about the user situation, problem, solution, and resolution.
Each frame description should describe the key story elements and actions in the frame.

Each frame outline also contains a caption that will be displayed directly below the visuals as part of the storyboard.
The caption should aim to clarify or add context to the visual image.
The caption should be shorter than the frame description since it will be displayed directly below the visual image.

When the context requests regenerating storyboard based on updated personas, problems, and solutions:
- Revise the storyboard to address the personas, problems, and solutions.
- Remove any information that isn't directly related to the new personas, problems, and solutions.

Outline Example:
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
  
Context: """
${JSON.stringify(context)}
"""`;
  const storyboardOutline = await generateStructured(
    storyboardOutlineSchema,
    prompt
  );
  return storyboardOutline;
}

export async function generateStoryboardImagePrompts(frames: FrameOutline[]) {
  // Strip out any additional properties
  frames = frames.map((frame) => ({
    frameType: frame.frameType,
    description: frame.description,
    caption: frame.caption
  }));

  const prompt = `Given the outline for a storyboard with ${
    frames.length
  } frames, generate a list of image prompts for each frame.
  
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

Frames: """
${JSON.stringify(frames, null, 2)}
"""`;

  const schema = z.object({
    frameImagePrompts: frameImagePromptSchema.array().length(frames.length)
  });

  const { frameImagePrompts } = await generateStructured(schema, prompt);

  return frameImagePrompts;
}
