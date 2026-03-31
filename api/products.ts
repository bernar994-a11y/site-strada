import { sql } from '@vercel/postgres';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM stradabike_products ORDER BY id ASC`;
      return res.status(200).json(rows);
    } 
    
    if (req.method === 'POST') {
      const p = req.body;
      const { rows } = await sql`
        INSERT INTO stradabike_products 
        (name, category, categories, description, price, image, "onSale", "originalPrice", subcategory, seguro, "studioBackground", colors)
        VALUES 
        (${p.name}, ${p.category}, ${JSON.stringify(p.categories || [])}::jsonb, ${p.description}, ${p.price || 0}, ${p.image}, ${p.onSale || false}, ${p.originalPrice || null}, ${p.subcategory || null}, ${p.seguro || false}, ${p.studioBackground || false}, ${JSON.stringify(p.colors || [])}::jsonb)
        RETURNING *;
      `;
      return res.status(201).json(rows[0]);
    }

    if (req.method === 'PUT') {
      const p = req.body;
      const { rows } = await sql`
        UPDATE stradabike_products SET
        name = ${p.name}, category = ${p.category}, categories = ${JSON.stringify(p.categories || [])}::jsonb, description = ${p.description}, price = ${p.price || 0}, image = ${p.image}, "onSale" = ${p.onSale || false},
        "originalPrice" = ${p.originalPrice || null}, subcategory = ${p.subcategory || null}, seguro = ${p.seguro || false}, "studioBackground" = ${p.studioBackground || false}, colors = ${JSON.stringify(p.colors || [])}::jsonb
        WHERE id = ${p.id}
        RETURNING *;
      `;
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM stradabike_products WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Database Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
