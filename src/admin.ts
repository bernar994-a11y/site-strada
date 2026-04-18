import { getProducts, deleteProduct, updateProduct, addProduct } from './store';
import type { Product } from './store';
import { removeBackground } from '@imgly/background-removal';

const BIKE_CATS = ['Uso Urbano', 'Mountain Bike', 'Speed', 'Bikes Elétricas', 'Bike Infantil'];

// ─── State ───────────────────────────────────────────────
let activeFilter = 'all';
let searchTerm = '';
let currentImageUrl = '';
let colorVariants: { id: number; name: string; hex: string; image: string }[] = [];
let cropper: any = null;
let currentCropTarget: 'main' | number | null = null;

// ─── Auth ────────────────────────────────────────────────
const checkAuth = async () => {
    if (sessionStorage.getItem('strada_admin_logged') === 'true') {
        document.getElementById('login-screen')!.style.display = 'none';
        document.getElementById('admin-dashboard')!.style.display = 'block';
        await renderAll();
    }
};

document.getElementById('login-btn')?.addEventListener('click', async () => {
    const pass = (document.getElementById('admin-password') as HTMLInputElement).value;
    if (pass === 'strada2026') {
        sessionStorage.setItem('strada_admin_logged', 'true');
        await checkAuth();
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
    const bikes = products.filter(p => p.categories?.some(c => BIKE_CATS.includes(c)) || BIKE_CATS.includes(p.category));
    const apparel = products.filter(p => p.categories?.includes('Vestuário') || p.category === 'Vestuário');
    const onSale = products.filter(p => p.onSale);
    const newItems = products.filter(p => p.isNew);

    (document.getElementById('kpi-total') as HTMLElement).textContent = String(products.length);
    (document.getElementById('kpi-bikes') as HTMLElement).textContent = String(bikes.length);
    (document.getElementById('kpi-apparel') as HTMLElement).textContent = String(apparel.length);
    (document.getElementById('kpi-sale') as HTMLElement).textContent = String(onSale.length);
    (document.getElementById('kpi-new') as HTMLElement).textContent = String(newItems.length);
};

// ─── Filter + Search ─────────────────────────────────────
const getFilteredProducts = async (): Promise<Product[]> => {
    let products = await getProducts();

    if (activeFilter === 'bikes') {
        products = products.filter(p => p.categories?.some(c => BIKE_CATS.includes(c)) || BIKE_CATS.includes(p.category));
    } else if (activeFilter === 'apparel') {
        products = products.filter(p => p.categories?.includes('Vestuário') || p.category === 'Vestuário');
    } else if (activeFilter === 'accessories') {
        products = products.filter(p => p.categories?.includes('Acessórios') || p.category === 'Acessórios');
    } else if (activeFilter === 'novidades') {
        products = products.filter(p => p.isNew);
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        products = products.filter(p => {
            const matchName = p.name.toLowerCase().includes(term);
            const matchOldCat = p.category.toLowerCase().includes(term);
            const matchCatArray = p.categories?.some(c => c.toLowerCase().includes(term));
            return matchName || matchOldCat || matchCatArray;
        });
    }

    return products;
};

// ─── Render Table ─────────────────────────────────────────
const renderAdminProducts = async () => {
    const list = document.getElementById('admin-product-list');
    if (!list) return;
    
    list.innerHTML = `<tr><td colspan="5"><div style="text-align: center; padding: 40px; color: var(--text-muted);">Sincronizando com o Supabase...</div></td></tr>`;

    const allProducts = await getProducts();
    updateKPIs(allProducts);

    const filtered = await getFilteredProducts();

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
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    ${(p.categories || [p.category]).map(c => `<span class="badge badge-cat">${c}</span>`).join('')}
                </div>
            </td>
            <td>
                ${p.onSale && p.originalPrice ? `<span style="color:var(--text-muted);text-decoration:line-through;font-size:0.8rem;">R$ ${p.originalPrice}</span><br>` : ''}
                <strong>R$ ${p.price || 'Sob consulta'}</strong>
            </td>
            <td>${p.onSale ? '<span class="badge badge-sale">🔥 Promoção</span>' : '<span class="badge badge-normal">Normal</span>'}${p.isNew ? ' <span class="badge" style="background: rgba(155,89,182,0.15); color: #9b59b6;">⭐ Novo</span>' : ''}</td>
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
        btn.addEventListener('click', async (e) => {
            const id = parseInt((e.target as HTMLElement).dataset.id!);
            if (confirm('Tem certeza que deseja excluir este produto do Banco de Dados?')) {
                await deleteProduct(id);
                await renderAdminProducts();
            }
        });
    });

    // Edit
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt((e.target as HTMLElement).dataset.id!);
            const products = await getProducts();
            const product = products.find(p => p.id === id);
            if (product) openForm(product);
        });
    });
};

