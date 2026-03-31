import { getProducts } from './store';
import type { Product } from './store';
import { initNav } from './nav';

const renderApparel = async (subcategory?: string) => {
    const grid = document.getElementById('vestuario-grid');
    const title = document.getElementById('category-title');
    if (!grid || !title) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Sincronizando produtos de vestuário...</div>';

    // Filter products by category 'Vestuário' and optional subcategory
    const allProducts = await getProducts();
    let filtered = allProducts.filter((p: Product) => p.category === 'Vestuário');
    
    if (subcategory) {
        filtered = filtered.filter((p: Product) => p.subcategory === subcategory);
        title.innerHTML = `VESTUÁRIO <span class="highlight">${subcategory.toUpperCase()}</span>`;
    } else {
        title.innerHTML = `NOSSO <span class="highlight">VESTUÁRIO</span>`;
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 50px;">Nenhum item encontrado nesta categoria.</p>';
        return;
    }

    grid.innerHTML = filtered.map((product: Product) => `
        <div class="product-card reveal">
            ${product.seguro ? '<div class="seguro-seal"><span class="seal-icon">🔒</span><span class="seal-text">14 MESES<br>SEGURO GRÁTIS</span></div>' : ''}
            <div class="product-image ${product.studioBackground ? 'studio-mode' : ''}">
                <img src="${product.image}" alt="${product.name}">
                ${product.onSale ? '<span class="promo-badge">Oferta</span>' : ''}
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
        });
    });
};


const setupApparelFilters = () => {
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            const sub = card.getAttribute('data-category');
            
            if (card.classList.contains('active')) {
                card.classList.remove('active');
                renderApparel();
            } else {
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                renderApparel(sub || undefined);
                
                // Scroll to products
                document.getElementById('vestuario-section')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await renderApparel();
    setupApparelFilters();
    initNav();
});
