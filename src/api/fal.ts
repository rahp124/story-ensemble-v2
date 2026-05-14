import { fal } from '@fal-ai/client';
import { getFalKey } from '@/lib/envUtils';

let configured = false;
function ensureConfigured() {
  const key = getFalKey();
  if (!key) throw new Error('VITE_FAL_KEY not configured');
  if (!configured) {
    fal.config({ credentials: key });
    configured = true;
  }
}

async function urlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch fal image: ${resp.status}`);
  const blob = await resp.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    console.log(`⏱ [TIMING] ${label}: ${(performance.now() - start).toFixed(0)}ms`);
  }
}

type FluxOutput = { images: Array<{ url: string }> };

export async function generateImageWithFlux({
  prompt,
  negativePrompt = '',
  stylePreset
}: {
  prompt: string;
  negativePrompt?: string;
  stylePreset?: string;
}): Promise<string> {
  ensureConfigured();
  let combinedPrompt = prompt;
  if (stylePreset) combinedPrompt += `, ${stylePreset} style`;
  if (negativePrompt) combinedPrompt += `. Avoid: ${negativePrompt}`;

  const result = await timed('generateImageWithFlux (fal-ai/flux/schnell)', () =>
    fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: combinedPrompt,
        image_size: 'square_hd',
        num_images: 1,
        enable_safety_checker: true
      }
    })
  );

  const out = result.data as FluxOutput;
  const url = out.images?.[0]?.url;
  if (!url) throw new Error('fal flux/schnell returned no image');
  return await urlToDataUrl(url);
}

export async function editImageWithFluxKontext({
  prompt,
  referenceImage,
  negativePrompt = '',
  stylePreset
}: {
  prompt: string;
  referenceImage: string;
  negativePrompt?: string;
  stylePreset?: string;
}): Promise<string> {
  ensureConfigured();
  let combinedPrompt = prompt;
  if (stylePreset) combinedPrompt += `, ${stylePreset} style`;
  if (negativePrompt) combinedPrompt += `. Avoid: ${negativePrompt}`;

  const result = await timed('editImageWithFluxKontext (fal-ai/flux-pro/kontext)', () =>
    fal.subscribe('fal-ai/flux-pro/kontext', {
      input: {
        prompt: combinedPrompt,
        image_url: referenceImage,
        num_images: 1,
        output_format: 'png'
      }
    })
  );

  const out = result.data as FluxOutput;
  const url = out.images?.[0]?.url;
  if (!url) throw new Error('fal flux-pro/kontext returned no image');
  return await urlToDataUrl(url);
}
