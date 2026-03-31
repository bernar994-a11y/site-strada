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

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Strada Pro Carbon G3',
    category: 'Speed',
    categories: ['Speed'],
    image: '/src/assets/bike-1.png',
    description: 'Leveza e aerodinâmica para quem busca performance extrema.',
    price: 15900,
    originalPrice: 18500,
    onSale: true
  },
  {
    id: 2,
    name: 'Trail Hunter X-Series',
    category: 'Mountain Bike',
    categories: ['Mountain Bike'],
    image: '/src/assets/bike-2.png',
    description: 'Domine qualquer trilha com suspensão total e precisão.',
    price: 12400
  },
  {
    id: 3,
    name: 'Gravel Adventurer',
    category: 'Uso Urbano',
    categories: ['Uso Urbano'],
    image: '/src/assets/bike-3.png',
    description: 'Explore novos caminhos sem limites entre o asfalto e a terra.',
    price: 9800
  },
  {
    id: 4,
    name: 'Urban Move E-Light',
    category: 'Bikes Elétricas',
    categories: ['Bikes Elétricas', 'Uso Urbano'],
    image: '/src/assets/bike-4.png',
    description: 'A revolução da mobilidade urbana com assistência inteligente.',
    price: 14200,
    originalPrice: 16000,
    onSale: true
  },
  {
    id: 5,
    name: 'Capacete Aerodynamic Pro',
    category: 'Acessórios',
    categories: ['Acessórios'],
    image: 'https://images.unsplash.com/photo-1596435606450-93663a83262b?auto=format&fit=crop&q=80&w=400',
    description: 'Segurança e estilo com a melhor ventilação do mercado.',
    price: 350,
    originalPrice: 480,
    onSale: true
  },
  {
    id: 6,
    name: "Camisa Strada Performance - Crossfit",
    price: 159.90,
    category: "Vestuário",
    categories: ["Vestuário"],
    description: "Tecido leve e respirável para treinos de alta intensidade.",
    image: "/src/assets/shirt-crossfit.png",
    onSale: true,
    originalPrice: 199.90,
    subcategory: "Crossfit"
  },
  {
    id: 7,
    name: "Jersey Strada Pro - Mountain Bike",
    price: 249.90,
    category: "Vestuário",
    categories: ["Vestuário"],
    description: "Design aerodinâmico e proteção UV para trilhas.",
    image: "/src/assets/shirt-mtb.png",
    onSale: false,
    subcategory: "Mountain Bike"
  },
  {
    id: 8,
    name: "Shorts Strada Run - Corrida",
    price: 129.90,
    category: "Vestuário",
    categories: ["Vestuário"],
    description: "Liberdade de movimento e secagem rápida.",
    image: "/src/assets/shorts-run.png",
    onSale: true,
    originalPrice: 159.90,
    subcategory: "Corrida"
  }
];

export const getProducts = async (): Promise<Product[]> => {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('API Error');
    const data = await res.json();
    return data.map((d: any) => ({
      ...d,
      onSale: d.onSale || false,
      studioBackground: d.studioBackground || false,
      seguro: d.seguro || false
    }));
  } catch (error) {
    console.warn('Backend indisponível. Usando fallback padrão.', error);
    return DEFAULT_PRODUCTS;
  }
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error('Erro ao salvar no Postgres');
  return await res.json();
};

export const updateProduct = async (updatedProduct: Product): Promise<Product> => {
  const res = await fetch('/api/products', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedProduct)
  });
  if (!res.ok) throw new Error('Erro ao atualizar no Postgres');
  return await res.json();
};

export const deleteProduct = async (id: number): Promise<void> => {
  const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Erro ao deletar no Postgres');
};
