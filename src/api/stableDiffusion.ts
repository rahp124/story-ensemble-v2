import { getStabilityAiKey } from '@/lib/envUtils';

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
