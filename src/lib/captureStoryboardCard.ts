import { toCanvas } from 'html-to-image';

const PIXEL_RATIO = 2;
const MAX_ATTEMPTS = 3;
const SAMPLES_PER_AXIS = 8;
const NEAR_WHITE_CHANNEL = 250;

type CaptureFilter = (domNode: HTMLElement) => boolean;

type Rect = { x: number; y: number; width: number; height: number };

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settleLayout(): Promise<void> {
  await document.fonts.ready;
  await nextFrame();
  await nextFrame();
}

/**
 * html-to-image skips `data:` URL images when embedding, and resolves as soon as
 * its generated SVG parses — not once the images nested inside it have decoded.
 * Decoding them up front is what keeps panels from rasterizing blank.
 */
async function decodeImages(images: HTMLImageElement[]): Promise<void> {
  await Promise.all(
    images.map(async (img) => {
      if (!img.complete) {
        await new Promise<void>((resolve) => {
          img.addEventListener('load', () => resolve(), { once: true });
          img.addEventListener('error', () => resolve(), { once: true });
        });
      }
      await img.decode().catch(() => undefined);
    })
  );
}

function panelRects(card: HTMLElement, images: HTMLImageElement[]): Rect[] {
  const cardRect = card.getBoundingClientRect();
  return images.map((img) => {
    const rect = img.getBoundingClientRect();
    return {
      x: (rect.left - cardRect.left) * PIXEL_RATIO,
      y: (rect.top - cardRect.top) * PIXEL_RATIO,
      width: rect.width * PIXEL_RATIO,
      height: rect.height * PIXEL_RATIO
    };
  });
}

/** A drawn illustration always varies; a dropped one leaves the card background. */
function isRegionBlank(pixels: ImageData, rect: Rect): boolean {
  let sawNonWhite = false;
  let sawVariation = false;
  let firstColor: number | null = null;

  for (let row = 0; row < SAMPLES_PER_AXIS; row++) {
    for (let col = 0; col < SAMPLES_PER_AXIS; col++) {
      const x = Math.floor(rect.x + ((col + 0.5) / SAMPLES_PER_AXIS) * rect.width);
      const y = Math.floor(rect.y + ((row + 0.5) / SAMPLES_PER_AXIS) * rect.height);
      if (x < 0 || y < 0 || x >= pixels.width || y >= pixels.height) continue;

      const offset = (y * pixels.width + x) * 4;
      const r = pixels.data[offset];
      const g = pixels.data[offset + 1];
      const b = pixels.data[offset + 2];

      if (r < NEAR_WHITE_CHANNEL || g < NEAR_WHITE_CHANNEL || b < NEAR_WHITE_CHANNEL) {
        sawNonWhite = true;
      }

      const color = (r << 16) | (g << 8) | b;
      if (firstColor === null) {
        firstColor = color;
      } else if (color !== firstColor) {
        sawVariation = true;
      }
    }
  }

  return !sawNonWhite || !sawVariation;
}

function findBlankPanels(canvas: HTMLCanvasElement, rects: Rect[]): number[] {
  if (rects.length === 0) return [];

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not read back the captured storyboard canvas.');
  }

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return rects.reduce<number[]>((blank, rect, index) => {
    if (isRegionBlank(pixels, rect)) blank.push(index);
    return blank;
  }, []);
}

export type StoryboardCapture = {
  dataUrl: string;
  /** Frame indices still blank in `dataUrl`; empty when the capture is good. */
  blankPanels: number[];
  attempts: number;
};

/**
 * Rasterize the storyboard card to a JPEG data URL, retrying while any panel
 * region comes out blank. Returns the best capture it managed rather than
 * failing, so a degraded image never blocks submitting the study log.
 */
export async function captureStoryboardCard(
  card: HTMLElement,
  filter?: CaptureFilter
): Promise<StoryboardCapture> {
  const images = Array.from(card.querySelectorAll('img'));

  await settleLayout();
  await decodeImages(images);

  const rects = panelRects(card, images);
  let canvas: HTMLCanvasElement | null = null;
  let blankPanels: number[] = [];
  let attempts = 0;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) await settleLayout();

    attempts = attempt;
    canvas = await toCanvas(card, {
      backgroundColor: 'white',
      pixelRatio: PIXEL_RATIO,
      filter
    });

    blankPanels = findBlankPanels(canvas, rects);
    if (blankPanels.length === 0) break;

    console.warn(
      `[captureStoryboardCard] attempt ${attempt}/${MAX_ATTEMPTS} produced blank panels:`,
      blankPanels.map((index) => index + 1)
    );
  }

  return {
    dataUrl: canvas ? canvas.toDataURL('image/jpeg', 1) : '',
    blankPanels,
    attempts
  };
}
