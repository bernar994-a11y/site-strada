import './style.css'
import { getProducts } from './store'
import { initNav } from './nav'

const renderProducts = () => {
  const grid = document.getElementById('products-grid');
  const titleElement = document.getElementById('page-title');
  if (!grid) return;

  // Get category from URL
  const urlParams = new URLSearchParams(window.location.search);
  const categoryFilter = urlParams.get('category');

  if (categoryFilter && titleElement) {
    titleElement.innerHTML = `${categoryFilter} <span class="highlight">Strada</span>`;
  }

  let products = getProducts();
  
  if (categoryFilter) {
    products = products.filter(p => p.category === categoryFilter);
  }

  grid.innerHTML = products.map(product => `
    <div class="product-card reveal active">
      ${(product as any).seguro ? '<div class="seguro-seal"><span class="seal-icon">🔒</span><span class="seal-text">14 MESES<br>SEGURO GRÁTIS</span></div>' : ''}
      <div class="product-image ${(product as any).studioBackground ? 'studio-mode' : ''}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-badge">${product.category}</div>
        ${product.onSale ? '<div class="promo-badge">PROMOÇÃO</div>' : ''}
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-price">
          ${product.onSale ? `
            <span class="original-price">R$ ${product.originalPrice}</span>
            <span class="current-price">R$ ${product.price}</span>
          ` : `
            <span class="current-price">R$ ${product.price || 'Sob consulta'}</span>
          `}
        </div>
        <button class="btn btn-detail">
          Ver Detalhes
          <span class="btn-icon">→</span>
        </button>
      </div>
    </div>
  `).join('');
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

document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  setupMobileMenu();
  initNav();
});
