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
      'I want to find a regular time to go to the gym.',
    Problem:
      'Busy gym spots make my workout less efficient.',
    Action:
      'The app helps me identify quieter times to visit the gym.',
    Resolution:
      'I enjoy uninterrupted workouts with my updated schedule.'
  },
  sb3: {
    Context:
      'I want to find a consistent group to play team sports with at the gym.',
    Problem:
      'Inconsistent schedules make it hard to find a time to play team sports.',
    Action:
      'I join a recreation tournament online to play dedicated team games at the gym.',
    Resolution:
      'I enjoy consistent games with friends at the gym.'
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
