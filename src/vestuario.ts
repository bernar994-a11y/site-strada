import { getProducts, getLoaderHTML } from './store';
import type { Product } from './store';
import { initNav } from './nav';
import { initFeedback } from './feedback';

const renderApparel = async (modality?: string, type?: string) => {
    const grid = document.getElementById('vestuario-grid');
    const title = document.getElementById('category-title');
    if (!grid || !title) return;

    grid.innerHTML = `<div style="grid-column: 1/-1; display: flex; justify-content: center; padding: 60px;">${getLoaderHTML('Sincronizando tendências...')}</div>`;

    // Filter products by category 'Vestuário'
    const allProducts = await getProducts();
    let filtered = allProducts.filter((p: Product) => p.categories?.includes('Vestuário') || p.category === 'Vestuário');
    
    // Primary Filter: Modality (from Cards)
    if (modality && modality !== 'all') {
        filtered = filtered.filter((p: Product) => p.subcategory?.includes(modality));
    }

    // Secondary Filter: Type (from Buttons)
    if (type && type !== 'all') {
        filtered = filtered.filter((p: Product) => p.subcategory?.includes(type));
    }

    // Update Title
    if ((!modality || modality === 'all') && (!type || type === 'all')) {
        title.innerHTML = `TODO O <span class="highlight">VESTUÁRIO</span>`;
    } else {
        const modText = modality && modality !== 'all' ? modality.toUpperCase() : '';
        const typeText = type && type !== 'all' ? `${type.toUpperCase()}S` : '';
        title.innerHTML = `VESTUÁRIO <span class="highlight">${modText} ${typeText}</span>`.trim();
    }

    if (filtered.length === 0) {
        const message = (modality || type)
            ? 'Nenhum item encontrado com estes filtros.'
            : 'Nenhum item de vestuário disponível no momento.';
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 50px;">${message}</p>`;
        return;
    }

    grid.innerHTML = filtered.map((product: Product) => `
        <div class="product-card reveal">
            ${product.seguro ? '<div class="seguro-seal"><span class="seal-icon">🛡️</span><span class="seal-text">14 MESES<br>SEGURO GRÁTIS</span></div>' : ''}
            <div class="product-image ${product.studioBackground ? 'studio-mode' : ''}">
                <img src="${product.image}" alt="${product.name}">
                ${product.onSale ? '<span class="promo-badge">Oferta</span>' : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <div class="product-description" style="display: none;">
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
            const product = filtered.find(p => p.name === nameElement.textContent);
            if (product) openProductModal(product);
        });
    });
};

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


const setupApparelFilters = () => {
    const cards = document.querySelectorAll('.category-card');
    const filterBtns = document.querySelectorAll('#filter-subcategory .filter-btn');

    let currentModality: string | null = null;
    let currentType: string | null = null;

    const applyFilters = () => {
        renderApparel(currentModality || undefined, currentType || undefined);
    };

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const sub = card.getAttribute('data-category');
            
            if (card.classList.contains('active')) {
                card.classList.remove('active');
                currentModality = null;
            } else {
                cards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                currentModality = sub;
                
                // Scroll to products
                document.getElementById('vestuario-section')?.scrollIntoView({ behavior: 'smooth' });
            }
            applyFilters();
        });
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sub = btn.getAttribute('data-sub');
            
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentType = sub === 'all' ? null : sub;
            applyFilters();
            
            // Scroll to products grid but a bit above to see the title
            const target = document.getElementById('category-title');
            if (target && sub !== 'all') {
                const offset = 120;
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = target.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await renderApparel();
    setupApparelFilters();
    setupProductModalEvents();
    initNav();
    initFeedback();
});
