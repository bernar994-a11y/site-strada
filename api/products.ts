import { createClient } from '@supabase/supabase-js';

// ─── Configuração Local (Proteção contra falhas de importação externa) ──────
const S_URL = process.env.SUPABASE_URL || '';
const S_KEY = process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: any, res: any) {
  try {
    // 1. Verificações Iniciais
    if (!S_URL || !S_KEY) {
       console.error('[CRITICAL DB] Variáveis SUPABASE faltantes.');
       return res.status(500).json({ error: 'Configuração do Servidor Incompleta' });
    }

    const supabase = createClient(S_URL, S_KEY);
    const table = 'stradabike_products';

    // 2. GET: Listar Produtos
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      return res.status(200).json(data);
    } 
    
    // 3. POST: Adicionar Produto
    if (req.method === 'POST') {
      const p = req.body;
      const { data, error } = await supabase
        .from(table)
        .insert([{
          name: p.name,
          category: p.category,
          categories: p.categories || [],
          description: p.description,
          price: p.price || 0,
          image: p.image,
          onSale: p.onSale || false,
          originalPrice: p.originalPrice || null,
          subcategory: p.subcategory || null,
          seguro: p.seguro || false,
          studioBackground: p.studioBackground || false,
          colors: p.colors || []
        }])
        .select();

      if (error) throw error;
      return res.status(201).json(data[0]);
    }

    // 4. PUT: Atualizar Produto
    if (req.method === 'PUT') {
      const p = req.body;
      const { data, error } = await supabase
        .from(table)
        .update({
          name: p.name,
          category: p.category,
          categories: p.categories || [],
          description: p.description,
          price: p.price || 0,
          image: p.image,
          onSale: p.onSale || false,
          originalPrice: p.originalPrice || null,
          subcategory: p.subcategory || null,
          seguro: p.seguro || false,
          studioBackground: p.studioBackground || false,
          colors: p.colors || []
        })
        .eq('id', p.id)
        .select();

      if (error) throw error;
      return res.status(200).json(data[0]);
    }

    // 5. DELETE: Excluir Produto
    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (err: any) {
    console.error('[DB GLOBAL CATCH]', err);
    // Erro comum: a tabela 'stradabike_products' não foi criada no painel do Supabase.
    return res.status(500).json({ 
      error: `Erro no Supabase: ${err.message}`,
      message: 'Certifique-se de que a tabela "stradabike_products" foi criada via SQL Editor.',
      details: err
    });
  }
}
