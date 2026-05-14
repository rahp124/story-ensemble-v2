/// <reference types="node" />
import OpenAI, { toFile } from 'openai';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let image: string, prompt: string, size: '1024x1024' | '512x512', apiKey: string | undefined;
  try {
    ({ image, prompt, size = '1024x1024', apiKey } = await req.json() as {
      image: string;
      prompt: string;
      size?: '1024x1024' | '512x512';
      apiKey?: string;
    });
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    // apiKey forwarded from client covers local dev where vercel dev doesn't inject .env.local
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || apiKey });

    // Accept either a full data URL ("data:image/png;base64,...") or raw base64
    const base64 = image.includes(',') ? image.split(',')[1] : image;

    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Use OpenAI's toFile helper — Node.js runtime requires this for proper multipart uploads
    const imageFile = await toFile(bytes, 'reference.png', { type: 'image/png' });

    // gpt-image-1 supports image-to-image editing with opaque reference images.
    // dall-e-2 (the only model listed in SDK types) requires transparency in the input
    // when no mask is provided, making it incompatible with opaque persona portraits.
    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt,
      n: 1,
      size
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error('OpenAI returned no image data');
    return Response.json({ b64_json: b64 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[generate-edit] error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
