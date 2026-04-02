import { supabase } from './supabase';

export default async function handler(req: any, res: any) {
  // 1. Pre-logic catch for any unexpected crash
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    const { base64Image, filename } = req.body;
    
    if (!base64Image) {
      console.error('[Storage Error] base64Image ausente');
      return res.status(400).json({ error: 'Dados da imagem não recebidos' });
    }

    // 2. Sanitize Filename (Evitar espaços e caracteres especiais que travam o Storage)
    const rawSafeName = (filename || 'image')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '-')     // Remove tudo que não for letra/número
      .replace(/-+/g, '-');           // Remove hífens duplicados

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    let contentType = 'image/jpeg';
    if (base64Image.startsWith('data:image/webp')) contentType = 'image/webp';
    else if (base64Image.startsWith('data:image/png')) contentType = 'image/png';
    else if (base64Image.startsWith('data:image/gif')) contentType = 'image/gif';

    const extension = contentType.split('/')[1];
    const finalFilename = `${rawSafeName}-${Date.now()}.${extension}`;

    console.log(`[Supabase Storage] Iniciando upload: ${finalFilename} (${buffer.length} bytes)`);

    // 3. Upload with timeout/error check
    const { data, error } = await supabase.storage
      .from('products')
      .upload(finalFilename, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
       console.error('[Supabase Storage API Error]', error);
       // Erros comuns: bucket não existe, sem permissão RLS
       return res.status(500).json({ 
         error: `Erro no Supabase: ${error.message}`,
         details: error
       });
    }

    if (!data) {
       throw new Error('Upload concluído mas o Supabase não retornou os dados do arquivo.');
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);

    console.log('[Supabase Storage] Sucesso:', publicUrl);
    return res.status(200).json({ url: publicUrl });

  } catch (err: any) {
    console.error('[CRITICAL CRASH]', err);
    return res.status(500).json({ 
      error: 'Erro Crítico no Servidor',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
