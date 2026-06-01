import { getProducts, formatPrice } from './store';

export const initSearch = () => {
    // Inject Search UI if it doesn't exist
    let searchOverlay = document.getElementById('search-overlay');
    
    if (!searchOverlay) {
        const overlayHTML = `
            <div id="search-overlay" class="search-overlay">
                <div class="search-container">
                    <div class="search-header">
                        <span class="search-icon">🔍</span>
                        <input type="text" id="search-input" placeholder="O que você está buscando? (ex: colli, oggi, speed...)" autocomplete="off">
                        <button id="search-close" class="search-close">&times;</button>
                    </div>
                    <div id="search-results" class="search-results">
                        <div class="search-initial-msg">Digite algo para começar a buscar...</div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', overlayHTML);
        searchOverlay = document.getElementById('search-overlay');
    }

    const searchInput = document.getElementById('search-input') as HTMLInputElement;
    const searchResults = document.getElementById('search-results') as HTMLElement;
    const searchClose = document.getElementById('search-close') as HTMLButtonElement;
    const searchToggles = document.querySelectorAll('.search-toggle');

    if (!searchOverlay || !searchInput || !searchResults || !searchClose) return;

    // Open Search
    searchToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            searchOverlay!.classList.add('active');
            setTimeout(() => searchInput.focus(), 100);
            document.body.style.overflow = 'hidden';
        });
    });

    // Close Search
    const closeSearch = () => {
        searchOverlay!.classList.remove('active');
        document.body.style.overflow = 'auto';
        searchInput.value = '';
        searchResults.innerHTML = '<div class="search-initial-msg">Digite algo para começar a buscar...</div>';
    };

    searchClose.addEventListener('click', closeSearch);
    
    // Close on Escape or click outside
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchOverlay!.classList.contains('active')) {
            closeSearch();
        }
    });

    searchOverlay.addEventListener('click', (e) => {
        if (e.target === searchOverlay) {
            closeSearch();
        }
    });

    // Handle Input and Filtering
    let debounceTimer: ReturnType<typeof setTimeout>;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = (e.target as HTMLInputElement).value.trim().toLowerCase();

        if (query.length < 2) {
            searchResults.innerHTML = '<div class="search-initial-msg">Digite algo para começar a buscar...</div>';
            return;
        }

        debounceTimer = setTimeout(async () => {
            searchResults.innerHTML = '<div class="search-loading"><div class="spinner"></div> Buscando...</div>';
            
            try {
                const products = await getProducts();
                const filtered = products.filter(p => {
                    const nameMatch = p.name.toLowerCase().includes(query);
                    const brandMatch = p.brand ? p.brand.toLowerCase().includes(query) : false;
                    const catMatch = p.category ? p.category.toLowerCase().includes(query) : false;
                    const subcatMatch = p.subcategory ? p.subcategory.toLowerCase().includes(query) : false;
                    
                    return nameMatch || brandMatch || catMatch || subcatMatch;
                });

                if (filtered.length === 0) {
                    searchResults.innerHTML = `
                        <div class="search-no-results">
                            <span>🚲</span>
                            <p>Nenhum produto encontrado para "<strong>${query}</strong>"</p>
                        </div>
                    `;
                    return;
                }

                searchResults.innerHTML = filtered.map(p => `
                    <a href="products.html?category=${encodeURIComponent(p.category || '')}" class="search-item">
                        <div class="search-item-img">
                            <img src="${p.image}" alt="${p.name}">
                        </div>
                        <div class="search-item-info">
                            <h4>${p.name}</h4>
                            <div class="search-item-meta">
                                <span class="search-item-cat">${p.category || p.brand || ''}</span>
                                ${p.onSale ? '<span class="search-promo-badge">Promoção</span>' : ''}
                            </div>
                            <div class="search-item-price">${formatPrice(p.price)}</div>
                        </div>
                    </a>
                `).join('');

                // Add click listener to close modal after clicking a result
                searchResults.querySelectorAll('.search-item').forEach(item => {
                    item.addEventListener('click', () => {
                        closeSearch();
                    });
                });

            } catch (err) {
                searchResults.innerHTML = '<div class="search-error">Erro ao buscar produtos. Tente novamente.</div>';
            }
        }, 300);
    });
};
