import { z } from 'zod';

export const newDimensionsSchema = z.object({
  newDimensions: z
    .object({
      name: z.string(),
      description: z.string(),
      values: z
        .array(z.string())
        .refine((items) => new Set(items).size === items.length)
    })
    .array()
});

export type Dimension = {
  id: string;
  name: string;
  description: string;
  values: string[];
  currentValues: string[];
};

export type NodeData = {
  outOfSync?: boolean;
  regenerating?: boolean;
  regeneratingImage?: boolean;
  dimensions: Dimension[];
  image?: string;

  // Feedback
  generatingFeedback?: boolean;
  feedbackOutOfSync?: boolean;
  feedback?: string[];
};

const frameOutlineSchema = z.object({
  frameType: z.union([
    z.literal('context'),
    z.literal('problem'),
    z.literal('solution'),
    z.literal('resolution')
  ]),
  description: z.string(),
  imagePrompt: z.string(),
  imageNegativePrompt: z.string(),
  caption: z.string()
});
export type FrameOutline = z.infer<typeof frameOutlineSchema>;

export const storyboardOutlineSchema = z.object({
  title: z.string(),
  outline: frameOutlineSchema.array().min(4)
});
export type StoryboardOutline = z.infer<typeof storyboardOutlineSchema>;

export type PersonaNodeData = NodeData & {
  persona: string;
};
export type ProblemNodeData = NodeData & {
  problem: string;
};
export type SolutionNodeData = NodeData & {
  solution: string;
};
export type StoryboardNodeData = NodeData & {
  storyboard: {
    title: string;
    outline: (FrameOutline & {
      image?: string;
    })[];
  };
};
