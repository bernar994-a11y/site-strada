import { put } from '@vercel/blob';

export default async function handler(req: any, res: any) {
  // Configuração simples para JSON no body
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { base64Image, filename } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: 'Missing base64 image data' });
    }

    // Remove the data URI scheme prefix to get raw base64 string
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    const contentType = base64Image.startsWith('data:image/webp') ? 'image/webp' : 'image/jpeg';
    const finalFilename = filename || `bike-strada-${Date.now()}`;

    // Faz o upload no Vercel Blob
    const blob = await put(finalFilename, buffer, {
      access: 'public',
      contentType,
    });

    return res.status(200).json({ url: blob.url });
  } catch (error: any) {
    console.error('Blob Upload Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
