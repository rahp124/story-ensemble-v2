import { z } from 'zod';

export type NodeData = {
  outOfSync?: boolean;

  content: Record<string, string>;

  image?: string;
  imageOutOfSync?: boolean;

  feedbackOutOfSync?: boolean;
  feedback?: string[];
};

export const personaSchema = z.object({
  Name: z.string(),
  Location: z.string(),
  Bio: z.string(),
  Needs: z.string(),
  Challenges: z.string(),
  Description: z.string()
});
export type Persona = z.infer<typeof personaSchema>;

export const problemSchema = z.object({
  Name: z.string(),
  Context: z.string(),
  Stakeholders: z.string(),
  Objectives: z.string(),
  Constraints: z.string(),
  Impact: z.string(),
  Description: z.string()
});
export type Problem = z.infer<typeof problemSchema>;

export const solutionSchema = z.object({
  Name: z.string(),
  ProblemsAddressed: z.string(),
  KeyFeatures: z.string(),
  Benefits: z.string(),
  PotentialChallenges: z.string(),
  Description: z.string()
});
export type Solution = z.infer<typeof solutionSchema>;

const frameOutlineSchema = z.object({
  frameType: z.union([
    z.literal('context'),
    z.literal('problem'),
    z.literal('solution'),
    z.literal('resolution')
  ]),
  description: z.string(),
  caption: z.string()
});
export type FrameOutline = z.infer<typeof frameOutlineSchema>;

export const frameImagePromptSchema = z.object({
  prompt: z.string(),
  negativePrompt: z.string()
});

export const storyboardOutlineSchema = z.object({
  title: z.string(),
  outline: frameOutlineSchema.array().min(4)
});
export type StoryboardOutline = z.infer<typeof storyboardOutlineSchema>;

export type StoryboardNodeData = NodeData & {
  storyboard: {
    title: string;
    outline: (FrameOutline & {
      image?: string;
      imageOutOfSync?: boolean;
    })[];

    numberOfFrames: number;
    artStyle: string;
  };
};
