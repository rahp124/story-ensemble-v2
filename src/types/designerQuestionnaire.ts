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
    // { id: 'ctx-setup',         text: '[Setup] What was happening right before your experience?', phase: 'generation' },
    { id: 'ctx-goal',          text: '[Goal] What did you want to accomplish in your experience?', phase: 'generation' },
    // { id: 'ctx-mindset',       text: 'What best describes your mindset before this moment?', phase: 'content' },
    // { id: 'ctx-familiarity',   text: 'How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?', phase: 'content' }
  ],
  Problem: [
    { id: 'prob-frustrating',  text: '[Pain Point] What made it difficult for you to accomplish what you wanted? What was most frustrating about this experience?', phase: 'generation' },
    // { id: 'prob-difficult',    text: '[Cause] What caused that problem?', phase: 'generation' },
    // { id: 'prob-familiarity',  text: 'How familiar does this visualized image feel to your experience? What stands out as similar and different from your experience?', phase: 'content' }
  ],
  Action: [
    { id: 'act-attempt',       text: '[Attempt] When the Problem felt most difficult, what did you try to do? Did you eventually push through an issue, step away, ask for help, or something else?', phase: 'generation' },
    // { id: 'act-solution',      text: '[Solution] Was there something that made this situation better for you?', phase: 'generation' },    
    // { id: 'act-trust',         text: 'Who or what information would you trust most to help you with this? What makes you trust them?', phase: 'generation' },
    // { id: 'act-realism',       text: 'How realistic does this visualized image feel to your experience?', phase: 'content' },
    // { id: 'act-alternatives',  text: 'How well would this solution address your problem? What alternatives would you consider for addressing the problem?', phase: 'content' }
  ],
  Resolution: [
    { id: 'res-after',         text: '[Result] What happened immediately after your Actions?', phase: 'generation' },
    // { id: 'res-avoid',         text: 'What do you need in order to avoid the problem in the future?', phase: 'generation' },
    // { id: 'res-signal',       text: '[Reflection] How did you know this was a good or bad experience?', phase: 'generation' },    
    // { id: 'res-realism',       text: 'What stands out in this image as realistic and unrealistic from your experience?', phase: 'content' },    
  ]
};

export const DESIGNER_REFLECTION_QUESTIONS: Omit<DesignerContentQuestion, 'phase'>[] = [
  // { id: 'reflect-felt',    text: 'Write ONE WORD that best describes how you\'re feeling, at this moment in your experience:' },
  { id: 'reflect-mind',    text: "Write ONE SENTENCE describing how you're feeling at this moment in your experience:" }
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

const REFLECTION_QUESTION_IDS = new Set(
  DESIGNER_REFLECTION_QUESTIONS.map((q) => q.id)
);

export function isDesignerReflectionQuestionId(id: string): boolean {
  return REFLECTION_QUESTION_IDS.has(id);
}

export function getDesignerPanelGenerateQuestions(
  frameType: DesignerQuestionFrameType
): DesignerContentQuestion[] {
  return [
    ...getDesignerGenerationQuestions(frameType),
    ...DESIGNER_REFLECTION_QUESTIONS.map((q) => ({ ...q, phase: 'generation' as const }))
  ];
}

export function splitDesignerPanelAnswers(answers: Record<string, string>): {
  contentAnswers: Record<string, string>;
  reflectionAnswers: Record<string, string>;
} {
  const contentAnswers: Record<string, string> = {};
  const reflectionAnswers: Record<string, string> = {};
  for (const [id, value] of Object.entries(answers)) {
    if (REFLECTION_QUESTION_IDS.has(id)) {
      reflectionAnswers[id] = value;
    } else {
      contentAnswers[id] = value;
    }
  }
  return { contentAnswers, reflectionAnswers };
}

export function rewordForImaginedExperience(text: string): string {
  return text
    .replace(/your last experience/gi, 'this situation')
    .replace(/hat did you/gi, 'hat would you')
    .replace(/hat was/gi, 'hat would be')
    .replace(/hat made it/gi, 'hat would make it')
    .replace(/ow did know/gi, 'ow would you know')
    .replace(/something that made this/gi, 'something that would make this');    
}
