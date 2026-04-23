import { supabase } from './supabase';

export default async function handler(req: any, res: any) {
  const table = 'stradabike_feedback';
  
  try {
    // Check config
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: 'Configuração do Supabase ausente no servidor (Variáveis de Ambiente).' });
    }
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

      if (error) {
          if (error.code === '42P01') {
              return res.status(500).json({ 
                  error: 'Tabela não encontrada no banco de dados.',
                  sql: `CREATE TABLE IF NOT EXISTS stradabike_feedback (id SERIAL PRIMARY KEY, name VARCHAR(255), rating INTEGER CHECK (rating >= 1 AND rating <= 5), type VARCHAR(50), comment TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`
              });
          }
          throw error;
      }
      return res.status(201).json({ success: true, data: data[0] });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
          if (error.code === '42P01') {
              return res.status(404).json({ error: 'Tabela ainda não foi criada.' });
          }
          throw error;
      };
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (err: any) {
    console.error('[Feedback API Error]', err);
    return res.status(500).json({ error: err.message });
  }
}
