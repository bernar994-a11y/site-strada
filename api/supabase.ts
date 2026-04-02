import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase Client] CRITICAL: SUPABASE_URL or SUPABASE_ANON_KEY is missing.');
}

// Se a URL estiver vazia, passamos uma string dummy para evitar crash imediato na criação do client,
// mas as chamadas subsequentes falharão com erro controlado.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
