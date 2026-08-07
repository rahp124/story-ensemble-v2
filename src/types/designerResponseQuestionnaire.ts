import type { FrameOutline } from '@/types';

export type DesignerResponseQuestion = {
  id: string;
  prompt: string;
  required: boolean;
  placeholder?: string;
};

export type DesignerResponseFrameType = FrameOutline['frameType'];

const EMOTION_PROMPT =
  "How do the storyboard character's emotions in this frame compare to your own during your experience?";

export const DESIGNER_FRAME_RESPONSE_QUESTIONS: Record<
  DesignerResponseFrameType,
  DesignerResponseQuestion[]
> = {
  Context: [
    // {
    //   id: 'designer_response_context_1',
    //   prompt: 'What made you pick this storyboard over the other two?',
    //   required: true,
    //   placeholder: '1-2 sentences justifying your choice'
    // },
    {
      id: 'designer_response_context_2',
      prompt:
        "How do you relate to this scenario's Context in the storyboard? In what ways is this similar to and different from your experience?",
      required: true,
      placeholder: 'Describe your experience'
    },
    {
      id: 'designer_response_emotion_context',
      prompt: EMOTION_PROMPT,
      required: true,
      placeholder: 'A sentence about your emotions'
    }
  ],
  Problem: [
    {
      id: 'designer_response_problem',
      prompt: "How does this storyboard's Problem compare to your experience?",
      required: true,
      placeholder: '1-2 sentences'
    },
    {
      id: 'designer_response_emotion_problem',
      prompt: EMOTION_PROMPT,
      required: true,
      placeholder: 'A sentence about your emotions'
    }
  ],
  Action: [
    {
      id: 'designer_response_action',
      prompt: "How does this storyboard's Action compare to your experience?",
      required: true,
      placeholder: '1-2 sentences'
    },
    {
      id: 'designer_response_emotion_action',
      prompt: EMOTION_PROMPT,
      required: true,
      placeholder: 'A sentence about your emotions'
    }
  ],
  Resolution: [
    {
      id: 'designer_response_resolution',
      prompt: "How does this storyboard's Resolution compare to your experience?",
      required: true,
      placeholder: '1-2 sentences'
    },
    {
      id: 'designer_response_emotion_resolution',
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

export function getDesignerFrameResponseQuestions(
  frameType: DesignerResponseFrameType
): DesignerResponseQuestion[] {
  return DESIGNER_FRAME_RESPONSE_QUESTIONS[frameType];
}
