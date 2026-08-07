import { z } from 'zod';
import { StylePreset } from './api/stableDiffusion';

export type NodeData = {
  outOfSync?: boolean;
  dependentsOutOfSync?: boolean;

  content: Record<string, string>;

  image?: string;
  visualCharacterDescriptions: VisualCharacterDescription[];
};

export const visualCharacterDescriptionSchema = z.object({
  Name: z.string(),
  Gender: z.string(),
  Ethnicity: z.string(),
  Age: z.string(),
  BriefVisualDescription: z.string()
});
type VisualCharacterDescription = z.infer<
  typeof visualCharacterDescriptionSchema
>;

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
  Name: z.string().describe('Short name for the problem'),
  Context: z.string(),
  Stakeholders: z.string(),
  Objectives: z.string(),
  Constraints: z.string(),
  Impact: z.string(),
  Description: z.string()
});
export type Problem = z.infer<typeof problemSchema>;

export const solutionSchema = z.object({
  Name: z.string().describe('Short name for the solution'),
  ProblemsAddressed: z.string(),
  KeyFeatures: z.string(),
  Benefits: z.string(),
  PotentialChallenges: z.string(),
  Description: z.string()
});
export type Solution = z.infer<typeof solutionSchema>;

const frameOutlineSchema = z.object({
  frameType: z.union([
    z.literal('Context'),
    z.literal('Problem'),
    z.literal('Action'),
    z.literal('Resolution')
  ]),
  description: z.string(),
  caption: z.string()
});
export type FrameOutline = z.infer<typeof frameOutlineSchema>;

export const frameImagePromptSchema = z.object({
  prompt: z.string(),
  negativePrompt: z.string()
});

const visualStylePreferencesSchema = z.object({
  visualStyle: z.enum(['simple_sketch', 'clean_ux_illustration', 'comic_panel', 'realistic_scene']),
  detailLevel: z.enum(['low', 'medium', 'high']),
  peopleRepresentation: z.enum(['generic_figures', 'more_human_detail', 'match_context']),
  environmentDetail: z.enum(['minimal', 'moderate', 'detailed']),
  tone: z.enum(['neutral', 'warm', 'serious', 'urgent']),
  mustShow: z.string().optional(),
  mustAvoid: z.string().optional()
});
export type VisualStylePreferences = z.infer<typeof visualStylePreferencesSchema>;

export const storyboardOutlineSchema = z.object({
  title: z.string(),
  outline: frameOutlineSchema.array().min(4)
});
export type DesignerAestheticNotes = {
  character?: string;
  action?: string;
  environment?: string;
  custom?: string;
};

type DesignerUpdateHistoryEntry = {
  stage: 'content' | 'aesthetics';
  ts: string;
  captionChanged?: boolean;
};

type StoryboardFlowMode = 'standard' | 'designer_storyboard';

export type StoryboardNodeData = NodeData & {
  storyboard: {
    title: string;
    flowMode?: StoryboardFlowMode;
    outline: (FrameOutline & {
      id: string;
      image?: string;
      imageOutOfSync?: boolean;
      imagePrompt?: string;
      auditLog?: {
        timestamp: string;
        stepIndex: number;
        userInputs: Record<string, string>;
        aiImagePrompt: string;
        aiCaption: string;
        anchorImageUsed: boolean;
      };
      baseImage?: string;
      baseCaption?: string;
      contentAnswers?: Record<string, string>;
      reflectionAnswers?: Record<string, string>;
      aestheticNotes?: DesignerAestheticNotes;
      updateHistory?: DesignerUpdateHistoryEntry[];
    })[];
    artStyle: StylePreset;
    storyLocked?: boolean;
    visualStylePreferences?: VisualStylePreferences;
  };
};
