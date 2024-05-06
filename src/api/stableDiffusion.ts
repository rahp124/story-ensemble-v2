import { blobToDataUrl } from '../lib/blobToDataUrl';

const STABLE_DIFFUSION_API = import.meta.env.VITE_STABILITY_API_KEY;

export async function generateImageFromSketch(sketch: Blob, prompt: string) {
  const formData = new FormData();
  formData.set('image', sketch);
  formData.set('prompt', prompt);
  // formData.set('negative_prompt', '');
  formData.set('control_strength', '0.3');
  formData.set('output_format', 'webp');

  const response = await fetch(
    `https://api.stability.ai/v2beta/stable-image/control/sketch`,
    {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${STABLE_DIFFUSION_API}`,
        Accept: 'image/*'
      }
    }
  );

  const blob = await response.blob();
  const dataUrl = await blobToDataUrl(blob);
  return dataUrl;
}
