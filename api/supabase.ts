import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO: Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não configuradas na Vercel.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
