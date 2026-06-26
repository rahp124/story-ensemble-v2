import type { FrameOutline } from '@/types';

export type DesignerContentQuestion = {
  id: string;
  text: string;
};

export type DesignerQuestionFrameType = FrameOutline['frameType'];

export const DESIGNER_CONTENT_QUESTIONS: Record<DesignerQuestionFrameType, DesignerContentQuestion[]> = {
  Context: [
    { id: 'ctx-mindset',       text: 'What best describes your mindset at that moment?' },
    { id: 'ctx-before',        text: 'What was happening right before this moment?' },
    { id: 'ctx-trying',        text: 'What were you trying to accomplish in your last experience?' },
    { id: 'ctx-familiarity',   text: 'How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?' }
  ],
  Problem: [
    { id: 'prob-difficult',    text: 'What made it more difficult for you to accomplish what you wanted?Where did this experience begin to feel inconvenient or problematic?' },
    { id: 'prob-first-try',    text: 'When things felt most difficult, what did you do or try to do first? Did you eventually push through an issue, step away, ask for help, or something else?' },
    { id: 'prob-frustrating',  text: 'What was most frustrating about this experience?' },
    { id: 'prob-mindset',      text: 'What best describes your mindset at that moment?' },
    { id: 'prob-familiarity',  text: 'How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?' }
  ],
  Action: [
    { id: 'act-better',        text: 'Was there something that made this situation better for you? What was it, or what could it have been?' },
    { id: 'act-familiarity',   text: 'How familiar does this visualized image feel to your experience? How well would this solution address your problem?' },
    { id: 'act-alternatives',  text: 'What alternatives would you consider for addressing the problem?' },
    { id: 'act-trust',         text: 'Who or what information would you trust most to help you with this? What makes you trust them?' },
    { id: 'act-change',        text: 'What else would you change in order for you to better accomplish what you want?' }
  ],
  Resolution: [
    { id: 'res-realism',       text: 'How realistic does this visualized image feel to your experience? What stands out as similar and different from your experience?' },
    { id: 'res-knowing',       text: 'What about this experience would let you know it had gone well? How would you feel at that point?' },
    { id: 'res-change',        text: 'What else would you change in order for you to better accomplish what you want?' },
    { id: 'res-avoid',         text: 'What do you need in order to avoid the problem in the future?' }
  ]
};

export const DESIGNER_REFLECTION_QUESTIONS: DesignerContentQuestion[] = [
  { id: 'reflect-felt',    text: 'Briefly describe what this moment felt like for you.' },
  { id: 'reflect-mind',    text: 'What was the main thing on your mind at this moment? Write a sentence describing your specific thought or feeling at this moment.' }
];

export function rewordForImaginedExperience(text: string): string {
  return text
    .replace(/your last experience/gi, 'this situation')
    .replace(/what were you trying/gi, 'what would you be trying')
    .replace(/what was happening/gi, 'what would likely be happening');
}
