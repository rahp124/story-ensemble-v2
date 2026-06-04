import { generateStructured } from './openai';
import {
  frameImagePromptSchema,
  FrameOutline,
  storyboardOutlineSchema
} from '@/types';
import { z } from 'zod';

export function generateDynamicFramePrompt(
  frameIndex: number,
  answers: Record<string, string>
): string {
  switch (frameIndex) {
    case 0: {
      // Scene 1: Initial Context - Warm Up answers
      const location = answers['wu-1-campus-location'] || 'on campus';
      const priority = answers['wu-2-priority'] || 'their priorities';
      return `Scene 1 - Initial Context: A college student is at ${location}, thinking about lunch. Their main priority is ${priority}. Illustrate the moment they begin contemplating their food options. Show the student in this location, looking slightly uncertain or thoughtful. The mood should feel like the beginning of a decision journey. Include environmental details that reflect the campus location. Digital art, realistic lighting.`;
    }

    case 1: {
      // Scene 2: Friction / Problem - Scene 1 answers
      const hungerLevel = answers['s1-1-hunger-level'] || 'moderately';
      const firstOption = answers['s1-2-first-option'] || 'various options';
      const contextDetail = answers['s1-3-context-detail'] || '';
      return `Scene 2 - Facing Friction: The student is ${hungerLevel} hungry and initially thinks about ${firstOption}. ${contextDetail}. Now they face the decision stress of actually choosing. Illustrate the student looking at their options (phone, looking around, thinking deeply). Show signs of decision fatigue - perhaps standing in front of multiple food venues, or scrolling on a phone. The mood should convey mild frustration, overwhelm, or analysis paralysis. Digital art with natural lighting. Realistic human expressions.`;
    }

    case 2: {
      // Scene 3: Specific Choice - Branching based on Scene 2 answer
      const easiestOption = answers['s2-1-easiest-option'] || 'their chosen option';
      
      if (easiestOption === 'Delivery app') {
        const scrollTime = answers['s3d-1-scroll-time'] || 'scrolling';
        const orderDriver = answers['s3d-2-order-driver'] || 'an option';
        return `Scene 3 - Delivery App Path: The student chose the delivery app as their best option. They are ${scrollTime}, going through endless restaurant choices. They're motivated by ${orderDriver}. Illustrate the student sitting comfortably somewhere on campus (dorm, library, student center) with their phone in hand, eyes on screen, showing the glow of the app interface. Show their face - concentrated, slightly hopeful. The scene should feel like a private moment. Digital art, warm indoor lighting.`;
      } else if (easiestOption === 'Dining hall') {
        const diningExperience = answers['s3n-1-dining-experience'] || 'typical dining hall experience';
        const satisfaction = answers['s3n-2-dining-satisfaction'] || '3';
        const experienceList = diningExperience ? diningExperience.split('||').join(', ') : '';
        return `Scene 3 - Dining Hall Path: The student chose the dining hall. They encounter: ${experienceList}. Their satisfaction level is ${satisfaction}/5. Illustrate the student either in a long line at the dining hall, standing in front of food options, or walking through the dining space. The mood matches their satisfaction level - if low, show frustration or resignation; if high, show contentment. Show other students, food service workers, busy atmosphere. Digital art, fluorescent lighting.`;
      } else if (easiestOption === 'Cook at home') {
        const homeChoice = answers['s3h-1-home-choice'] || 'their food choice';
        const feeling = answers['s3h-2-home-feeling'] || '';
        return `Scene 3 - Home Path: The student chose to cook at home (${homeChoice}). ${feeling}. Illustrate the student in their dorm kitchen or shared kitchen space, actively ${homeChoice.toLowerCase()}. Show them engaged, relaxed, or contemplative depending on the feeling. Include kitchen details - appliances, ingredients, countertop. The mood should feel more personal and controlled than other options. Digital art, warm home lighting.`;
      } else {
        // Generic home/cafe option
        return `Scene 3 - Alternate Path: The student chose ${easiestOption}. Illustrate the student taking action on this choice - active, committed, moving forward with their decision. Show the environment and their body language reflecting comfort with this choice. Digital art, natural lighting.`;
      }
    }

    case 3: {
      // Scene 4: Resolution / Solution - Scene 3 answers
      const idealFix = answers['s4-1-ideal-fix'] || 'an ideal solution';
      const feature = answers['s4-2-must-have-feature'] || 'a helpful feature';
      const confidence = answers['s4-3-confidence'] || '3';
      return `Scene 4 - Ideal Solution: The student's perfect solution is: ${idealFix}. The must-have feature they need is: ${feature}. They are ${confidence}/5 confident this would improve their daily campus food decisions. Illustrate a hopeful, satisfying resolution where the student is successfully using this solution. Show them happy, relieved, satisfied - the moment after they've made a good choice. The scene should feel bright, optimistic, resolved. Include visual elements that suggest their ideal solution (app interface, convenient location, quick service, etc.). Digital art, uplifting lighting, vibrant colors.`;
    }

    default:
      return `Generate a vivid, detailed storyboard frame based on the student's journey through their decision-making process. Digital art, professional quality, realistic human expressions.`;
  }
}

