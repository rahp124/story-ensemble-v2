import { getStabilityAiKey } from '@/lib/envUtils';

export type StylePreset =
  | '3d-model'
  | 'analog-film'
  | 'anime'
  | 'cinematic'
  | 'comic-book'
  | 'digital-art'
  | 'enhance'
  | 'fantasy-art'
  | 'isometric'
  | 'line-art'
  | 'low-poly'
  | 'modeling-compound'
  | 'neon-punk'
  | 'origami'
  | 'photographic'
  | 'pixel-art'
  | 'tile-texture';

export async function generateImage({
  prompt,
  negativePrompt,
  stylePreset = 'digital-art',
  aspectRatio = '1:1'
}: {
  prompt: string;
  negativePrompt: string;
  stylePreset?: StylePreset;
  aspectRatio?: '1:1' | '3:2' | '16:9';
}) {
  const formData = new FormData();
  formData.set('prompt', prompt);
  formData.set('negative_prompt', negativePrompt);
  formData.set('aspect_ratio', '1:1');
  formData.set('style_preset', stylePreset);
  formData.set('aspect_ratio', aspectRatio);
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
