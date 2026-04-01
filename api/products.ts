import { supabase } from './supabase';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('stradabike_products')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      return res.status(200).json(data);
    } 
    
    if (req.method === 'POST') {
      const p = req.body;
      const productToInsert = {
        name: p.name,
        category: p.category,
        categories: p.categories || [],
        description: p.description,
        price: p.price || 0,
        image: p.image,
        onSale: p.onSale || false,
        originalPrice: p.originalPrice || null,
        subcategory: p.subcategory || null,
        seguro: p.seguro || false,
        studioBackground: p.studioBackground || false,
        colors: p.colors || []
      };

      const { data, error } = await supabase
        .from('stradabike_products')
        .insert([productToInsert])
        .select();

      if (error) throw error;
      return res.status(201).json(data[0]);
    }

    if (req.method === 'PUT') {
      const p = req.body;
      const productToUpdate = {
        name: p.name,
        category: p.category,
        categories: p.categories || [],
        description: p.description,
        price: p.price || 0,
        image: p.image,
        onSale: p.onSale || false,
        originalPrice: p.originalPrice || null,
        subcategory: p.subcategory || null,
        seguro: p.seguro || false,
        studioBackground: p.studioBackground || false,
        colors: p.colors || []
      };

      const { data, error } = await supabase
        .from('stradabike_products')
        .update(productToUpdate)
        .eq('id', p.id)
        .select();

      if (error) throw error;
      return res.status(200).json(data[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      const { error } = await supabase
        .from('stradabike_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('Supabase Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
