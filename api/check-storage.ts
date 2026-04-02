import { createClient } from '@supabase/supabase-js';

const S_URL = process.env.SUPABASE_URL || '';
const S_KEY = process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: any, res: any) {
  try {
    const supabase = createClient(S_URL, S_KEY);
    
    // 1. Listar buckets
    const { data: buckets, error: bError } = await supabase.storage.listBuckets();
    
    if (bError) return res.status(500).json({ 
      error: 'Falha ao listar buckets no Supabase',
      details: bError 
    });

    // 2. Verificar o bucket 'products'
    const targetBucket = buckets.find(b => b.name === 'products');
    
    return res.status(200).json({
      message: 'Diagnóstico de Storage Supabase',
      project_url: S_URL.substring(0, 20) + '...',
      available_buckets: buckets.map(b => b.name),
      is_products_found: !!targetBucket,
      is_products_public: targetBucket?.public || false,
      instructions: !targetBucket 
        ? "ERRO: O bucket 'products' não foi encontrado. Por favor, crie-o no painel do Supabase com o nome 'products' (minúsculo)." 
        : "SUCESSO: Bucket 'products' configurado corretamente."
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