const renderAll = async () => await renderAdminProducts();

// ─── Filter Tabs ──────────────────────────────────────────
document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = (tab as HTMLElement).dataset.filter || 'all';
        await renderAdminProducts();
    });
});

// ─── Search ───────────────────────────────────────────────
document.getElementById('search-input')?.addEventListener('input', async (e) => {
    searchTerm = (e.target as HTMLInputElement).value;
    await renderAdminProducts();
});

// ─── Form ─────────────────────────────────────────────────
const formModal = document.getElementById('form-modal')!;
const addBtn = document.getElementById('add-product-btn')!;
const cancelBtn = document.getElementById('cancel-btn')!;
const closeBtn = document.getElementById('form-close-btn')!;
const onsaleCheckbox = document.getElementById('p-onsale') as HTMLInputElement;
const originalPriceInput = document.getElementById('p-original-price') as HTMLInputElement;
const fileInput = document.getElementById('p-image') as HTMLInputElement;
const previewImg = document.getElementById('p-preview') as HTMLImageElement;
const categoryCheckboxes = document.querySelectorAll('.cat-checkbox') as NodeListOf<HTMLInputElement>;
const subcategoryGroup = document.getElementById('subcategory-group')!;
const seguroCheckbox = document.getElementById('p-seguro') as HTMLInputElement;
const isNewCheckbox = document.getElementById('p-isnew') as HTMLInputElement;
const brandSelect = document.getElementById('p-brand') as HTMLSelectElement;
const qualitySelect = document.getElementById('p-quality') as HTMLSelectElement;
const studioCheckbox = document.getElementById('p-studio') as HTMLInputElement;
const videoInput = document.getElementById('p-video') as HTMLInputElement;
const videoFileInput = document.getElementById('p-video-file') as HTMLInputElement;
const videoStatus = document.getElementById('video-upload-status')!;
const videoProgressContainer = document.getElementById('video-compress-progress-container')!;
const videoProgressBar = document.getElementById('video-compress-bar')!;

const renderColorVariants = () => {
    const container = document.getElementById('color-variants-container')!;
    container.innerHTML = colorVariants.map((v) => `
        <div class="variant-row" style="display: flex; gap: 10px; align-items: center; background: rgba(255,255,255,0.02); padding: 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="flex: 1;">
                <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 5px;">Nome da Cor</label>
                <input type="text" class="var-name" data-id="${v.id}" value="${v.name}" placeholder="Ex: Vermelho" style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid var(--gray-medium); background: var(--bg-dark); color: white;">
            </div>
            <div style="width: 60px;">
                <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 5px;">Cor</label>
                <input type="color" class="var-hex" data-id="${v.id}" value="${v.hex}" style="width: 100%; height: 35px; border: none; background: none; cursor: pointer;">
            </div>
            <div style="flex: 1;">
                <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 5px;">Foto Específica</label>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="file" class="var-img-input" data-id="${v.id}" accept="image/*" style="flex: 1; padding: 5px; font-size: 0.8rem; background: var(--bg-dark);">
                    <img class="var-preview" data-id="${v.id}" src="${v.image}" style="width: 35px; height: 35px; object-fit: cover; border-radius: 4px; display: ${v.image ? 'block' : 'none'}; border: 1px solid var(--gray-medium);">
                </div>
            </div>
            <button type="button" class="btn-del btn-icon-only remove-variant-btn" data-id="${v.id}" style="margin-top: 15px; font-weight: bold; background: rgba(231, 76, 60, 0.1);">X</button>
        </div>
    `).join('');

    // Attach listeners
    container.querySelectorAll('.var-name').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = parseFloat((e.target as HTMLElement).dataset.id!);
            const variant = colorVariants.find(v => v.id === id);
            if (variant) variant.name = (e.target as HTMLInputElement).value;
        });
    });

    container.querySelectorAll('.var-hex').forEach(input => {
        input.addEventListener('input', (e) => {
            const id = parseFloat((e.target as HTMLElement).dataset.id!);
            const variant = colorVariants.find(v => v.id === id);
            if (variant) variant.hex = (e.target as HTMLInputElement).value;
        });
    });

    container.querySelectorAll('.var-img-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const fileInput = e.target as HTMLInputElement;
            const id = parseFloat(fileInput.dataset.id!);
            if (fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    openCropper(ev.target?.result as string, id);
                };
                reader.readAsDataURL(fileInput.files[0]);
                fileInput.value = '';
            }
        });
    });

    container.querySelectorAll('.remove-variant-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseFloat((e.target as HTMLElement).dataset.id!);
            colorVariants = colorVariants.filter(v => v.id !== id);
            renderColorVariants();
        });
    });
};

