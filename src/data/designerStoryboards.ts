import type { FrameOutline } from '@/types';

/** A single panel written into a storyboard node's outline. */
export type DesignerFrame = {
  frameType: FrameOutline['frameType'];
  image: string;
  caption: string;
};

/** A pre-made storyboard shown in the designer flow, as one composite image. */
export type DesignerStoryboard = {
  id: string;
  title: string;
  image: string;
};

export const DESIGNER_STORYBOARDS: DesignerStoryboard[] = [1, 2, 3].map((n) => ({
  id: `designer_example_${n}`,
  title: `Storyboard ${n}`,
  image: `${import.meta.env.BASE_URL}storyboards/designer_example/designer_example_${n}.jpg`
}));

export function getDesignerStoryboard(id: string): DesignerStoryboard | undefined {
  return DESIGNER_STORYBOARDS.find((s) => s.id === id);
}
