import { createClient } from '@supabase/supabase-js';

// ─── Configuração Local (Proteção contra falhas de importação externa) ──────
const S_URL = process.env.SUPABASE_URL || '';
const S_KEY = process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: any, res: any) {
  try {
    // 1. Verificações Iniciais
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
    if (!S_URL || !S_KEY) {
       console.error('[CRITICAL] Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas na Vercel.');
       return res.status(500).json({ error: 'Configuração de servidor incompleta (Env Vars)' });
    }

    const { base64Image, filename } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'Arquivo não enviado' });

    // 2. Criar Cliente Supabase
    const supabase = createClient(S_URL, S_KEY);

    // 3. Processar Tipo de Conteúdo e Extensão
    let contentType = 'application/octet-stream';
    let fileExt = 'bin';

    if (base64Image.includes('data:')) {
      const match = base64Image.match(/data:([^;]+);base64/);
      if (match) {
        contentType = match[1];
        fileExt = contentType.split('/')[1] || 'bin';
      }
    }

    // 4. Processar Nome do Arquivo
    const safeName = (filename || 'upload')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50);

    const finalPath = `${safeName}-${Date.now()}.${fileExt}`;

    // 5. Converter Base64 para Uint8Array
    const base64Data = base64Image.split(',')[1] || base64Image;
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }

    console.log(`[Invoking Storage] ${finalPath} (${contentType}) - ${bytes.length} bytes`);

    // 6. Upload Direto
    const { data, error } = await supabase.storage
      .from('products')
      .upload(finalPath, bytes, {
        contentType: contentType,
        upsert: true
      });

    if (error) {
       console.error('[Supabase Storage Error]', error);
       return res.status(500).json({ error: `Falha no Supabase Storage: ${error.message}` });
    }

    // 7. Gerar URL Pública
    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(data.path);

    return res.status(200).json({ url: publicUrl });

  } catch (err: any) {
    console.error('[GLOBAL CATCH]', err);
    return res.status(500).json({ 
      error: 'Erro Crítico no Servidor de Upload',
      message: err.message,
      type: err.name
    });
  }
}
