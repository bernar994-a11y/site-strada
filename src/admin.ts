// src/admin.ts
import { getProducts, deleteProduct, updateProduct, addProduct } from './store';
import type { Product } from './store';

const BIKE_CATS = ['Uso Urbano', 'Mountain Bike', 'Speed', 'Bikes Elétricas', 'Bike Infantil'];

// ─── State ───────────────────────────────────────────────
let activeFilter = 'all';
let searchTerm = '';
let currentImageUrl = '';

// ─── Auth ────────────────────────────────────────────────
const checkAuth = () => {
    if (sessionStorage.getItem('strada_admin_logged') === 'true') {
        document.getElementById('login-screen')!.style.display = 'none';
        document.getElementById('admin-dashboard')!.style.display = 'block';
        renderAll();
    }
};

document.getElementById('login-btn')?.addEventListener('click', () => {
    const pass = (document.getElementById('admin-password') as HTMLInputElement).value;
    if (pass === 'strada2026') {
        sessionStorage.setItem('strada_admin_logged', 'true');
        checkAuth();
    } else {
        document.getElementById('login-error')!.style.display = 'block';
    }
});

// Enter key on password field
document.getElementById('admin-password')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('login-btn')?.click();
});

// ─── KPI ─────────────────────────────────────────────────
const updateKPIs = (products: Product[]) => {
    const bikes = products.filter(p => BIKE_CATS.includes(p.category));
    const apparel = products.filter(p => p.category === 'Vestuário');
    const onSale = products.filter(p => p.onSale);

    (document.getElementById('kpi-total') as HTMLElement).textContent = String(products.length);
    (document.getElementById('kpi-bikes') as HTMLElement).textContent = String(bikes.length);
    (document.getElementById('kpi-apparel') as HTMLElement).textContent = String(apparel.length);
    (document.getElementById('kpi-sale') as HTMLElement).textContent = String(onSale.length);
};

// ─── Filter + Search ─────────────────────────────────────
const getFilteredProducts = (): Product[] => {
    let products = getProducts();

    if (activeFilter === 'bikes') {
        products = products.filter(p => BIKE_CATS.includes(p.category));
    } else if (activeFilter === 'apparel') {
        products = products.filter(p => p.category === 'Vestuário');
    } else if (activeFilter === 'accessories') {
        products = products.filter(p => p.category === 'Acessórios');
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        products = products.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term)
        );
    }

    return products;
};