document.getElementById('add-color-variant-btn')?.addEventListener('click', () => {
    colorVariants.push({ id: Math.random(), name: '', hex: '#000000', image: '' });
    renderColorVariants();
});

const openModal = () => { formModal.classList.add('active'); document.body.style.overflow = 'hidden'; };
const closeModal = () => {
  formModal.classList.add('closing');
  formModal.classList.remove('active');
  document.body.style.overflow = 'auto';
  setTimeout(() => formModal.classList.remove('closing'), 300);
};

const openForm = (product?: Product) => {
    currentImageUrl = '';
    previewImg.style.display = 'none';
    subcategoryGroup.style.display = 'none';

    if (product) {
        (document.getElementById('form-title') as HTMLElement).innerText = 'Editar Produto';
        (document.getElementById('product-id') as HTMLInputElement).value = product.id.toString();
        (document.getElementById('p-name') as HTMLInputElement).value = product.name;
        
        categoryCheckboxes.forEach(cb => {
            if (product.categories) {
                cb.checked = product.categories.includes(cb.value);
            } else {
                cb.checked = cb.value === product.category;
            }
        });

        (document.getElementById('p-desc') as HTMLTextAreaElement).value = product.description;
        (document.getElementById('p-price') as HTMLInputElement).value = (product.price || '').toString();

        const hasVestuario = product.categories?.includes('Vestuário') || product.category === 'Vestuário';
        if (hasVestuario) {
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
        isNewCheckbox.checked = !!product.isNew;
        brandSelect.value = product.brand || '';
        qualitySelect.value = product.quality || 'Intermediária';
        studioCheckbox.checked = !!product.studioBackground;
        videoInput.value = product.video || '';

        colorVariants = product.colors ? product.colors.map(c => ({ id: Math.random(), ...c })) : [];
    } else {
        (document.getElementById('form-title') as HTMLElement).innerText = 'Adicionar Produto';
        (document.getElementById('save-product-form') as HTMLFormElement).reset();
        (document.getElementById('product-id') as HTMLInputElement).value = '';
        originalPriceInput.style.display = 'none';
        seguroCheckbox.checked = false;
        isNewCheckbox.checked = false;
        brandSelect.value = '';
        qualitySelect.value = 'Intermediária';
        studioCheckbox.checked = false;
        colorVariants = [];
    }
    
    renderColorVariants();
    openModal();
};

addBtn.addEventListener('click', () => openForm());
cancelBtn.addEventListener('click', closeModal);
closeBtn.addEventListener('click', closeModal);
formModal.addEventListener('click', (e) => { if (e.target === formModal) closeModal(); });

onsaleCheckbox.addEventListener('change', () => {
    originalPriceInput.style.display = onsaleCheckbox.checked ? 'block' : 'none';
});

categoryCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
        const hasVestuario = Array.from(categoryCheckboxes).some(chk => chk.checked && chk.value === 'Vestuário');
        subcategoryGroup.style.display = hasVestuario ? 'block' : 'none';
    });
});

