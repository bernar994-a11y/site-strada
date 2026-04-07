import './style.css'
import { getProducts } from './store'
import { initNav } from './nav'

// Load Products
const renderProducts = async (categoryFilter?: string) => {
  const grid = document.getElementById('bikes-grid');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Configurando conexão com Supabase...</div>';

  let products = await getProducts();
  
  if (categoryFilter) {
    // Match any category inside the categories array or fallback to primary category
    products = products.filter(p => p.categories?.includes(categoryFilter) || p.category === categoryFilter);
  } else {
    // By default (home view), show only promotions as requested
    products = products.filter(p => p.onSale);
  }

  grid.innerHTML = products.map(product => `
    <div class="product-card reveal">
      ${(product as any).seguro ? '<div class="seguro-seal"><span class="seal-icon">🛡️</span><span class="seal-text">14 MESES<br>SEGURO GRÁTIS</span></div>' : ''}
      <div class="product-image ${(product as any).studioBackground ? 'studio-mode' : ''}">
        <img src="${product.image}" alt="${product.name}">
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
  
  // Add product modal trigger
  grid.querySelectorAll('.open-product-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest('.product-card');
        const nameElement = card?.querySelector('h3');
        if (!nameElement) return;
        const product = products.find(p => p.name === nameElement.textContent);
        if (product) openProductModal(product);
    });
  });

  // Re-trigger reveal for new elements
  setTimeout(handleReveal, 100);
};

// Category Filtering Setup (Home Page Only)
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

const setupProductModalEvents = () => {
    const modal = document.getElementById('product-modal');
    const closeBtns = document.querySelectorAll('.close-product-modal');

    closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal && modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
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
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
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
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Loaded - Initializing site...');
  initNav();
  await renderProducts();
  setupMobileMenu();
  setupHeader();
  setupFilters();
  setupWorkshopModal();
  setupProductModalEvents();
  
  // Initial check for reveals
  handleReveal();
  window.addEventListener('scroll', handleReveal);
  console.log('All components initialized.');
});

