import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  const S_URL = process.env.SUPABASE_URL || '';
  const S_KEY = process.env.SUPABASE_ANON_KEY || '';
  const table = 'stradabike_feedback';
  
  try {
    // 1. Check config
    if (!S_URL || !S_KEY) {
      return res.status(500).json({ error: 'Configuração do Supabase ausente no servidor (Variáveis de Ambiente).' });
    }

    const supabase = createClient(S_URL, S_KEY);

    // 2. Handle POST Request
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
          console.error('[Feedback POST Error]', error);
          if (error.code === '42P01') {
              return res.status(500).json({ 
                  error: 'Tabela não encontrada no banco de dados.',
                  sql: `CREATE TABLE IF NOT EXISTS stradabike_feedback (id SERIAL PRIMARY KEY, name VARCHAR(255), rating INTEGER CHECK (rating >= 1 AND rating <= 5), type VARCHAR(50), comment TEXT, created_at TIMESTAMPTZ DEFAULT NOW());`
              });
          }
          // Error 403 or similar usually means RLS is enabled but no policy exists
          return res.status(500).json({ 
            error: `Erro no Supabase (${error.code}): ${error.message}`,
            hint: 'Verifique se você criou a POLICY de INSERT para o acesso público (anon) no dashboard do Supabase.'
          });
      }

      return res.status(201).json({ 
        success: true, 
        data: (data && data.length > 0) ? data[0] : { message: 'Inserido (sem retorno de dados)' } 
      });
    }

    // 3. Handle GET Request
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
      return res.status(200).json(data || []);
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (err: any) {
    console.error('[Feedback API Global Error]', err);
    return res.status(500).json({ error: err.message || 'Erro interno desconhecido' });
  }
}

