import './style.css'
import { getProducts } from './store'
import type { Product } from './store'
import { initNav } from './nav'

// Filter State
let activeFilters = {
  brand: 'all',
  quality: 'all',
  price: 'all',
  category: ''
};

let allProducts: Product[] = [];

const renderProducts = async () => {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const urlParams = new URLSearchParams(window.location.search);
  const categoryFilter = urlParams.get('category');
  
  if (categoryFilter) {
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
      pageTitle.innerHTML = `${categoryFilter} <span class="highlight">STRADA</span>`;
    }
    activeFilters.category = categoryFilter;
  }

  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Configurando conexão com Supabase...</div>';

  if (allProducts.length === 0) {
    allProducts = await getProducts();
  }
  
  applyFiltersAndRender();
};

const applyFiltersAndRender = () => {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  let filtered = [...allProducts];

  // 1. Category Filter
  if (activeFilters.category) {
    filtered = filtered.filter(p => p.categories?.includes(activeFilters.category) || p.category === activeFilters.category);
  } else {
    // Default to show only bikes in the bikes page (filter out clothing)
    filtered = filtered.filter(p => p.category !== 'Vestuário');
  }

  // 2. Brand Filter
  if (activeFilters.brand !== 'all') {
    filtered = filtered.filter(p => p.brand === activeFilters.brand);
  }

  // 3. Quality Filter
  if (activeFilters.quality !== 'all') {
    filtered = filtered.filter(p => p.quality === activeFilters.quality);
  }

  // 4. Price Filter
  if (activeFilters.price !== 'all') {
    filtered = filtered.filter(p => {
      const price = p.price || 0;
      if (activeFilters.price === '0-2000') return price <= 2000;
      if (activeFilters.price === '2000-5000') return price > 2000 && price <= 5000;
      if (activeFilters.price === '5000-10000') return price > 5000 && price <= 10000;
      if (activeFilters.price === '10000-plus') return price > 10000;
      return true;
    });
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <span>🔍</span>
        <h4>Nenhuma bike encontrada</h4>
        <p>Tente ajustar ou limpar seus filtros para encontrar o que procura.</p>
        <button class="btn btn-outline" style="margin-top: 20px;" id="btn-reset-filters">Limpar Filtros</button>
      </div>
    `;
    document.getElementById('btn-reset-filters')?.addEventListener('click', resetAllFilters);
    return;
  }

  grid.innerHTML = filtered.map(product => `
    <div class="product-card reveal">
      ${(product as any).seguro ? '<div class="seguro-seal"><span class="seal-icon">🛡️</span><span class="seal-text">14 MESES<br>SEGURO GRÁTIS</span></div>' : ''}
      <div class="product-image ${(product as any).studioBackground ? 'studio-mode' : ''}">
        ${product.brand ? `<div class="brand-badge" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-weight: 800; border: 1px solid rgba(255,255,255,0.1); z-index: 5;">${product.brand.toUpperCase()}</div>` : ''}
        <img src="${product.image}" alt="${product.name}">
        ${product.video ? (
          product.video.includes('youtube.com/embed') 
          ? `<div class="product-card-video-wrapper"><iframe class="product-card-video youtube-frame" src="" data-src="${product.video}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div>`
          : `<video class="product-card-video" src="${product.video}" muted loop playsinline preload="none"></video>`
        ) : ''}
        <div style="position: absolute; top: 10px; left: 10px; display: flex; flex-direction: column; gap: 5px; z-index: 10; pointer-events: none;">
          ${(product.categories || [product.category]).map((c: string) => `<div class="product-badge" style="position: relative; top: 0; left: 0;">${c}</div>`).join('')}
          ${product.onSale ? '<div class="promo-badge" style="position: relative; top: 0; left: 0; margin-top: 0;">PROMOÇÃO</div>' : ''}
        </div>
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p style="display: none;">${product.description}</p>
        <div class="product-price">
          ${product.onSale ? `
            <span class="original-price">R$ ${product.originalPrice}</span>
            <span class="current-price">R$ ${product.price}</span>
          ` : `
            <span class="current-price">R$ ${product.price || 'Sob consulta'}</span>
          `}
        </div>
        <button class="btn btn-detail open-product-modal">
          Ver Detalhes
          <span class="btn-icon">→</span>
        </button>
        <a href="https://wa.me/5571984666696?text=Ola%20tenho%20interesse%20neste%20produto:%20${encodeURIComponent(product.name)}" 
           class="btn btn-whatsapp" 
           target="_blank" 
           rel="noopener noreferrer">
          Adquirir Agora
          <span class="btn-icon">🛍️</span>
        </a>
      </div>
    </div>
  `).join('');
  
  attachProductCardEvents(filtered);
  handleReveal();
};

const attachProductCardEvents = (products: Product[]) => {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.querySelectorAll('.open-product-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest('.product-card');
        const nameElement = card?.querySelector('h3');
        if (!nameElement) return;
        const product = products.find(p => p.name === nameElement.textContent);
        if (product) openProductModal(product);
    });
  });

  grid.querySelectorAll('.product-card').forEach(card => {
    const video = card.querySelector('video');
    const iframe = card.querySelector('iframe');
    if (video) {
      card.addEventListener('mouseenter', () => (video as any).play());
      card.addEventListener('mouseleave', () => { (video as any).pause(); (video as any).currentTime = 0; });
    }
    if (iframe) {
      card.addEventListener('mouseenter', () => { const src = (iframe as HTMLElement).dataset.src; if (src) iframe.src = src; });
      card.addEventListener('mouseleave', () => { iframe.src = ''; });
    }
  });
};

const setupFilterEvents = () => {
  const brandBtns = document.querySelectorAll('#filter-brand .filter-btn');
  const qualityBtns = document.querySelectorAll('#filter-quality .filter-btn');
  const priceBtns = document.querySelectorAll('#filter-price .filter-btn');
  const clearBtn = document.getElementById('clear-filters');

  brandBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      brandBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilters.brand = btn.getAttribute('data-brand') || 'all';
      applyFiltersAndRender();
    });
  });

  qualityBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      qualityBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilters.quality = btn.getAttribute('data-quality') || 'all';
      applyFiltersAndRender();
    });
  });

  priceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      priceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilters.price = btn.getAttribute('data-price') || 'all';
      applyFiltersAndRender();
    });
  });

  clearBtn?.addEventListener('click', resetAllFilters);
};

const resetAllFilters = () => {
  activeFilters.brand = 'all';
  activeFilters.quality = 'all';
  activeFilters.price = 'all';
  
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.filter-btn[data-brand="all"], .filter-btn[data-quality="all"], .filter-btn[data-price="all"]').forEach(btn => btn.classList.add('active'));
  
  applyFiltersAndRender();
};

const handleReveal = () => {
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach(reveal => {
    const windowHeight = window.innerHeight;
    const revealTop = reveal.getBoundingClientRect().top;
    const revealPoint = 150;
    if (revealTop < windowHeight - revealPoint) {
      reveal.classList.add('active');
    }
  });
};

// ─── Products Initialization & Events ────────────────────


const openProductModal = (product: any) => {
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    const img = document.getElementById('modal-product-image') as HTMLImageElement;
    const title = document.getElementById('modal-product-title');
    const badge = document.getElementById('modal-product-badge');
    const seguroSeal = document.getElementById('modal-seguro-seal');
    const installments = document.getElementById('modal-installments');
    const category = document.getElementById('modal-product-category');
    const desc = document.getElementById('modal-product-desc');
    const priceContainer = document.getElementById('modal-product-price-container');
    const whatsappBtn = document.getElementById('modal-whatsapp-btn') as HTMLAnchorElement;

    if (img) img.src = product.image;
    if (title) title.textContent = product.name;
    if (badge) {
        badge.textContent = product.onSale ? 'PROMOÇÃO' : '';
        badge.style.display = product.onSale ? 'block' : 'none';
    }
    if (category) category.textContent = (product.categories || [product.category]).join(', ');
    if (desc) desc.textContent = product.description;
    
    const colorOptionsContainer = document.getElementById('modal-color-options');
    if (colorOptionsContainer) {
        if (product.colors && product.colors.length > 0) {
            colorOptionsContainer.parentElement!.style.display = 'block';
            colorOptionsContainer.innerHTML = product.colors.map((c: any, index: number) => `
                <div class="color-dot ${index === 0 ? 'active' : ''}" 
                     data-image="${c.image || product.image}" 
                     title="${c.name}"
                     style="width: 30px; height: 30px; border-radius: 50%; background-color: ${c.hex}; cursor: pointer; border: 2px solid ${index === 0 ? 'var(--primary)' : 'transparent'}; box-shadow: 0 4px 10px rgba(0,0,0,0.5); transition: transform 0.2s ease, border-color 0.2s ease;">
                </div>
            `).join('');

            // Add click listeners to dots to change main image
            const dots = colorOptionsContainer.querySelectorAll('.color-dot');
            dots.forEach(dot => {
                dot.addEventListener('click', (e) => {
                    dots.forEach(d => {
                        (d as HTMLElement).style.borderColor = 'transparent';
                        d.classList.remove('active');
                    });
                    const target = e.target as HTMLElement;
                    target.classList.add('active');
                    target.style.borderColor = 'var(--primary)';
                    
                    const newImage = target.dataset.image;
                    if (newImage && img) {
                        img.src = newImage;
                    }
                });
            });
            
            // Set initial image to first variant if exists, else keep product image
            if (product.colors[0].image && img) {
                 img.src = product.colors[0].image;
            }
        } else {
            colorOptionsContainer.parentElement!.style.display = 'none';
            if (img) img.src = product.image; // Fallback to standard
        }
    }

    if (seguroSeal) {
        seguroSeal.style.display = product.seguro ? 'flex' : 'none';
    }

    if (installments) {
        installments.style.display = product.price ? 'flex' : 'none';
    }
    
    if (priceContainer) {
        priceContainer.innerHTML = product.onSale 
            ? `<span class="original-price" style="font-size: 1.2rem;">R$ ${product.originalPrice}</span>
               <span class="current-price" style="font-size: 1.8rem; font-weight: 900;">R$ ${product.price}</span>` 
            : `<span class="current-price" style="font-size: 1.8rem; font-weight: 900;">R$ ${product.price || 'Sob consulta'}</span>`;
    }

    if (whatsappBtn) {
        whatsappBtn.href = `https://wa.me/5571984666696?text=Ola%20tenho%20interesse%20neste%20produto:%20${encodeURIComponent(product.name)}`;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// ─── Smooth Modal Close Helper ──────────────────────────
const smoothCloseModal = (modal: HTMLElement) => {
  modal.classList.add('closing');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  
  const onEnd = () => {
    modal.classList.remove('closing');
    modal.removeEventListener('transitionend', onEnd);
  };
  modal.addEventListener('transitionend', onEnd, { once: true });
  setTimeout(() => modal.classList.remove('closing'), 350);
};

const setupProductModalEvents = () => {
    const modal = document.getElementById('product-modal');
    const closeBtns = document.querySelectorAll('.close-product-modal');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (modal) smoothCloseModal(modal);
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal && modal) {
            smoothCloseModal(modal);
        }
    });

    // --- Lupa / Magnifier Logic ---
    const modalImageContainer = document.querySelector('.product-modal-image') as HTMLElement;
    const modalImage = document.getElementById('modal-product-image') as HTMLImageElement;
    
    if (modalImageContainer && modalImage) {
        modalImageContainer.addEventListener('mousemove', (e) => {
            const rect = modalImageContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;
            
            modalImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            modalImage.style.transform = 'scale(2.5)';
        });
        
        modalImageContainer.addEventListener('mouseleave', () => {
            modalImage.style.transformOrigin = 'center center';
            modalImage.style.transform = 'scale(1)';
        });
    }
};

// Mobile Menu Toggle (Reused)
const setupMobileMenu = () => {
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
  
    mobileMenu?.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      navLinks?.classList.toggle('active');
    });
};

document.addEventListener('DOMContentLoaded', async () => {
  await renderProducts();
  setupMobileMenu();
  setupProductModalEvents();
  setupFilterEvents();
  initNav();
});