// ─── Render Table ─────────────────────────────────────────
const renderAdminProducts = () => {
    const list = document.getElementById('admin-product-list');
    if (!list) return;

    const allProducts = getProducts();
    updateKPIs(allProducts);

    const filtered = getFilteredProducts();

    if (filtered.length === 0) {
        list.innerHTML = `<tr><td colspan="5"><div class="empty-state"><span class="emoji">🔍</span>Nenhum produto encontrado.</div></td></tr>`;
        return;
    }

    list.innerHTML = filtered.map(p => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${p.image}" class="prod-img" onerror="this.src='/src/assets/bike-1.png'">
                    <div>
                        <div class="prod-name">${p.name}</div>
                        <div class="prod-subtitle">${p.subcategory ? p.subcategory : '—'}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-cat">${p.category}</span></td>
            <td>
                ${p.onSale && p.originalPrice ? `<span style="color:var(--text-muted);text-decoration:line-through;font-size:0.8rem;">R$ ${p.originalPrice}</span><br>` : ''}
                <strong>R$ ${p.price || 'Sob consulta'}</strong>
            </td>
            <td>${p.onSale ? '<span class="badge badge-sale">🔥 Promoção</span>' : '<span class="badge badge-normal">Normal</span>'}</td>
            <td>
                <div class="actions">
                    <button class="btn-icon-only btn-edit edit-btn" data-id="${p.id}">✏️ Editar</button>
                    <button class="btn-icon-only btn-del delete-btn" data-id="${p.id}">🗑️ Excluir</button>
                </div>
            </td>
        </tr>
    `).join('');

    // Delete
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt((e.target as HTMLElement).dataset.id!);
            if (confirm('Tem certeza que deseja excluir este produto?')) {
                deleteProduct(id);
                renderAdminProducts();
            }
        });
    });

    // Edit
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt((e.target as HTMLElement).dataset.id!);
            const product = getProducts().find(p => p.id === id);
            if (product) openForm(product);
        });
    });
};

const renderAll = () => renderAdminProducts();

// ─── Filter Tabs ──────────────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = (tab as HTMLElement).dataset.filter || 'all';
        renderAdminProducts();
    });
});

// ─── Search ───────────────────────────────────────────────
document.getElementById('search-input')?.addEventListener('input', (e) => {
    searchTerm = (e.target as HTMLInputElement).value;
    renderAdminProducts();
});

// ─── Helper: Base64 ───────────────────────────────────────
const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

// ─── Form ─────────────────────────────────────────────────
const formModal = document.getElementById('form-modal')!;
const addBtn = document.getElementById('add-product-btn')!;
const cancelBtn = document.getElementById('cancel-btn')!;
const closeBtn = document.getElementById('form-close-btn')!;
const onsaleCheckbox = document.getElementById('p-onsale') as HTMLInputElement;
const originalPriceInput = document.getElementById('p-original-price') as HTMLInputElement;
const fileInput = document.getElementById('p-image') as HTMLInputElement;
const previewImg = document.getElementById('p-preview') as HTMLImageElement;
const categorySelect = document.getElementById('p-category') as HTMLSelectElement;
const subcategoryGroup = document.getElementById('subcategory-group')!;
const seguroCheckbox = document.getElementById('p-seguro') as HTMLInputElement;
const studioCheckbox = document.getElementById('p-studio') as HTMLInputElement;

const openModal = () => { formModal.classList.add('active'); document.body.style.overflow = 'hidden'; };
const closeModal = () => { formModal.classList.remove('active'); document.body.style.overflow = 'auto'; };

const openForm = (product?: Product) => {
    currentImageUrl = '';
    previewImg.style.display = 'none';
    subcategoryGroup.style.display = 'none';

    if (product) {
        (document.getElementById('form-title') as HTMLElement).innerText = 'Editar Produto';
        (document.getElementById('product-id') as HTMLInputElement).value = product.id.toString();
        (document.getElementById('p-name') as HTMLInputElement).value = product.name;
        categorySelect.value = product.category;
        (document.getElementById('p-desc') as HTMLTextAreaElement).value = product.description;
        (document.getElementById('p-price') as HTMLInputElement).value = (product.price || '').toString();

        if (product.category === 'Vestuário') {
            subcategoryGroup.style.display = 'block';
            if (product.subcategory) {
                (document.getElementById('p-subcategory') as HTMLSelectElement).value = product.subcategory;
            }
        }

        currentImageUrl = product.image;
        if (currentImageUrl) {
            previewImg.src = currentImageUrl;
            previewImg.style.display = 'block';
        }

        onsaleCheckbox.checked = !!product.onSale;
        originalPriceInput.value = (product.originalPrice || '').toString();
        originalPriceInput.style.display = product.onSale ? 'block' : 'none';
        seguroCheckbox.checked = !!product.seguro;
        studioCheckbox.checked = !!product.studioBackground;
    } else {
        (document.getElementById('form-title') as HTMLElement).innerText = 'Adicionar Produto';
        (document.getElementById('save-product-form') as HTMLFormElement).reset();
        (document.getElementById('product-id') as HTMLInputElement).value = '';
        originalPriceInput.style.display = 'none';
        seguroCheckbox.checked = false;
        studioCheckbox.checked = false;
    }

    openModal();
};

addBtn.addEventListener('click', () => openForm());
cancelBtn.addEventListener('click', closeModal);
closeBtn.addEventListener('click', closeModal);
formModal.addEventListener('click', (e) => { if (e.target === formModal) closeModal(); });

onsaleCheckbox.addEventListener('change', () => {
    originalPriceInput.style.display = onsaleCheckbox.checked ? 'block' : 'none';
});

categorySelect.addEventListener('change', () => {
    subcategoryGroup.style.display = categorySelect.value === 'Vestuário' ? 'block' : 'none';
});

// Image preview
fileInput.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files[0]) {
        const base64 = await toBase64(fileInput.files[0]);
        previewImg.src = base64;
        previewImg.style.display = 'block';
        currentImageUrl = base64;
    }
});

// Submit
document.getElementById('save-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = (document.getElementById('product-id') as HTMLInputElement).value;
    const cat = categorySelect.value;

    const productData: any = {
        name: (document.getElementById('p-name') as HTMLInputElement).value,
        category: cat,
        description: (document.getElementById('p-desc') as HTMLTextAreaElement).value,
        price: parseFloat((document.getElementById('p-price') as HTMLInputElement).value),
        image: currentImageUrl || '/src/assets/bike-1.png',
        onSale: onsaleCheckbox.checked,
        originalPrice: onsaleCheckbox.checked ? parseFloat(originalPriceInput.value) : undefined,
        subcategory: cat === 'Vestuário' ? (document.getElementById('p-subcategory') as HTMLSelectElement).value : undefined,
        seguro: seguroCheckbox.checked,
        studioBackground: studioCheckbox.checked
    };

    if (id) {
        updateProduct({ ...productData, id: parseInt(id) });
    } else {
        addProduct(productData);
    }

    closeModal();
    renderAdminProducts();
});

// ─── Logout ───────────────────────────────────────────────
const doLogout = () => {
    sessionStorage.removeItem('strada_admin_logged');
    window.location.reload();
};
document.getElementById('logout-btn')?.addEventListener('click', doLogout);
document.getElementById('logout-btn-side')?.addEventListener('click', doLogout);

// ─── Init ─────────────────────────────────────────────────
checkAuth();
