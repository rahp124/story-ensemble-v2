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

  dimensions: Dimension[];

  content: string;

  image?: string;
  imageOutOfSync?: boolean;

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