export function generateNextFramePrompt(
  currentStep: number,
  answers: Record<string, string>,
  anchorImage?: string
): string {
  switch (currentStep) {
    case 1: {
      const hunger = answers['s1-1-hunger-level'] || 'moderately hungry';
      const firstOption = answers['s1-2-first-option'] || 'thinking about food options';
      const context = answers['s1-3-context-detail'] || '';
      return `Scene 1 - Context: The student is ${hunger}/5 hungry and first thinks about: ${firstOption}. ${context}. Generate an image showing the character in this initial decision moment. ${
        anchorImage
          ? 'CRITICAL: Maintain exact character consistency using the provided anchor image. Do not change their appearance, clothing, or hairstyle.'
          : ''
      }`;
    }

    case 2: {
      const easiestOption = answers['s2-1-easiest-option'] || 'various food options';
      const friction = answers['s2-2-biggest-friction'] || '';
      const stressNote = answers['s2-3-problem-note'] || '';
      const frictionList = friction ? friction.split('||').join(', ') : '';
      return `Scene 2 - Problem: The student considers ${easiestOption}. Friction points: ${frictionList}. ${stressNote}. Generate an image showing the character facing this decision stress. ${
        anchorImage
          ? 'CRITICAL: Maintain exact character consistency using the provided anchor image. Do not change their appearance, clothing, or hairstyle.'
          : ''
      }`;
    }

    case 3: {
      const easiestOption = answers['s2-1-easiest-option'] || 'their chosen option';
      
      // Branching logic based on Scene 2 choice
      if (easiestOption === 'Delivery app') {
        const scrollTime = answers['s3d-1-scroll-time'] || 'some time';
        const orderDriver = answers['s3d-2-order-driver'] || 'various factors';
        return `Scene 3 - Delivery Path: The student has decided to go with ${easiestOption}. They spend ${scrollTime} scrolling and are motivated by ${orderDriver}. Generate an image of them acting out this choice (scrolling on phone, comparing options). ${
          anchorImage
            ? 'CRITICAL: Maintain exact character consistency using the provided anchor image. Do not change their appearance, clothing, or hairstyle.'
            : ''
        }`;
      } else if (easiestOption === 'Dining hall') {
        const experience = answers['s3n-1-dining-experience'] || '';
        const satisfaction = answers['s3n-2-dining-satisfaction'] || '';
        const experienceList = experience ? experience.split('||').join(', ') : '';
        return `Scene 3 - Dining Hall Path: The student has decided to go with ${easiestOption}. Their experience: ${experienceList}. Satisfaction level: ${satisfaction}/5. Generate an image of them acting out this choice (at dining hall, choosing food). ${
          anchorImage
            ? 'CRITICAL: Maintain exact character consistency using the provided anchor image. Do not change their appearance, clothing, or hairstyle.'
            : ''
        }`;
      } else {
        const homeChoice = answers['s3h-1-home-choice'] || 'eat at home';
        const feeling = answers['s3h-2-home-feeling'] || '';
        return `Scene 3 - Home Path: The student has decided to go with ${easiestOption}. They choose to ${homeChoice}. ${feeling}. Generate an image of them acting out this choice (at home, preparing food or snacking). ${
          anchorImage
            ? 'CRITICAL: Maintain exact character consistency using the provided anchor image. Do not change their appearance, clothing, or hairstyle.'
            : ''
        }`;
      }
    }

    case 4: {
      const idealFix = answers['s4-1-ideal-fix'] || 'a better solution';
      const mustHaveFeature = answers['s4-2-must-have-feature'] || '';
      const confidence = answers['s4-3-confidence'] || '';
      return `Scene 4 - Solution: The student envisions an ideal solution: ${idealFix}. Key feature: ${mustHaveFeature}. Confidence: ${confidence}/5. Generate an image showing the character successfully using this solution, looking satisfied and relieved. ${
        anchorImage
          ? 'CRITICAL: Maintain exact character consistency using the provided anchor image. Do not change their appearance, clothing, or hairstyle.'
          : ''
      }`;
    }

    default:
      return `Generate a storyboard frame based on the student's journey. ${
        anchorImage
          ? 'CRITICAL: Maintain exact character consistency using the provided anchor image.'
          : ''
      }`;
  }
}

