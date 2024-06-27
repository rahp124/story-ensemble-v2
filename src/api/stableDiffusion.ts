import { getStabilityAiKey } from '@/lib/envUtils';
import { blobToDataUrl } from '../lib/blobToDataUrl';

export async function generateImageFromSketch(sketch: Blob, prompt: string) {
  const formData = new FormData();
  formData.set('image', sketch);
  formData.set('prompt', prompt);
  // formData.set('negative_prompt', '');
  formData.set('control_strength', '0.4');
  formData.set('output_format', 'webp');

  const response = await fetch(
    `https://api.stability.ai/v2beta/stable-image/control/sketch`,
    {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${getStabilityAiKey()}`,
        Accept: 'image/*'
      }
    }
  );

  const blob = await response.blob();
  const dataUrl = await blobToDataUrl(blob);
  return dataUrl;
}

export async function generateImage({
  prompt,
  negativePrompt
}: {
  prompt: string;
  negativePrompt: string;
}) {
  const formData = new FormData();
  formData.set('prompt', prompt);
  formData.set('negative_prompt', negativePrompt);
  formData.set('aspect_ratio', '1:1');
  formData.set('style_preset', 'digital-art');
  formData.set('output_format', 'webp');

  const response = await fetch(
    `https://api.stability.ai/v2beta/stable-image/generate/core`,
    {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${getStabilityAiKey()}`,
        Accept: 'application/json'
      }
    }
  );

  const { image } = await response.json();

  return `data:image/webp;base64,${image}`;
}
