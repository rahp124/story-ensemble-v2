const MIN_QUALITY = 0.4;
const MAX_QUALITY = 0.92;
const QUALITY_STEPS = 8;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}

function byteSize(dataUrl: string): number {
  return new Blob([dataUrl]).size;
}

/**
 * Re-encode a JPEG data URL at full pixel dimensions, lowering quality until
 * the data URL fits within maxBytes.
 */
export async function compressJpegDataUrl(
  dataUrl: string,
  maxBytes: number
): Promise<string> {
  if (maxBytes <= 0) {
    throw new Error('No remaining byte budget for the storyboard image.');
  }

  if (byteSize(dataUrl) <= maxBytes) {
    return dataUrl;
  }

  const img = await loadImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not create canvas for image compression.');
  }
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  let lo = MIN_QUALITY;
  let hi = MAX_QUALITY;
  let best: string | null = null;

  for (let i = 0; i < QUALITY_STEPS; i++) {
    const quality = (lo + hi) / 2;
    const candidate = canvas.toDataURL('image/jpeg', quality);
    if (byteSize(candidate) <= maxBytes) {
      best = candidate;
      lo = quality;
    } else {
      hi = quality;
    }
  }

  // Prefer the best fitting mid-search result; also try the floor quality.
  if (!best) {
    const floor = canvas.toDataURL('image/jpeg', MIN_QUALITY);
    if (byteSize(floor) <= maxBytes) {
      best = floor;
    }
  }

  if (!best) {
    throw new Error(
      `Storyboard image cannot fit under ${maxBytes} bytes even at minimum JPEG quality.`
    );
  }

  return best;
}
