import { z } from 'zod';
import { FrameOutline } from './api/storyboards';

export const newDimensionsSchema = z.object({
  newDimensions: z
    .object({
      name: z.string(),
      description: z.string(),
      values: z.array(z.string())
    })
    .array()
});

export type Dimension = {
  name: string;
  description: string;
  values: string[];
  currentValues: string[];
};

export type NodeData = {
  outOfSync?: boolean;
  regenerating?: boolean;
  dimensions: Dimension[];
};

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
  variations: {
    title: string;
    outlines: {
      outline: (FrameOutline & { image?: string })[];
    }[];
  }[];
};
