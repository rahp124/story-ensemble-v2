import type { FrameOutline } from '@/types';

export type DesignerQuestionPhase = 'generation' | 'content';

export type DesignerContentQuestion = {
  id: string;
  text: string;
  phase: DesignerQuestionPhase;
};

export type DesignerQuestionFrameType = FrameOutline['frameType'];

export const DESIGNER_CONTENT_QUESTIONS: Record<DesignerQuestionFrameType, DesignerContentQuestion[]> = {
  Context: [
    { id: 'ctx-before',        text: 'What was happening right before your last experience? What best describes your mindset before your last experience?', phase: 'generation' },
    { id: 'ctx-accomplish',    text: 'What were you wanting to accomplish in your last experience?', phase: 'generation' },
    // { id: 'ctx-mindset',       text: 'What best describes your mindset before this moment?', phase: 'content' },
    // { id: 'ctx-familiarity',   text: 'How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?', phase: 'content' }
  ],
  Problem: [
    { id: 'prob-frustrating',  text: 'What was most frustrating about this experience?', phase: 'generation' },
    { id: 'prob-difficult',    text: 'What made it more difficult for you to accomplish what you wanted? When did this experience begin to feel inconvenient or problematic?', phase: 'generation' },
    // { id: 'prob-familiarity',  text: 'How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?', phase: 'content' }
  ],
  Action: [
    { id: 'act-first-try',     text: 'When things felt most difficult, what did you do or try to do first? Did you eventually push through an issue, step away, ask for help, or something else?', phase: 'generation' },
    { id: 'act-solution',      text: 'Was there something that made this situation better for you?', phase: 'generation' },    
    // { id: 'act-trust',         text: 'Who or what information would you trust most to help you with this? What makes you trust them?', phase: 'generation' },
    // { id: 'act-realism',       text: 'How realistic does this visualized image feel to your experience?', phase: 'content' },
    // { id: 'act-alternatives',  text: 'How well would this solution address your problem? What alternatives would you consider for addressing the problem?', phase: 'content' }
  ],
  Resolution: [
    { id: 'res-after',         text: 'What did you do immediately after this experience?', phase: 'generation' },
    // { id: 'res-avoid',         text: 'What do you need in order to avoid the problem in the future?', phase: 'generation' },
    { id: 'res-success',       text: 'What about this experience would let you know it could have gone better?', phase: 'generation' },    
    // { id: 'res-realism',       text: 'What stands out in this image as realistic and unrealistic from your experience?', phase: 'content' },    
  ]
};

export const DESIGNER_REFLECTION_QUESTIONS: Omit<DesignerContentQuestion, 'phase'>[] = [
  { id: 'reflect-felt',    text: 'Write one word that best describes how you\'re feeling at this moment in your last experience:' },
  { id: 'reflect-mind',    text: 'Write a sentence describing the main thing on your mind at this moment in your last experience:' }
];

export function getDesignerAllContentQuestions(
  frameType: DesignerQuestionFrameType
): DesignerContentQuestion[] {
  return DESIGNER_CONTENT_QUESTIONS[frameType];
}

export function getDesignerGenerationQuestions(
  frameType: DesignerQuestionFrameType
): DesignerContentQuestion[] {
  return DESIGNER_CONTENT_QUESTIONS[frameType].filter((q) => q.phase === 'generation');
}

export function getDesignerContentOnlyQuestions(
  frameType: DesignerQuestionFrameType
): DesignerContentQuestion[] {
  return DESIGNER_CONTENT_QUESTIONS[frameType].filter((q) => q.phase === 'content');
}

export function rewordForImaginedExperience(text: string): string {
  return text
    .replace(/your last experience/gi, 'this situation')
    .replace(/what were you trying/gi, 'What would you be trying')
    .replace(/what was/gi, 'What would be')
    .replace(/what made it/gi, 'What would make it')
    .replace(/when did this experience/gi, 'When would this situation')
    .replace(/hat did you do/gi, 'hat would you do')
    .replace(/something that made this/gi, 'something that would make this');

    
}