// ─── Cropper ──────────────────────────────────────────────
const openCropper = (imageSrc: string, target: 'main' | number) => {
    currentCropTarget = target;
    const cropperModal = document.getElementById('cropper-modal')!;
    const cropperImage = document.getElementById('cropper-image') as HTMLImageElement;
    
    cropperImage.src = imageSrc;
    cropperModal.classList.add('active');
    
    if (cropper) {
        cropper.destroy();
    }
    
    cropper = new (window as any).Cropper(cropperImage, {
        viewMode: 2,
        autoCropArea: 1,
        responsive: true,
        background: false
    });
};

document.getElementById('cropper-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('cropper-modal')?.classList.remove('active');
    if (cropper) { cropper.destroy(); cropper = null; }
    currentCropTarget = null;
});

const applyImageToTarget = (base64: string) => {
    if (currentCropTarget === 'main') {
        previewImg.src = base64;
        previewImg.style.display = 'block';
        currentImageUrl = base64;
    } else if (typeof currentCropTarget === 'number') {
        const variant = colorVariants.find(v => v.id === currentCropTarget);
        if (variant) {
            variant.image = base64;
            const container = document.getElementById('color-variants-container')!;
            const preview = container.querySelector(`.var-preview[data-id="${currentCropTarget}"]`) as HTMLImageElement;
            if (preview) {
                preview.src = base64;
                preview.style.display = 'block';
            }
        }
    }
    
    document.getElementById('cropper-modal')?.classList.remove('active');
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    currentCropTarget = null;
};

document.getElementById('cropper-save-btn')?.addEventListener('click', () => {
    if (!cropper) return;
    
    const canvas = cropper.getCroppedCanvas({
        maxWidth: 800,
        maxHeight: 800,
        fillColor: '#fff', 
    });
    
    const base64 = canvas.toDataURL('image/jpeg', 0.6);
    applyImageToTarget(base64);
});

document.getElementById('cropper-bg-rm-btn')?.addEventListener('click', async (e) => {
    if (!cropper) return;
    const btn = e.target as HTMLButtonElement;
    
    const canvas = cropper.getCroppedCanvas({
        maxWidth: 800,
        maxHeight: 800,
    });
    
    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = 'Processando IA...';
    
    try {
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((b: Blob | null) => b ? resolve(b) : reject('Falha ao extrair blob do canvas'), 'image/png');
        });
        
        const transparentBlob = await removeBackground(blob);
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const outCanvas = document.createElement('canvas');
                outCanvas.width = img.width;
                outCanvas.height = img.height;
                const ctx = outCanvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);
                const webpBase64 = outCanvas.toDataURL('image/webp', 0.8);
                applyImageToTarget(webpBase64);
            };
            img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(transparentBlob);
         
    } catch (err) {
        console.error('Erro na remoção de fundo com IA:', err);
        alert('Ocorreu um erro ao remover o fundo (IA). Tente novamente.');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
});

// Image preview (Main Product Image)
fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            openCropper(e.target?.result as string, 'main');
        };
        reader.readAsDataURL(fileInput.files[0]);
        fileInput.value = '';
    }
});

// ─── Video Compression ──────────────────────────────────
const compressVideo = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            
            // Redimensionar para 480p de largura mantendo aspecto
            const maxWidth = 640;
            const scale = Math.min(1, maxWidth / video.videoWidth);
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;

            const stream = canvas.captureStream(30);

            // Detectar melhor formato suportado
            let mimeType = 'video/webm;codecs=vp8';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/mp4;codecs=avc1';
            }
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = ''; // Deixar em branco para o browser escolher o padrão
            }

            try {
                const recorder = new MediaRecorder(stream, {
                    mimeType: mimeType || undefined,
                    videoBitsPerSecond: 1000000 // 1Mbps - Ótimo para mobile previews
                });

                const chunks: Blob[] = [];
                recorder.ondataavailable = (e) => chunks.push(e.data);
                recorder.onstop = () => {
                    const blob = new Blob(chunks, { type: mimeType || 'video/mp4' });
                    resolve(blob);
                };

                video.play();
                recorder.start();

                const draw = () => {
                    if (video.paused || video.ended) {
                        recorder.stop();
                        return;
                    }
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // Progresso aproximado
                    const progText = Math.floor((video.currentTime / video.duration) * 100);
                    videoProgressBar.style.width = `${progText}%`;
                    videoStatus.innerText = `Otimizando vídeo: ${progText}% (Formato: ${mimeType || 'Padrão'})...`;
                    
                    requestAnimationFrame(draw);
                };
                draw();
            } catch (err) {
                console.error('MediaRecorder fall back:', err);
                reject('Incompatibilidade de codec no seu navegador.');
            }
        };

        video.onerror = () => reject('Erro ao carregar vídeo para compressão.');
    });
};

