import { createClient } from '@supabase/supabase-js';

const S_URL = process.env.SUPABASE_URL || '';
const S_KEY = process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: any, res: any) {
  try {
    if (!S_URL || !S_KEY) {
      return res.status(500).json({ error: 'Configuração do Servidor Incompleta' });
    }

    const supabase = createClient(S_URL, S_KEY);
    const table = 'stradabike_feedback';

    if (req.method === 'POST') {
      const { name, rating, type, comment } = req.body;

      if (!rating || !type) {
        return res.status(400).json({ error: 'Nota e Tipo são obrigatórios.' });
      }

      const { data, error } = await supabase
        .from(table)
        .insert([{
          name: name || 'Anônimo',
          rating: parseInt(rating),
          type,
          comment
        }])
        .select();

      if (error) throw error;
      return res.status(201).json({ success: true, data: data[0] });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (err: any) {
    console.error('[Feedback API Error]', err);
    return res.status(500).json({ error: err.message });
  }
}
