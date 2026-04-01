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
        seguro BOOLEAN DEFAULT false,
        "studioBackground" BOOLEAN DEFAULT false,
        colors JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Note: Supabase client doesn't support direct DDL like CREATE TABLE via API for security.
    // This endpoint now returns the schema for manual execution in the Supabase SQL Editor.
    
    return res.status(200).json({ 
      message: "Por favor, execute o SQL abaixo no painel do Supabase (SQL Editor) para criar a tabela:",
      sql: schema
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
