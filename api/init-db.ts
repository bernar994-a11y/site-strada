import { supabase } from './supabase';

export default async function handler(req: any, res: any) {
  try {
    const schema = `
      CREATE TABLE IF NOT EXISTS stradabike_products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        categories JSONB,
        description TEXT,
        price NUMERIC,
        image TEXT,
        "onSale" BOOLEAN DEFAULT false,
        "originalPrice" NUMERIC,
        subcategory VARCHAR(100),
        seguro BOOLEAN DEFAULT FALSE,
        studio_background BOOLEAN DEFAULT FALSE,
        video TEXT,
        colors JSONB DEFAULT '[]'::jsonb,
        brand TEXT,
        quality TEXT DEFAULT 'Intermediária',
        "isNew" BOOLEAN DEFAULT FALSE,
        "newDate" TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS stradabike_feedback (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        type VARCHAR(50), -- 'elogio', 'sugestao', 'reclamacao'
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Políticas de Segurança (Execute se o erro for 403 Forbidden)
      ALTER TABLE stradabike_feedback ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow public insert" ON stradabike_feedback FOR INSERT WITH CHECK (true);
      CREATE POLICY "Allow public select" ON stradabike_feedback FOR SELECT USING (true);
    `;


    const alterSql = `
      -- Execute isso para adicionar os campos à tabela existente:
      ALTER TABLE stradabike_products ADD COLUMN IF NOT EXISTS "brand" TEXT;
      ALTER TABLE stradabike_products ADD COLUMN IF NOT EXISTS "quality" TEXT DEFAULT 'Intermediária';
      ALTER TABLE stradabike_products ADD COLUMN IF NOT EXISTS "isNew" BOOLEAN DEFAULT FALSE;
      ALTER TABLE stradabike_products ADD COLUMN IF NOT EXISTS "newDate" TIMESTAMPTZ DEFAULT NOW();
      ALTER TABLE stradabike_products ADD COLUMN IF NOT EXISTS "sizes" JSONB DEFAULT '[]'::jsonb;
    `;

    // Note: Supabase client doesn't support direct DDL like CREATE TABLE via API for security.
    // This endpoint now returns the schema for manual execution in the Supabase SQL Editor.
    
    return res.status(200).json({ 
      message: "Por favor, execute o SQL abaixo no painel do Supabase (SQL Editor) para criar a tabela:",
      sql: schema,
      alter: alterSql
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
