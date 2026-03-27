import './style.css'
import { getProducts } from './store'
import { initNav } from './nav'

// Load Products
const renderProducts = (categoryFilter?: string) => {
  const grid = document.getElementById('bikes-grid');
  if (!grid) return;

  let products = getProducts();
  
  if (categoryFilter) {
    // Exact match filter when category is selected
    products = products.filter(p => p.category === categoryFilter);
  } else {
    // By default (home view), show only promotions as requested
    products = products.filter(p => p.onSale);
  }

  grid.innerHTML = products.map(product => `
    <div class="product-card reveal">
      ${(product as any).seguro ? '<div class="seguro-seal"><span class="seal-icon">🔒</span><span class="seal-text">14 MESES<br>SEGURO GRÁTIS</span></div>' : ''}
      <div class="product-image ${(product as any).studioBackground ? 'studio-mode' : ''}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-badge">${product.category}</div>
        ${product.onSale ? '<div class="promo-badge">PROMOÇÃO</div>' : ''}
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <div class="product-description">
          <p>${product.description}</p>
        </div>
        <div class="product-price">
          ${product.onSale ? `
            <span class="original-price">R$ ${product.originalPrice}</span>
            <span class="current-price">R$ ${product.price}</span>
          ` : `
            <span class="current-price">R$ ${product.price || 'Sob consulta'}</span>
          `}
        </div>
        <button class="btn btn-detail toggle-details">
          Ver Detalhes
          <span class="btn-icon">→</span>
        </button>
      </div>
    </div>
  `).join('');
  
  // Add expansion logic
  grid.querySelectorAll('.toggle-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const card = (e.target as HTMLElement).closest('.product-card');
        if (!card) return;
        
        const isExpanded = card.classList.toggle('expanded');
        const btnText = btn.childNodes[0];
        if (btnText) {
            btnText.textContent = isExpanded ? 'Fechar ' : 'Ver Detalhes ';
        }
        // Update arrow
        const icon = btn.querySelector('.btn-icon');
        if (icon) icon.textContent = isExpanded ? '↑' : '→';
    });
  });

  // Re-trigger reveal for new elements
  setTimeout(handleReveal, 100);
};

// Category Filtering Setup

const setupFilters = () => {
  const cards = document.querySelectorAll('.category-card');
  cards.forEach(card => {
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
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Loaded - Initializing site...');
  initNav();
  renderProducts();
  setupMobileMenu();
  setupHeader();
  setupFilters();
  setupWorkshopModal();
  
  // Initial check for reveals
  handleReveal();
  window.addEventListener('scroll', handleReveal);
  console.log('All components initialized.');
});

