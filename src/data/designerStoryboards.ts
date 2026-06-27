import type { FrameOutline } from '@/types';

export type DesignerFrame = {
  frameType: FrameOutline['frameType'];
  image: string;
  caption: string;
};

export type DesignerVariant = {
  id: string;
  title: string;
  frames: DesignerFrame[];
};

type FrameType = FrameOutline['frameType'];

const FRAME_TYPES: FrameType[] = [
  'Context',
  'Problem',
  'Action',
  'Resolution'
];

const FRAME_FILENAMES: Record<FrameType, string> = {
  Context: 'context.webp',
  Problem: 'problem.webp',
  Action: 'action.webp',
  Resolution: 'resolution.webp'
};

/** Per-variant narrative captions — edit here to match panel images. */
const VARIANT_DEFAULT_CAPTIONS: Record<string, Record<FrameType, string>> = {
  sb1: {
    Context:
      'I feel intimidated by the crowded gym environment.',
    Problem:
      'Fear of judgment prevents me from enjoying my workout.',
    Action:
      'The app connects me with supportive workout buddies.',
    Resolution:
      'I feel more confident and enjoy working out with my new friends.'
  },
  sb2: {
    Context:
      'I go to the gym regularly at the same time.',
    Problem:
      'Busy gym spots make my workout less efficient.',
    Action:
      'The app helps me identify quieter times to visit the gym.',
    Resolution:
      'I enjoy uninterrupted workouts with my updated schedule.'
  },
  sb3: {
    Context:
      'I get to the gym with my friends hoping to find availability on the bouldering wall.',
    Problem:
      'Crowded bouldering wall leaves us waiting a lot.',
    Action:
      'The app lets me reserve bouldering times for limited use.',
    Resolution:
      'My friends and I have a great time climbing without worrying about crowds.'
  }
};

export function getDefaultFrameCaption(
  variantId: string,
  frameType: FrameType
): string {
  return (
    VARIANT_DEFAULT_CAPTIONS[variantId]?.[frameType] ??
    `${frameType} scene`
  );
}

export function getVariantDefaultCaptions(
  variantId: string
): Record<FrameType, string> {
  const defaults = VARIANT_DEFAULT_CAPTIONS[variantId];
  if (defaults) return { ...defaults };
  return Object.fromEntries(
    FRAME_TYPES.map((frameType) => [frameType, `${frameType} scene`])
  ) as Record<FrameType, string>;
}

function buildVariant(id: string, title: string): DesignerVariant {
  return {
    id,
    title,
    frames: FRAME_TYPES.map((frameType) => ({
      frameType,
      image: `/storyboards/${id}/${FRAME_FILENAMES[frameType]}`,
      caption: getDefaultFrameCaption(id, frameType)
    }))
  };
}

export const DESIGNER_STORYBOARDS: DesignerVariant[] = [
  buildVariant('sb1', 'Storyboard 1'),
  buildVariant('sb2', 'Storyboard 2'),
  buildVariant('sb3', 'Storyboard 3')
];

export function getDesignerVariant(id: string): DesignerVariant | undefined {
  return DESIGNER_STORYBOARDS.find((v) => v.id === id);
}
