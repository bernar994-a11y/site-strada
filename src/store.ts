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
    if (!res.ok) {
       const text = await res.text();
       console.error('Fetch products error:', text);
       throw new Error(`API Error: ${res.status}`);
    }
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

const handleResponse = async (res: Response, defaultError: string) => {
  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const err = await res.json();
      throw new Error(err.error || defaultError);
    } else {
      const text = await res.text();
      throw new Error(`${defaultError}: ${text.substring(0, 100)}`);
    }
  }
  return res.json();
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  return handleResponse(res, 'Erro ao salvar no Supabase');
};

export const updateProduct = async (updatedProduct: Product): Promise<Product> => {
  const res = await fetch('/api/products', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedProduct)
  });
  return handleResponse(res, 'Erro ao atualizar no Supabase');
};

export const deleteProduct = async (id: number): Promise<void> => {
  const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro ao deletar no Supabase: ${text.substring(0, 100)}`);
  }
};