// Video Upload Logic
videoFileInput.addEventListener('change', async () => {
    if (videoFileInput.files && videoFileInput.files[0]) {
        let file = videoFileInput.files[0];
        const isHeavy = file.size > 2 * 1024 * 1024; // > 2MB é pesado para vitrine

        videoStatus.style.display = 'block';
        videoStatus.style.color = 'var(--primary)';
        
        try {
            if (isHeavy) {
                try {
                    videoProgressContainer.style.display = 'block';
                    videoProgressBar.style.width = '0%';
                    const compressedBlob = await compressVideo(file);
                    file = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + (MediaRecorder.isTypeSupported('video/webm') ? ".webm" : ".mp4"), { type: compressedBlob.type });
                    videoProgressContainer.style.display = 'none';
                } catch (compressErr) {
                    console.warn('Compressão falhou, tentando upload direto:', compressErr);
                    if (file.size > 6 * 1024 * 1024) {
                        throw new Error('O vídeo é muito pesado e seu navegador não suporta compressão automática.');
                    }
                    videoStatus.innerText = 'Compressão não suportada. Enviando original...';
                    videoProgressContainer.style.display = 'none';
                }
            }

            videoStatus.innerText = 'Enviando para o servidor...';
            
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });

            // Reutilizamos a lógica de upload (que agora aceita qualquer base64)
            const uploadedUrl = await uploadImageToSupabase(base64, `product-video-${Date.now()}`);
            videoInput.value = uploadedUrl;
            videoStatus.style.color = '#2ecc71';
            videoStatus.innerText = '✅ Vídeo otimizado e enviado!';
        } catch (err: any) {
            console.error('Video upload/compress error:', err);
            videoStatus.style.color = '#e74c3c';
            videoStatus.innerText = '❌ Erro: ' + (err.message || 'Falha ao processar vídeo');
            videoProgressContainer.style.display = 'none';
        }
    }
});

// YouTube Helper
const formatVideoLink = (url: string) => {
    if (!url) return '';
    
    // YouTube
    if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
        const videoId = url.includes('youtube.com') 
            ? new URLSearchParams(new URL(url).search).get('v')
            : url.split('/').pop()?.split('?')[0];
            
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&rel=0&modestbranding=1&iv_load_policy=3`;
        }
    }
    return url;
};

// ─── Supabase Storage Helper ─────────────────────────────
const uploadImageToSupabase = async (base64: string, name: string) => {
    if (!base64.startsWith('data:image') && !base64.startsWith('data:video')) return base64; // Já é uma URL ou tipo não suportado

    const S_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
    const S_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    // Tentar Upload Direto (Bypassa limite de 4.5MB da Vercel)
    if (S_URL && S_KEY) {
        try {
            console.log(`[Admin] Iniciando upload DIRETO para Supabase: ${name}`);
            const contentType = base64.split(';')[0].split(':')[1];
            const fileExt = contentType.split('/')[1];
            const finalPath = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.${fileExt}`;
            
            // Converter base64 para Blob real
            const blob = await (await fetch(base64)).blob();

            const uploadUrl = `${S_URL}/storage/v1/object/products/${finalPath}`;
            
            const response = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'apikey': S_KEY,
                    'Authorization': `Bearer ${S_KEY}`,
                    'Content-Type': contentType
                },
                body: blob
            });

            if (response.ok) {
                const publicUrl = `${S_URL}/storage/v1/object/public/products/${finalPath}`;
                console.log('[Admin] Upload DIRETO concluído:', publicUrl);
                return publicUrl;
            } else {
                const err = await response.json();
                console.warn('[Admin] Falha no upload direto, tentando via API...', err);
            }
        } catch (err) {
            console.warn('[Admin] Erro no upload direto, tentando via API...', err);
        }
    }

    // Fallback: Upload via Vercel API (Sujeito a limite de 4.5MB)
    try {
        console.log(`[Admin] Iniciando upload via API (Fallback): ${name}`);
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image: base64, filename: name })
        });
        
        if (!response.ok) {
            if (response.status === 413) throw new Error('O vídeo é muito pesado para o servidor (Limite 4.5MB). Tente um vídeo mais curto.');
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha no upload via API');
        }

        const data = await response.json();
        return data.url;
    } catch (err: any) {
        console.error('[Admin] Erro crítico no upload:', err);
        throw err;
    }
};

