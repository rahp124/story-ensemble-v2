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
        "How do you relate to what this character is doing in this storyboard's Context, and how do you relate to the goals they want to accomplish?",
      required: true,
      placeholder: '1-2 sentences'
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
      prompt: "How do you relate to the specific difficulties depicted in this situation?",
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
      prompt: "How do you relate to what the character tried to do in response to their Problem in this storyboard?",
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
      prompt: "How do you relate to what happened immediately after the Action in this storyboard?",
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
