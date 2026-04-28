import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  try {
    // 1. GET: Consultar cliente ou saldo
    if (method === 'GET') {
      const { phone, code, action } = req.query;

      if (action === 'check-code') {
          // Apenas verifica se um código já existe (para geração de novos)
          const { data } = await supabase.from('stradabike_loyalty_clients').select('id').eq('loyalty_code', code).single();
          return res.status(200).json({ exists: !!data });
      }

      let query = supabase.from('stradabike_loyalty_clients').select('*, stradabike_loyalty_history(*)');
      
      if (phone) query = query.eq('phone', phone);
      if (code) query = query.eq('loyalty_code', code);

      const { data, error } = await query.single();
      if (error) return res.status(404).json({ error: 'Cliente não encontrado' });
      
      return res.status(200).json(data);
    }

    // 2. POST: Criar novo cliente ou Adicionar pontos
    if (method === 'POST') {
      const { action, name, phone, loyalty_code, client_id, points, description } = req.body;

      if (action === 'register') {
        const { data, error } = await supabase
          .from('stradabike_loyalty_clients')
          .insert([{ name, phone, loyalty_code, points_balance: 0 }])
          .select();

        if (error) throw error;
        return res.status(201).json(data[0]);
      }

      if (action === 'add-points') {
        // 1. Registrar histórico
        const { error: histError } = await supabase
          .from('stradabike_loyalty_history')
          .insert([{ client_id, points, description }]);
        
        if (histError) throw histError;

        // 2. Atualizar saldo
        const { data: clientData } = await supabase.from('stradabike_loyalty_clients').select('points_balance').eq('id', client_id).single();
        const newBalance = (clientData?.points_balance || 0) + points;

        const { data, error } = await supabase
          .from('stradabike_loyalty_clients')
          .update({ points_balance: newBalance })
          .eq('id', client_id)
          .select();

        if (error) throw error;
        return res.status(200).json(data[0]);
      }
    }

    // 3. DELETE: Resetar ou remover cliente (opcional)
    if (method === 'DELETE') {
        // Implementar se necessário
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (err: any) {
    console.error('[Loyalty API Error]:', err);
    return res.status(500).json({ error: err.message });
  }
}
