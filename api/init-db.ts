import { sql } from '@vercel/postgres';

export default async function handler(req: any, res: any) {
  try {
    await sql`
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
        colors JSONB
      );
    `;
    return res.status(200).json({ message: "Tabela 'stradabike_products' verificada/criada com sucesso!" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
