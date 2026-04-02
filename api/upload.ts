import { supabase } from './supabase';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { base64Image, filename } = req.body;
    
    if (!base64Image) {
      console.error('ERRO: base64Image ausente no body');
      return res.status(400).json({ error: 'Missing base64 image data' });
    }

    // Remove the data URI scheme prefix to get raw base64 string
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    let contentType = 'image/jpeg';
    if (base64Image.startsWith('data:image/webp')) contentType = 'image/webp';
    else if (base64Image.startsWith('data:image/png')) contentType = 'image/png';
    else if (base64Image.startsWith('data:image/gif')) contentType = 'image/gif';

    const extension = contentType.split('/')[1];
    const finalFilename = `${filename || `bike-strada-${Date.now()}`}.${extension}`;

    console.log(`[Supabase Storage] Fazendo upload: ${finalFilename} (${contentType})`);

    // Upload to Supabase Storage (Bucket: 'products')
    const { data, error } = await supabase.storage
      .from('products')
      .upload(finalFilename, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
       console.error('ERRO SUPABASE STORAGE:', error);
       return res.status(500).json({ error: error.message });
    }

    console.log('Upload concluído com sucesso:', data.path);

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);

    console.log('[Supabase Storage] Público URL gerada:', publicUrl);

    return res.status(200).json({ url: publicUrl });
  } catch (error: any) {
    console.error('[Supabase Storage] CRITICAL ERROR:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor de storage' });
  }
}
