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
export type VisualCharacterDescription = z.infer<
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

// Sketch mode enums
export const sketchActorPostureSchema = z.enum([
  'standing',
  'sitting',
  'walking',
  'waiting',
  'reaching'
]);
export type SketchActorPosture = z.infer<typeof sketchActorPostureSchema>;

export const sketchActorEmotionSchema = z.enum([
  'neutral',
  'confused',
  'frustrated',
  'relieved'
]);
export type SketchActorEmotion = z.infer<typeof sketchActorEmotionSchema>;

export const sketchActorMobilitySchema = z.enum([
  'unspecified',
  'wheelchair',
  'cane',
  'stroller'
]);
export type SketchActorMobility = z.infer<typeof sketchActorMobilitySchema>;

export const sketchPositionSchema = z.enum([
  'left',
  'center',
  'right',
  'background'
]);
export type SketchPosition = z.infer<typeof sketchPositionSchema>;

export const sketchObjectTypeSchema = z.enum([
  'counter',
  'table',
  'chair',
  'door',
  'phone',
  'screen',
  'queue',
  'clock',
  'bag',
  'stairs',
  'ramp',
  'sign',
  'vehicle',
  'generic'
]);
export type SketchObjectType = z.infer<typeof sketchObjectTypeSchema>;

export const renderModeSchema = z.enum(['sketch', 'image']);
export type RenderMode = z.infer<typeof renderModeSchema>;

// Sketch components
export const sketchActorSchema = z.object({
  id: z.string(),
  name: z.string().describe('Character name or label'),
  posture: sketchActorPostureSchema,
  emotion: sketchActorEmotionSchema,
  mobility: sketchActorMobilitySchema.optional(),
  position: sketchPositionSchema,
  description: z.string().describe('Brief visual description for rendering hints')
});
export type SketchActor = z.infer<typeof sketchActorSchema>;

export const sketchObjectSchema = z.object({
  id: z.string(),
  type: sketchObjectTypeSchema,
  label: z.string().optional(),
  position: sketchPositionSchema,
  description: z.string().optional()
});
export type SketchObject = z.infer<typeof sketchObjectSchema>;

export const sketchBarrierSchema = z.object({
  id: z.string(),
  type: z.string().describe('Type of barrier (e.g., wall, crowd, process)'),
  position: sketchPositionSchema,
  description: z.string().describe('What blocks the actor')
});
export type SketchBarrier = z.infer<typeof sketchBarrierSchema>;

export const sketchArrowSchema = z.object({
  id: z.string(),
  from: z.string().describe('ID of source actor/object'),
  to: z.string().describe('ID of target actor/object'),
  label: z.string().optional().describe('Interaction label'),
  direction: z.enum(['left-to-right', 'right-to-left', 'top-to-bottom', 'bottom-to-top', 'diagonal']).optional()
});
export type SketchArrow = z.infer<typeof sketchArrowSchema>;

export const sketchFrameDataSchema = z.object({
  frameType: z.union([
    z.literal('Context'),
    z.literal('Problem'),
    z.literal('Action'),
    z.literal('Resolution')
  ]),
  settingLabel: z.string().describe('Where the scene takes place'),
  caption: z.string(),
  actors: sketchActorSchema.array(),
  objects: sketchObjectSchema.array(),
  barriers: sketchBarrierSchema.array().optional(),
  arrows: sketchArrowSchema.array().optional(),
  thoughtBubble: z.string().optional().describe('Actor thought or internal monologue'),
  userCorrections: z.string().array().optional().describe('Array of user-provided corrections to the scene')
});
export type SketchFrameData = z.infer<typeof sketchFrameDataSchema>;

export const visualStylePreferencesSchema = z.object({
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
export type StoryboardOutline = z.infer<typeof storyboardOutlineSchema>;

export type DesignerAestheticNotes = {
  character?: string;
  action?: string;
  environment?: string;
  custom?: string;
};

export type DesignerUpdateHistoryEntry = {
  stage: 'content' | 'aesthetics';
  ts: string;
  captionChanged?: boolean;
};

export type StoryboardFlowMode = 'standard' | 'designer_storyboard';

export type StoryboardNodeData = NodeData & {
  storyboard: {
    title: string;
    flowMode?: StoryboardFlowMode;
    outline: (FrameOutline & {
      id: string;
      image?: string;
      imageOutOfSync?: boolean;
      imagePrompt?: string;
      sketch?: SketchFrameData;
      renderMode?: RenderMode;
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
