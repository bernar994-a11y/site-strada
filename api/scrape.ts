
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao acessar o site: ${response.statusText}`);
    }

    const html = await response.text();

    // Funções auxiliares simples para extrair meta tags via regex (evitando dependências externas pesadas)
    const extractMeta = (prop: string) => {
      const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i');
      const match = html.match(regex);
      return match ? match[1] : null;
    };

    // Título (OG ou Title tag)
    const title = extractMeta('og:title') || extractMeta('twitter:title') || html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
    
    // Descrição
    const description = extractMeta('og:description') || extractMeta('twitter:description') || extractMeta('description') || '';
    
    // Imagem
    const image = extractMeta('og:image') || extractMeta('twitter:image') || '';
    
    // Preço (Tenta encontrar tags comuns de preço em e-commerces)
    const price = extractMeta('product:price:amount') || extractMeta('price') || '';

    // Limpeza básica de entidades HTML no título
    const cleanTitle = title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
    const cleanDesc = description.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();

    return res.status(200).json({
      title: cleanTitle,
      description: cleanDesc,
      image: image,
      price: price ? parseFloat(price.replace(',', '.')) : null,
      source: new URL(url).hostname
    });

  } catch (error: any) {
    console.error('[Scrape Error]', error);
    return res.status(500).json({ error: 'Erro ao extrair dados do link.', details: error.message });
  }
}