export function generateNextFrameCaption(
  currentStep: number,
  answers: Record<string, string>
): string {
  switch (currentStep) {
    case 1: {
      const location = answers['wu-1-campus-location'] || 'campus';
      const priority = answers['wu-2-priority'] || 'convenience';
      return `Starting the lunch decision at ${location}, focused on ${priority.toLowerCase()}.`;
    }
    case 2: {
      const firstOption = answers['s1-2-first-option'] || 'their first option';
      return `They begin with ${firstOption.toLowerCase()}, but decision friction starts to build.`;
    }
    case 3: {
      const path = answers['s2-1-easiest-option'] || 'their chosen path';
      return `They commit to ${path.toLowerCase()} and move forward with that choice.`;
    }
    case 4: {
      const idealFix = answers['s4-1-ideal-fix'] || 'a clearer, easier lunch flow';
      return `A better experience emerges: ${idealFix}.`;
    }
    default:
      return 'A new scene in the student’s decision journey.';
  }
}

export async function generateStoryboardOutline(context: unknown) {
  const prompt = `
You are an AI assistant tasked with creating a detailed storyboard outline for design thinking based on specific dimensions and their assigned values.
Use the given dimensions to generate a coherent storyboard outline to visualize a problem, solution, and the surrounding context.

The title is a sentence summarize a story about the student situation, problem, solution, and resolution.
Example title: 'A seed catalog app that lets users watch videos instead of reading plant info.'

Generate an outline with at least 4 frames.

The frame outline contains a brief description for each frame in the storyboard.
The description should tell a cohesive story about the student situation, problem, solution, and resolution.
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

export async function generateStoryboardImagePrompts(
  frames: FrameOutline[],
  visualCharacterDescriptions: unknown,
  userInterviewXml = ''
) {
  // Strip out any additional properties
  frames = frames.map((frame) => ({
    frameType: frame.frameType,
    description: frame.description,
    caption: frame.caption
  }));

  const prompt = `Given the outline for a storyboard with ${
    frames.length
  } frames, generate a list of image prompts for each frame.

CRITICAL INSTRUCTION: You will receive a <user_interview> XML block.
You MUST read it and base the full 4-frame storyboard strictly on the student's answers.
Do not invent conflicting motivations, settings, or behaviors.
If the interview includes specific constraints, they take priority over generic assumptions.

CRITICAL INSTRUCTION: You are generating a storyboard frame. You MUST use the same character as the reference image provided to you. 
The character must remain identical to the reference image in every frame. Do not change their hairstyle, face, or clothing.

To ensure consistency, here is the textual identity of the character in the reference image (THIS IS THEIR UNIFORM. DO NOT DEVIATE):
Visual Character Descriptions: """
${JSON.stringify(visualCharacterDescriptions)}
"""
  
Each frame outline contains an image prompt and imageNegativePrompt used to generate visuals for the storyboard frame.
The image prompt should firstly reinforce the Character Description above, and then describe the new scene, setting, lighting, and action.
Wrap terms in (term:weight) to adjust the importance of the term in the image. The weight should be a number between 0 and 1.
Do not set the weight for random terms, only for essential terms required for the subject and action.
The image prompts within a single outline should be consistent in style and tone to ensure cohesive visual narrative.
Consider using specific details such as colors, textures, and other style modifiers.
Quality boosters such as beautiful, majestic, incredible can be used to boost the quality of the generated image.
Shot types such as wide shot, medium shot, close-up, etc. can be used to specify the framing of the image. Choose the shot type that best suits the frame description.
The negative prompt should omit things that are difficult for AI to generate or are not relevant to the frame
such as text or specific details that are not essential to the visual representation. This can be left blank if not applicable.
Disfigured, deformed hands, blurry, grainy, bad eyes, and similar negative prompts can be used to avoid unwanted results.
Include the full name of people to ensure consistent characters across all frames.

User Interview XML: """
${userInterviewXml || '<user_interview></user_interview>'}
"""

Frames: """
${JSON.stringify(frames, null, 2)}
"""`;

  const schema = z.object({
    frameImagePrompts: frameImagePromptSchema.array().length(frames.length)
  });

  const { frameImagePrompts } = await generateStructured(schema, prompt);

  return frameImagePrompts;
}