// Submit
document.getElementById('save-product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('form-status')!;
    const submitBtn = (e.target as HTMLFormElement).querySelector('button[type="submit"]') as HTMLButtonElement;
    
    try {
        console.log('--- Iniciando salvamento de produto ---');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Salvando...';
        
        statusEl.style.display = 'block';
        statusEl.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        statusEl.style.color = '#fff';
        statusEl.innerText = 'Processando...';

        const id = (document.getElementById('product-id') as HTMLInputElement).value;
        const selectedCats = Array.from(categoryCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (selectedCats.length === 0) {
            throw new Error('Selecione pelo menos uma categoria.');
        }
        
        const mainCat = selectedCats[0];
        const nameVal = (document.getElementById('p-name') as HTMLInputElement).value;
        const priceVal = (document.getElementById('p-price') as HTMLInputElement).value;
        
        console.log('ID:', id || 'Novo Produto');
        console.log('Nome:', nameVal);
        console.log('Categorias:', selectedCats);
        console.log('Preço original do input:', priceVal);

        // 1. Upload Main Image if needed
        statusEl.innerText = 'Fazendo upload da imagem principal para o Supabase...';
        const finalMainImage = await uploadImageToSupabase(currentImageUrl || '/src/assets/bike-1.png', nameVal.replace(/\s+/g, '-').toLowerCase());

        // 2. Upload Variant Images if needed
        statusEl.innerText = 'Fazendo upload das variações de cores...';
        const finalVariants = await Promise.all(colorVariants.map(async (v) => ({
            name: v.name,
            hex: v.hex,
            image: await uploadImageToSupabase(v.image, `variant-${v.name.replace(/\s+/g, '-').toLowerCase()}`)
        })));

        const productData: any = {
            name: nameVal,
            category: mainCat,
            categories: selectedCats,
            description: (document.getElementById('p-desc') as HTMLTextAreaElement).value,
            price: parseFloat(priceVal),
            image: finalMainImage,
            onSale: onsaleCheckbox.checked,
            originalPrice: onsaleCheckbox.checked ? parseFloat(originalPriceInput.value) : undefined,
            subcategory: selectedCats.includes('Vestuário') ? (document.getElementById('p-subcategory') as HTMLSelectElement).value : undefined,
            seguro: seguroCheckbox.checked,
            studioBackground: studioCheckbox.checked,
            video: formatVideoLink(videoInput.value),
            colors: finalVariants.length > 0 ? finalVariants : undefined,
            isNew: isNewCheckbox.checked,
            newDate: isNewCheckbox.checked ? new Date().toISOString() : undefined,
            brand: brandSelect.value || undefined,
            quality: qualitySelect.value || 'Intermediária'
        };

        if (isNaN(productData.price)) {
            throw new Error('Preço inválido. Por favor, insira um número.');
        }

        if (id) {
            console.log('Atualizando produto existente:', id);
            await updateProduct({ ...productData, id: parseInt(id) });
        } else {
            console.log('Adicionando novo produto');
            await addProduct(productData);
        }

        console.log('Salvo com sucesso no Banco de Dados (Supabase)!');
        
        statusEl.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
        statusEl.style.color = '#2ecc71';
        statusEl.innerText = '✅ Produto salvo com sucesso!';
        
        setTimeout(() => {
            closeModal();
            renderAdminProducts();
            submitBtn.disabled = false;
            submitBtn.innerText = 'Salvar Produto';
            statusEl.style.display = 'none';
        }, 800);

    } catch (err: any) {
        console.error('ERRO AO SALVAR:', err);
        statusEl.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
        statusEl.style.color = '#e74c3c';
        statusEl.innerText = '❌ Erro: ' + err.message;
        submitBtn.disabled = false;
        submitBtn.innerText = 'Tentar Novamente';
    }
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
