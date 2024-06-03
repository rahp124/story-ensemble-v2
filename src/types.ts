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

export const personaSchema = z.object({
  Persona: z.object({
    Name: z.string(),
    Age: z.string(),
    Gender: z.string(),
    Occupation: z.string(),
    Education: z.string(),
    IncomeLevel: z.string(),
    Location: z.string(),
    FamilyStatus: z.string()
  }),
  Psychographics: z.object({
    PersonalityTraits: z.string(),
    Values: z.string(),
    Interests: z.string()
  }),
  Environment: z.object({
    Physical: z.string(),
    Social: z.string()
  }),
  BehavioralPatterns: z.object({
    DailyRoutines: z.string(),
    TechInteraction: z.string()
  }),
  NeedsAndChallenges: z.object({
    Needs: z.string(),
    Challenges: z.string()
  }),
  UsageContext: z.object({
    ProductUse: z.string(),
    UseInfluencers: z.string()
  }),
  TechnologyProficiency: z.object({
    ComfortLevel: z.string(),
    PreferredDevices: z.string()
  }),
  InformationConsumption: z.object({
    PreferredSources: z.string(),
    MediaConsumption: z.string()
  }),
  AdditionalMetadata: z.record(z.string(), z.string())
});
export type Persona = z.infer<typeof personaSchema>;

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
