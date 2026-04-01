import { supabase } from './supabase';

export default async function handler(req: any, res: any) {
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
    const extension = contentType.split('/')[1];
    const finalFilename = `${filename || `bike-strada-${Date.now()}`}.${extension}`;

    // Upload to Supabase Storage (Bucket: 'products')
    const { data, error } = await supabase.storage
      .from('products')
      .upload(finalFilename, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
       console.error('Supabase Storage Error detail:', error);
       throw error;
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);

    return res.status(200).json({ url: publicUrl });
  } catch (error: any) {
    console.error('Storage Upload Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
