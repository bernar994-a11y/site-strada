import { createClient } from '@supabase/supabase-js';

const S_URL = process.env.SUPABASE_URL || '';
const S_KEY = process.env.SUPABASE_ANON_KEY || '';

// @ts-ignore - we handle missing credentials inside the handler
const supabase = createClient(
  S_URL || 'https://placeholder.supabase.co',
  S_KEY || 'placeholder'
);

export default async function handler(req: any, res: any) {
  const { method } = req;

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: 'Configuração do Banco de Dados faltando no servidor.' });
  }

  try {
    // 1. GET: Consultar cliente ou saldo
    if (method === 'GET') {
      const { phone, code, action, email, cpf } = req.query;

      if (action === 'check-code') {
          const { data } = await supabase.from('stradabike_loyalty_clients').select('id').eq('loyalty_code', code).single();
          return res.status(200).json({ exists: !!data });
      }

      let query = supabase.from('stradabike_loyalty_clients').select('*, stradabike_loyalty_history(*)');
      
      if (phone) query = query.eq('phone', phone);
      if (code) query = query.eq('loyalty_code', code);
      if (email) query = query.eq('email', email);
      if (cpf) query = query.eq('cpf', cpf);

      // Se houver filtros específicos, buscamos apenas um
      if (phone || code || email || cpf) {
          const { data, error } = await query.single();
          if (error) return res.status(404).json({ error: 'Cliente não encontrado' });
          return res.status(200).json(data);
      }

      // Caso contrário (Admin), listamos todos
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) return res.status(500).json({ error: error.message });
      
      return res.status(200).json(data);
    }

    // 2. POST: Operações seguras
    if (method === 'POST') {
      const { action, name, phone, cpf, email, password, loyalty_code, client_id, points, description, identifier } = req.body;

      if (action === 'register') {
        const { data, error } = await supabase
          .from('stradabike_loyalty_clients')
          .insert([{ name, phone, cpf, email, password, loyalty_code, points_balance: 0 }])
          .select();

        if (error) {
            if (error.code === '23505') {
                return res.status(400).json({ error: 'CPF, E-mail ou Telefone já cadastrado.' });
            }
            throw error;
        }
        return res.status(201).json(data[0]);
      }

      if (action === 'login') {
          // Busca por CPF ou E-mail
          const { data, error } = await supabase
            .from('stradabike_loyalty_clients')
            .select('*, stradabike_loyalty_history(*)')
            .or(`cpf.eq.${identifier},email.eq.${identifier}`)
            .eq('password', password)
            .single();

          if (error || !data) {
              return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
          }
          return res.status(200).json(data);
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
