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
    { id: 'ctx-before',        text: 'What was happening right before this moment?', phase: 'generation' },
    { id: 'ctx-trying',        text: 'What were you trying to accomplish in your last experience?', phase: 'generation' },
    { id: 'ctx-mindset',       text: 'What best describes your mindset at that moment?', phase: 'content' },
    { id: 'ctx-familiarity',   text: 'How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?', phase: 'content' }
  ],
  Problem: [
    { id: 'prob-difficult',    text: 'What made it more difficult for you to accomplish what you wanted? Where did this experience begin to feel inconvenient or problematic?', phase: 'generation' },
    { id: 'prob-first-try',    text: 'When things felt most difficult, what did you do or try to do first? Did you eventually push through an issue, step away, ask for help, or something else?', phase: 'generation' },
    { id: 'prob-frustrating',  text: 'What was most frustrating about this experience?', phase: 'content' },
    { id: 'prob-familiarity',  text: 'How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?', phase: 'content' }
  ],
  Action: [
    { id: 'act-solution',        text: 'Was there something that made this situation better for you? What was it, or what could it have been?', phase: 'generation' },
    { id: 'act-trust',         text: 'Who or what information would you trust most to help you with this? What makes you trust them?', phase: 'generation' },
    { id: 'act-familiarity',   text: 'How familiar does this visualized image feel to your experience? How well would this solution address your problem?', phase: 'content' },
    { id: 'act-change',        text: 'What else would you change in order for you to better accomplish what you want? What alternatives would you consider for addressing the problem?', phase: 'content' }
  ],
  Resolution: [
    { id: 'res-success',       text: 'What about this experience would let you know it had gone well?', phase: 'generation' },
    { id: 'res-avoid',         text: 'What do you need in order to avoid the problem in the future?', phase: 'generation' },
    { id: 'res-realism',       text: 'How realistic does this visualized image feel to your experience? What stands out as similar and different from your experience?', phase: 'content' },
    { id: 'res-change',        text: 'What else would you change in order for you to better accomplish what you want or better avoid the problem in the future?', phase: 'content' }
  ]
};

export const DESIGNER_REFLECTION_QUESTIONS: Omit<DesignerContentQuestion, 'phase'>[] = [
  { id: 'reflect-felt',    text: 'Write one word that best describes how you\'re feeling at this moment:' },
  { id: 'reflect-mind',    text: 'Write a sentence describing the main thing on your mind at this moment:' }
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
    .replace(/what was happening/gi, 'What would likely be happening');
}
