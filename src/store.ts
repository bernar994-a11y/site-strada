// src/store.ts

export interface Product {
  id: number;
  name: string;
  category: string;
  image: string;
  description: string;
  price?: number;
  originalPrice?: number;
  onSale?: boolean;
  subcategory?: string;
  seguro?: boolean;
  studioBackground?: boolean;
  colors?: { name: string; hex: string; image: string }[];
  categories?: string[];
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    
    if (!data || !Array.isArray(data)) return [];

    return data.map((d: any) => ({
      ...d,
      onSale: d.onSale || false,
      studioBackground: d.studioBackground || false,
      seguro: d.seguro || false
    }));
  } catch (error) {
    console.warn('Banco de dados vazio ou erro na conexão.', error);
    return [];
  }
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('Erro ao salvar no Supabase');
  return await res.json();
};

export const updateProduct = async (updatedProduct: Product): Promise<Product> => {
  const res = await fetch('/api/products', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedProduct)
  });
  if (!res.ok) throw new Error('Erro ao atualizar no Supabase');
  return await res.json();
};

export const deleteProduct = async (id: number): Promise<void> => {
  const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar no Supabase');
};
