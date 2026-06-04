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

const FRAME_TYPES: FrameOutline['frameType'][] = [
  'Context',
  'Problem',
  'Action',
  'Resolution'
];

const FRAME_FILENAMES: Record<FrameOutline['frameType'], string> = {
  Context: 'context.png',
  Problem: 'problem.png',
  Action: 'action.png',
  Resolution: 'resolution.png'
};

function buildVariant(id: string, title: string): DesignerVariant {
  return {
    id,
    title,
    frames: FRAME_TYPES.map((frameType) => ({
      frameType,
      image: `/storyboards/${id}/${FRAME_FILENAMES[frameType]}`,
      caption: `${title} — ${frameType}`
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
