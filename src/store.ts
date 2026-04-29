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
  video?: string;
  isNew?: boolean;
  newDate?: string;
  brand?: string;
  quality?: string;
  sizes?: string[];
}

export interface LoyaltyClient {
    id: string;
    name: string;
    phone: string;
    loyalty_code: string;
    points_balance: number;
    created_at: string;
    stradabike_loyalty_history?: LoyaltyHistory[];
}

export interface LoyaltyHistory {
    id: string;
    client_id: string;
    points: number;
    description: string;
    created_at: string;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const res = await fetch('/api/products');
    
    // Check if the response is valid JSON. If not (e.g. returns source code), throw to trigger fallback
    const contentType = res.headers.get('content-type');
    if (!res.ok || !contentType || !contentType.includes('application/json')) {
       throw new Error('API results unavailable or invalid');
    }

    const data = await res.json();
    if (!data || !Array.isArray(data)) throw new Error('Dados inválidos');

    return data.map((d: any) => ({
      ...d,
      onSale: d.onSale || false,
      studioBackground: d.studio_background || d.studioBackground || false,
      seguro: d.seguro || false,
      isNew: d.isNew || false,
      newDate: d.newDate || null,
      brand: d.brand || '',
      quality: d.quality || 'Intermediária',
      sizes: d.sizes || []
    }));
  } catch (error) {
    console.warn('Usando dados simulados (Fallback Dev). Servidor API indisponível.', error);
    
    // Dev Mock Data Fallback
    return [
      {
        id: 1,
        name: "Oggi Velloce Disc 2024",
        category: "Speed",
        categories: ["Speed", "Performance"],
        image: "https://images.tcdn.com.br/img/editor/up/1118182/oggi_velloce_disc_2024_azul.png",
        description: "A Velloce Disc é a bike ideal para quem quer começar no ciclismo de estrada com performance e segurança.",
        price: 5490.00,
        originalPrice: 6200.00,
        onSale: true,
        seguro: true,
        studioBackground: true,
        colors: [
            { name: "Azul/Preto", hex: "#0047AB", image: "https://images.tcdn.com.br/img/editor/up/1118182/oggi_velloce_disc_2024_azul.png" },
            { name: "Cinza", hex: "#808080", image: "https://images.tcdn.com.br/img/editor/up/1118182/oggi_velloce_disc_2024_cinza.png" }
        ],
        video: "./src/assets/hero-video.mp4"
      },
      {
        id: 2,
        name: "Oggi Big Wheel 7.2",
        category: "Mountain Bike",
        categories: ["Mountain Bike", "Trilha"],
        image: "https://images.tcdn.com.br/img/editor/up/1118182/oggi_big_wheel_7_2_preta.png",
        description: "A Big Wheel 7.2 é equipada com grupo Shimano Deore 11v, ideal para trilhas técnicas e subidas desafiadoras.",
        price: 4850.00,
        onSale: false,
        seguro: true,
        studioBackground: true,
        colors: []
      },
      {
        id: 3,
        name: "Oggi Float 5.0 HDS",
        category: "Mountain Bike",
        categories: ["Mountain Bike", "Feminina"],
        image: "https://images.tcdn.com.br/img/editor/up/1118182/oggi_float_5_0_hds_azul.png",
        description: "Conforto e performance para o público feminino, com geometria adaptada e componentes de alta durabilidade.",
        price: 3290.00,
        originalPrice: 3800.00,
        onSale: true,
        seguro: true,
        studioBackground: true,
        colors: []
      }
    ];
  }
};

export const getNewProducts = async (limit = 8): Promise<Product[]> => {
  const products = await getProducts();
  return products
    .filter(p => p.isNew)
    .sort((a, b) => {
      const dateA = a.newDate ? new Date(a.newDate).getTime() : 0;
      const dateB = b.newDate ? new Date(b.newDate).getTime() : 0;
      return dateB - dateA; // Mais recentes primeiro
    })
    .slice(0, limit);
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

// ─── Loader Helper ───────────────────────────────────────
export const getLoaderHTML = (message: string = 'Carregando sua próxima pedalada...') => {
  return `
    <div class="bike-loader">
      <div class="bike-animation">
        <svg class="bike-svg" viewBox="0 0 100 60" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <!-- Frame -->
          <path d="M25 45 L45 45 L40 25 L65 25 L45 45" /> <!-- Main Triangle -->
          <path d="M25 45 L40 25" /> <!-- Rear Triangle Seat Stay -->
          <path d="M65 25 L75 45" /> <!-- Fork -->
          <path d="M40 25 L40 18 M35 18 L45 18" /> <!-- Seat Post and Saddle -->
          <path d="M65 25 L68 15 M62 15 L72 15" /> <!-- Stem and Handlebars -->
          
          <!-- Wheels -->
          <g class="wheel">
            <circle cx="25" cy="45" r="10" />
            <path d="M25 35 L25 55 M15 45 L35 45" stroke-width="1" />
          </g>
          <g class="wheel">
            <circle cx="75" cy="45" r="10" />
            <path d="M75 35 L75 55 M65 45 L85 45" stroke-width="1" />
          </g>
        </svg>
      </div>
      <div class="loader-text">${message}</div>
      <div class="loader-subtext">Ajustando a rota...</div>
    </div>
  `;
};

// ─── Loyalty Helpers ─────────────────────────────────────
export const registerLoyaltyClient = async (name: string, phone: string, code: string) => {
    const res = await fetch('/api/fidelidade-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, phone, loyalty_code: code })
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao cadastrar cliente');
    }
    return res.json();
};

export const getLoyaltyClient = async (identifier: string): Promise<LoyaltyClient> => {
    const param = identifier.includes('-') ? `code=${identifier}` : `phone=${identifier}`;
    const res = await fetch(`/api/fidelidade-api?${param}`);
    if (!res.ok) throw new Error('Cliente não encontrado');
    return res.json();
};

export const addLoyaltyPoints = async (clientId: string, points: number, description: string) => {
    const res = await fetch('/api/fidelidade-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-points', client_id: clientId, points, description })
    });
    if (!res.ok) throw new Error('Falha ao atualizar pontos');
    return res.json();
};

export const getLoyaltyClients = async (): Promise<LoyaltyClient[]> => {
    const res = await fetch('/api/fidelidade-api?action=list-all');
    if (!res.ok) return [];
    return res.json();
};

