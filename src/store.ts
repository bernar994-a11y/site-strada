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

const STORAGE_KEY = 'strada_products';

export const getProducts = (): Product[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error parsing products from localStorage', e);
    return DEFAULT_PRODUCTS;
  }
};

export const saveProducts = (products: Product[]) => {
  console.log('--- Gravando no localStorage ---');
  console.log('Total de produtos:', products.length);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
};

export const addProduct = (product: Omit<Product, 'id'>) => {
  const products = getProducts();
  const newProduct = { ...product, id: Date.now() };
  console.log('Adicionando novo produto ao array:', newProduct.name);
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
};

export const updateProduct = (updatedProduct: Product) => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === updatedProduct.id);
  if (index !== -1) {
    console.log('Atualizando produto no array:', updatedProduct.id);
    products[index] = updatedProduct;
    saveProducts(products);
  }
};

export const deleteProduct = (id: number) => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  saveProducts(filtered);
};
