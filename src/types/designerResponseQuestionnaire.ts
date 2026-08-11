import type { FrameOutline } from '@/types';

export type DesignerResponseQuestion = {
  id: string;
  prompt: string;
  required: boolean;
  placeholder?: string;
};

export type DesignerResponseFrameType = FrameOutline['frameType'];

const EMOTION_PROMPT =
  "How do the storyboard character's emotions in THIS FRAME compare to your own during your experience?";

export const DESIGNER_FRAME_RESPONSE_QUESTIONS: Record<
  DesignerResponseFrameType,
  DesignerResponseQuestion[]
> = {
  Context: [
    {
      id: 'designer_response_context',
      prompt:
        "How do you relate to this scenario's Context frame in the storyboard? In what ways is this similar to and different from your experience?",
      required: true,
      placeholder: 'Describe your experience'
    },
    {
      id: 'designer_response_context_emotion',
      prompt: EMOTION_PROMPT,
      required: true,
      placeholder: 'A sentence about your emotions'
    }
  ],
  Problem: [
    {
      id: 'designer_response_problem',
      prompt: "How does this storyboard's Problem frame compare to your experience?",
      required: true,
      placeholder: '1-2 sentences'
    },
    {
      id: 'designer_response_problem_emotion',
      prompt: EMOTION_PROMPT,
      required: true,
      placeholder: 'A sentence about your emotions'
    }
  ],
  Action: [
    {
      id: 'designer_response_action',
      prompt: "How does this storyboard's Action frame compare to your experience?",
      required: true,
      placeholder: '1-2 sentences'
    },
    {
      id: 'designer_response_action_emotion',
      prompt: EMOTION_PROMPT,
      required: true,
      placeholder: 'A sentence about your emotions'
    }
  ],
  Resolution: [
    {
      id: 'designer_response_resolution',
      prompt: "How does this storyboard's Resolution frame compare to your experience?",
      required: true,
      placeholder: '1-2 sentences'
    },
    {
      id: 'designer_response_resolution_emotion',
      prompt: EMOTION_PROMPT,
      required: true,
      placeholder: 'A sentence about your emotions'
    }
  ]
};

export const DESIGNER_RESPONSE_FRAME_TYPES: DesignerResponseFrameType[] = [
  'Context',
  'Problem',
  'Action',
  'Resolution'
];

/** Frame highlight box as % of storyboard image width/height. */
export const DESIGNER_FRAME_BOUNDS_PERCENT: Record<
  FrameOutline['frameType'],
  { left: number; width: number; top: number; height: number }
> = {
  Context: { left: 8, width: 21, top: 10, height: 90 },
  Problem: { left: 29, width: 21, top: 10, height: 90 },
  Action: { left: 50, width: 21, top: 10, height: 90 },
  Resolution: { left: 70, width: 21, top: 10, height: 90 }
};

export function getDesignerFrameResponseQuestions(
  frameType: DesignerResponseFrameType
): DesignerResponseQuestion[] {
  return DESIGNER_FRAME_RESPONSE_QUESTIONS[frameType];
}
