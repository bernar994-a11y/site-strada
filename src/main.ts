// Import styles
import './style.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}
import { getProducts, getNewProducts, getLoaderHTML } from './store'
import type { Product } from './store'
import { initNav } from './nav'
import { initFeedback } from './feedback'

// Filter State
let activeFilters = {
  brand: 'all',
  quality: 'all',
  price: 'all',
  category: ''
};

let allProducts: Product[] = [];

// Load Products
const renderProducts = async (categoryFilter?: string) => {
  const grid = document.getElementById('bikes-grid');
  if (!grid) return;

  grid.innerHTML = `<div class="section-loader">${getLoaderHTML('Preparando sua próxima pedalada...')}</div>`;

  if (allProducts.length === 0) {
    allProducts = await getProducts();
  }
  
  activeFilters.category = categoryFilter || '';
  
  applyFiltersAndRender();
};

const applyFiltersAndRender = () => {
  const grid = document.getElementById('bikes-grid');
  if (!grid) return;

  let filtered = [...allProducts];

  // 1. Category Filter (Primary)
  if (activeFilters.category) {
    filtered = filtered.filter(p => p.categories?.includes(activeFilters.category) || p.category === activeFilters.category);
  } else {
    // Default home view: only promotions
    filtered = filtered.filter(p => p.onSale);
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
  
  // Re-attach events
  attachProductCardEvents(filtered);
  setTimeout(handleReveal, 100);
};

const attachProductCardEvents = (products: Product[]) => {
  const grid = document.getElementById('bikes-grid');
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

// Category Filtering Setup (Home Page Only)
const openProductModal = (product: any) => {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    
    // Check if the modal content element exists (it should, as we're using the visible modal system now)
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        // We can add additional entry animations here if needed via JS
    }

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

    const sizesContainer = document.getElementById('modal-sizes-container');
    const sizeOptions = document.getElementById('modal-size-options');
    if (sizesContainer && sizeOptions) {
        if (product.sizes && product.sizes.length > 0) {
            sizesContainer.style.display = 'block';
            sizeOptions.innerHTML = product.sizes.map((size: string) => `
                <div class="size-badge" style="padding: 6px 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--gray-medium); border-radius: 6px; font-size: 0.85rem; color: #fff; text-align: center; min-width: 40px; font-weight: 600;">
                    ${size}
                </div>
            `).join('');
        } else {
            sizesContainer.style.display = 'none';
        }
    }

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
export const smoothCloseModal = (modal: HTMLElement) => {
  modal.classList.add('closing');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  
  const onEnd = () => {
    modal.classList.remove('closing');
    modal.removeEventListener('transitionend', onEnd);
  };
  modal.addEventListener('transitionend', onEnd, { once: true });
  
  // Fallback: force cleanup after 350ms in case transitionend doesn't fire
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

    // --- Lupa / Magnifier Logic (Enhanced for Premium Feel) ---
    const modalImageContainer = document.querySelector('.product-modal-image') as HTMLElement;
    const modalImage = document.getElementById('modal-product-image') as HTMLImageElement;
    
    // Check if device supports touch to avoid cursor-based logic on mobile
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (modalImageContainer && modalImage && !isTouchDevice) {
        modalImageContainer.style.cursor = 'zoom-in';

        modalImageContainer.addEventListener('mousemove', (e: MouseEvent) => {
            const rect = modalImageContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;
            
            modalImage.style.transition = 'transform 0.1s ease-out'; // Tighter response
            modalImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            modalImage.style.transform = 'scale(2.2)';
        });
        
        modalImageContainer.addEventListener('mouseleave', () => {
            modalImage.style.transition = 'transform 0.4s ease'; // Smooth exit
            modalImage.style.transformOrigin = 'center center';
            modalImage.style.transform = 'scale(1)';
        });
    } else if (modalImageContainer) {
        // Simple touch reset for mobile
        modalImageContainer.style.cursor = 'default';
        modalImageContainer.addEventListener('touchstart', () => {
             // Optional: click-to-zoom on mobile or just leave it clean
        }, { passive: true });
    }
};

const setupFilters = () => {
  setupFilterEvents();
  
  // Only target cards within the hero/bicicletas section to avoid conflict with vestuario page
  const homeCategoryCards = document.querySelectorAll('#bicicletas .category-card');
  
  homeCategoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const category = card.getAttribute('data-category');
      if (category) {
        window.location.href = `./products.html?category=${encodeURIComponent(category)}`;
      }
    });
  });
};

// Scroll Reveal Logic
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

// Mobile Menu Toggle
const setupMobileMenu = () => {
  const mobileMenu = document.getElementById('mobile-menu');
  const navLinks = document.querySelector('.nav-links');

  mobileMenu?.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navLinks?.classList.toggle('active');
  });
};

// Header Sticky Effect
const setupHeader = () => {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });
};

// Workshop Modal Logic
const setupWorkshopModal = () => {
    const modal = document.getElementById('workshop-modal');
    const card = document.getElementById('workshop-card');
    const closeBtn = document.querySelector('.close-modal');

    console.log('Workshop modal init:', { modal, card });
    if (!modal || !card) return;

    card.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Also target the button specifically just in case
    const btn = card.querySelector('.btn');
    btn?.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent double trigger if bubbling
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        smoothCloseModal(modal);
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            smoothCloseModal(modal);
            return;
        }

        // Fallback: If clicking anything inside workshop-card or with text 'Ver Revisões'
        const target = e.target as HTMLElement;
        if (target.closest('#workshop-card') || target.innerText?.includes('Ver Revisões')) {
            console.log('Global trigger: Opening workshop modal');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    // Close on ESC
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            smoothCloseModal(modal);
        }
    });
};

// ─── NOVIDADES Section ──────────────────────────────────
const renderNovidades = async () => {
  const section = document.getElementById('novidades');
  const grid = document.getElementById('novidades-grid');
  if (!section || !grid) return;

  const newProducts = await getNewProducts(8);

  // Se não houver novidades, ocultar a seção
  if (newProducts.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  // Centralizar se houver apenas 1 item
  if (newProducts.length === 1) {
    grid.style.justifyContent = 'center';
    const carouselWrapper = section.querySelector('.novidades-carousel-wrapper') as HTMLElement;
    if (carouselWrapper) {
      carouselWrapper.classList.add('no-nav');
    }
  } else {
    grid.style.justifyContent = 'flex-start';
    const carouselWrapper = section.querySelector('.novidades-carousel-wrapper') as HTMLElement;
    if (carouselWrapper) {
      carouselWrapper.classList.remove('no-nav');
    }
  }

  grid.innerHTML = newProducts.map(product => `
    <div class="novidade-card" data-product-name="${product.name}">
      <div class="novidade-card-image ${(product as any).studioBackground ? 'studio-mode' : ''}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <div class="novo-badge">NOVO</div>
        <div class="novidade-card-badges">
          ${(product.categories || [product.category]).map((c: string) => 
            `<div class="product-badge">${c}</div>`
          ).join('')}
        </div>
      </div>
      <div class="novidade-card-info">
        <h3>${product.name}</h3>
        <span class="novidade-card-brand">${(product.categories || [product.category])[0]}</span>
        <div class="novidade-card-price">
          ${product.onSale ? `
            <span class="original-price">R$ ${product.originalPrice}</span>
            <span class="current-price">R$ ${product.price}</span>
          ` : `
            <span class="current-price">R$ ${product.price || 'Sob consulta'}</span>
          `}
        </div>
        <div class="novidade-card-cta">
          <span class="novidade-view-btn">
            Ver detalhes <span class="arrow-icon">→</span>
          </span>
        </div>
      </div>
    </div>
  `).join('');

  // Click to open product modal
  grid.querySelectorAll('.novidade-card').forEach(card => {
    card.addEventListener('click', () => {
      const name = (card as HTMLElement).dataset.productName;
      const product = newProducts.find(p => p.name === name);
      if (product) openProductModal(product);
    });
  });

  // Carousel Navigation
  const prevBtn = document.getElementById('novidades-prev');
  const nextBtn = document.getElementById('novidades-next');
  const scrollAmount = 330; // card width + gap

  prevBtn?.addEventListener('click', () => {
    grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  nextBtn?.addEventListener('click', () => {
    grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  // Re-trigger reveal for new elements
  setTimeout(handleReveal, 100);
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Loaded - Initializing site...');
  initNav();
  await renderNovidades();
  await renderProducts();
  setupMobileMenu();
  setupHeader();
  setupFilters();
  setupWorkshopModal();
  setupProductModalEvents();
  initFeedback();
  
  // Initial check for reveals
  handleReveal();
  window.addEventListener('scroll', handleReveal);
  console.log('All components initialized.');
});
