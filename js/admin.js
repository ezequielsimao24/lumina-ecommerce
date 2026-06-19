   /**
 * Lumina Admin Panel
 * Dashboard com 4 abas dinamicas controlando a Home via localStorage.
 */
(function () {
    'use strict';

    const TAB_TITLES = {
        dashboard: 'Dashboard',
        catalog: 'Gestao do Catalogo',
        settings: 'Definicoes do Site',
        leads: 'Gestao de Leads'
    };

    const CATEGORY_LABELS = {
        Masculino: 'Masculino',
        Feminino: 'Feminino',
        Calcados: 'Calcados & Tenis',
        Acessorios: 'Acessorios'
    };

    const state = {
        activeTab: 'dashboard',
        editingProductId: null
    };

    const els = {
        sidebar: document.getElementById('adminSidebar'),
        sidebarOverlay: document.getElementById('sidebarOverlay'),
        sidebarToggle: document.getElementById('sidebarToggle'),
        pageTitle: document.getElementById('pageTitle'),
        refreshDataBtn: document.getElementById('refreshDataBtn'),
        toast: document.getElementById('adminToast'),
        navButtons: Array.from(document.querySelectorAll('.admin-nav-btn')),
        panels: {
            dashboard: document.getElementById('panel-dashboard'),
            catalog: document.getElementById('panel-catalog'),
            settings: document.getElementById('panel-settings'),
            leads: document.getElementById('panel-leads')
        },
        productModal: document.getElementById('productModal'),
        productModalTitle: document.getElementById('productModalTitle'),
        productForm: document.getElementById('productForm'),
        closeProductModal: document.getElementById('closeProductModal'),
        cancelProductBtn: document.getElementById('cancelProductBtn')
    };

    let toastTimer;

    // ─── Utilitarios ───────────────────────────────────────────────

    function formatPrice(value) {
        return `${Number(value || 0).toLocaleString('de-DE')} Kz`;
    }

    function formatDate(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function slugify(text) {
        return String(text || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    function parseList(value) {
        return String(value || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    }

    function showToast(message) {
        if (!els.toast) return;
        clearTimeout(toastTimer);
        els.toast.textContent = message;
        els.toast.classList.remove('hidden');
        toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2600);
    }

    function reloadData() {
        window.LuminaCatalog?.reloadProducts();
        window.LuminaStore?.reloadAll();
    }

    function getProducts() {
        return window.LuminaCatalog?.getProducts() || [];
    }

    function saveProducts(products) {
        window.LuminaCatalog?.saveProducts(products);
    }

    // ─── Navegacao ───────────────────────────────────────────────

    function setActiveNav(tab) {
        els.navButtons.forEach(button => {
            const isActive = button.dataset.tab === tab;
            button.classList.toggle('bg-white/10', isActive);
            button.classList.toggle('text-white', isActive);
            button.classList.toggle('text-slate-300', !isActive);
        });
    }

    function switchTab(tab) {
        if (!TAB_TITLES[tab]) return;

        state.activeTab = tab;
        els.pageTitle.textContent = TAB_TITLES[tab];
        setActiveNav(tab);

        Object.entries(els.panels).forEach(([key, panel]) => {
            panel.classList.toggle('hidden', key !== tab);
        });

        closeSidebar();

        if (tab === 'dashboard') renderDashboard();
        if (tab === 'catalog') renderCatalog();
        if (tab === 'settings') renderSettings();
        if (tab === 'leads') renderLeads();
    }

    function toggleSidebar(open) {
        const shouldOpen = typeof open === 'boolean' ? open : els.sidebar.classList.contains('-translate-x-full');
        els.sidebar.classList.toggle('-translate-x-full', !shouldOpen);
        els.sidebarOverlay.classList.toggle('hidden', !shouldOpen);
    }

    function closeSidebar() {
        if (window.innerWidth < 1024) toggleSidebar(false);
    }

    // ─── Premium UI (Fade + CountUp + Categoria Bars) ─────────────────

    function applyPremiumFadeUp() {
        const root = document.getElementById('dashboardFadeRoot');
        if (!root) return;

        root.classList.add('opacity-0');
        requestAnimationFrame(() => {
            root.style.transition = 'opacity 420ms ease, transform 520ms cubic-bezier(0.25, 1, 0.5, 1)';
            root.style.transform = 'translateY(10px)';
            root.classList.remove('opacity-0');
            root.style.opacity = '1';
            root.style.transform = 'translateY(0)';
        });

        // Make sure cards animate in a pleasant cascade
        const candidates = root.querySelectorAll('[data-premium-anim]');
        candidates.forEach((node, idx) => {
            node.style.opacity = '0';
            node.style.transform = 'translateY(10px)';
            node.style.transition = 'opacity 520ms ease, transform 520ms cubic-bezier(0.25, 1, 0.5, 1)';
            node.style.transitionDelay = `${idx * 60}ms`;
            requestAnimationFrame(() => {
                node.style.opacity = '1';
                node.style.transform = 'translateY(0)';
            });
        });
    }

    function countUp(el, target, duration = 900) {
        if (!el) return;
        const start = 1;
        const end = Math.max(0, Number(target) || 0);
        if (end === 0) {
            el.textContent = '0';
            return;
        }

        const diff = end - start;
        const startTs = performance.now();

        function tick(now) {
            const t = Math.min(1, (now - startTs) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            const value = start + Math.round(diff * eased);
            el.textContent = String(value);
            if (t < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    function renderCategoryBarsSkeleton() {
        // Containers com skeleton (já visíveis, depois preenchidas)
        return `
            <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div class="flex items-center justify-between">
                <div class="h-3 w-40 animate-pulse rounded bg-slate-200"></div>
                <div class="h-3 w-16 animate-pulse rounded bg-slate-200"></div>
              </div>
              <div class="mt-3 h-2 w-full animate-pulse rounded bg-slate-200"></div>
            </div>
        `;
    }

    function getCategoryCounts(products) {
        const counts = {};
        (products || []).forEach(p => {
            const key = p.category || 'Sem categoria';
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }

    function renderCategoryBars(products) {
        const container = document.getElementById('categoryDistribution');
        if (!container) return;

        const counts = getCategoryCounts(products);
        const entries = Object.entries(counts);
        const max = entries.reduce((m, [, v]) => Math.max(m, v), 0);

        if (!entries.length) {
            container.innerHTML = `
              <div class="text-sm text-slate-500">Sem dados de categorias ainda.</div>
            `;
            return;
        }

        container.innerHTML = entries
            .sort((a, b) => b[1] - a[1])
            .map(([category, qty], idx) => {
                const pct = max ? (qty / max) * 100 : 0;
                const label = CATEGORY_LABELS[category] || category;
                return `
                    <div class="rounded-2xl border border-slate-200 bg-white p-4" data-premium-anim>
                        <div class="flex items-center justify-between gap-3">
                            <div class="min-w-0">
                                <p class="text-sm font-semibold text-slate-800 truncate">${escapeHtml(label)}</p>
                                <p class="text-xs text-slate-500">${qty} produtos</p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm font-extrabold text-slate-900" data-count="category-${idx}" data-final="${qty}">1</p>
                            </div>
                        </div>
                        <div class="mt-3 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500"
                                 data-bar="${idx}" style="width:0%"></div>
                        </div>
                    </div>
                `;
            })
            .join('');

        // animate bars immediately (visual)
        entries
            .sort((a, b) => b[1] - a[1])
            .forEach(([, qty], idx) => {
                const bar = container.querySelector(`[data-bar="${idx}"]`);
                const pct = max ? (qty / max) * 100 : 0;
                if (bar) {
                    requestAnimationFrame(() => {
                        bar.style.transition = 'width 900ms cubic-bezier(0.25, 1, 0.5, 1)';
                        bar.style.width = `${pct}%`;
                    });
                }
            });
    }

    function animateDashboardNumbers({
        total,
        disponiveis,
        indisponiveis,
        whatsappClicks,
        newsletterLeads,
        categoryCounts
    }) {
        const root = document.getElementById('dashboardFadeRoot');
        if (!root) return;

        // Map metric cards by their subtitles (robust-ish)
        const totalCard = root.querySelector('.metric-total-products p.mt-2');
        const availCard = root.querySelector('.metric-available-products p.mt-2');
        const unavailCard = root.querySelector('.metric-unavailable-products p.mt-2');
        const whatsappCard = root.querySelector('.metric-whatsapp-clicks p.mt-2');
        const leadsCard = root.querySelector('.metric-newsletter-leads p.mt-2');

        countUp(totalCard, total, 980);
        countUp(availCard, disponiveis, 860);
        countUp(unavailCard, indisponiveis, 860);
        countUp(whatsappCard, whatsappClicks || 0, 720);
        countUp(leadsCard, newsletterLeads || 0, 760);

        // Category counts
        const countEls = root.querySelectorAll('[data-count][data-final]');
        countEls.forEach(el => {
            const final = Number(el.getAttribute('data-final') || '0');
            countUp(el, final, 780);
        });
    }

    // ─── Dashboard ───────────────────────────────────────────────


    function renderDashboard() {
        const panel = els.panels.dashboard;
        const products = getProducts();
        const analytics = window.LuminaStore?.getAnalytics() || { whatsappClicks: 0, recentActivity: [] };
        const leads = window.LuminaStore?.getNewsletterLeads() || [];

        const total = products.length;
        const indisponiveis = products.filter(product => product.indisponivel).length;
        const disponiveis = total - indisponiveis;

        const recent = analytics.recentActivity || [];

        panel.innerHTML = `
            <div id="dashboardFadeRoot" class="space-y-6">
                <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    ${metricCard('fa-box', 'Total de Produtos', total, `${disponiveis} disponiveis • ${indisponiveis} indisponiveis`, 'bg-sky-500', 'metric-total-products')}
                    ${metricCard('fa-square-check', 'Produtos Disponíveis', disponiveis, 'Na vitrine / prontos para venda', 'bg-emerald-500', 'metric-available-products')}
                    ${metricCard('fa-square-xmark', 'Produtos Indisponíveis', indisponiveis, 'Ocultos da vitrine', 'bg-rose-500', 'metric-unavailable-products')}
                </div>

                <div class="grid gap-4 lg:grid-cols-3">
                    <div class="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
                        <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <h2 class="text-base font-bold text-slate-900">Distribuição por Categoria</h2>
                            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Baseado em stock</span>
                        </div>

                        <div id="categoryDistribution" class="p-4 space-y-4">
                            ${renderCategoryBarsSkeleton()}
                        </div>
                    </div>

                    <div class="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                        <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <h2 class="text-base font-bold text-slate-900">Atividade Recente</h2>
                            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Ultimos eventos</span>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="min-w-full text-left text-sm">
                                <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th class="px-5 py-3 font-semibold">Tipo</th>
                                        <th class="px-5 py-3 font-semibold">Descricao</th>
                                        <th class="px-5 py-3 font-semibold">Data</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${recent.slice(0, 8).map(item => `
                                        <tr class="hover:bg-slate-50/80">
                                            <td class="px-5 py-3">
                                                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase text-slate-600">${escapeHtml(item.type)}</span>
                                            </td>
                                            <td class="px-5 py-3 text-slate-700">${escapeHtml(item.label)}</td>
                                            <td class="px-5 py-3 text-slate-500">${formatDate(item.date)}</td>
                                        </tr>
                                    `).join('') || emptyRow(3, 'Sem atividade registada.')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    ${metricCard('fa-brands fa-whatsapp', 'Cliques WhatsApp', analytics.whatsappClicks || 0, 'Conversoes registradas', 'bg-emerald-500', 'metric-whatsapp-clicks')}
                    ${metricCard('fa-envelope', 'Leads Newsletter', leads.length, 'E-mails capturados na Home', 'bg-violet-500', 'metric-newsletter-leads')}
                    <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Pronto para Supabase</p>
                                <p class="mt-2 text-3xl font-extrabold text-slate-900">Fase C</p>
                                <p class="mt-1 text-sm text-slate-500">Auth user profile na sidebar</p>
                            </div>
                            <div class="flex h-12 w-12 items-center justify-center rounded-2xl text-white bg-sky-500">
                                <i class="fa-solid fa-lock"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        renderCategoryBars(products);

        // premium entrance
        applyPremiumFadeUp();

        // CountUp (dashboard numbers)
        animateDashboardNumbers({
            total,
            disponiveis,
            indisponiveis,
            whatsappClicks: analytics.whatsappClicks || 0,
            newsletterLeads: leads.length,
            categoryCounts: getCategoryCounts(products)
        });
    }


    function metricCard(icon, title, value, subtitle, colorClass) {
        return `
            <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">${title}</p>
                        <p class="mt-2 text-3xl font-extrabold text-slate-900">${value}</p>
                        <p class="mt-1 text-sm text-slate-500">${subtitle}</p>
                    </div>
                    <div class="flex h-12 w-12 items-center justify-center rounded-2xl text-white ${colorClass}">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                </div>
            </article>
        `;
    }

    function emptyRow(cols, message) {
        return `<tr><td colspan="${cols}" class="px-5 py-8 text-center text-slate-400">${message}</td></tr>`;
    }

    // ─── Catalogo ────────────────────────────────────────────────

    function renderCatalog() {
        const panel = els.panels.catalog;
        const products = getProducts();

        panel.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 class="text-lg font-bold text-slate-900">Produtos da vitrine</h2>
                    <p class="text-sm text-slate-500">Geridos na chave <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs">produtos_lumina</code></p>
                </div>
                <button id="addProductBtn" type="button"
                    class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                    <i class="fa-solid fa-plus"></i> Adicionar Novo Produto
                </button>
            </div>

            <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="overflow-x-auto">
                    <table class="min-w-full text-left text-sm">
                        <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th class="px-5 py-3 font-semibold">Foto</th>
                                <th class="px-5 py-3 font-semibold">Nome</th>
                                <th class="px-5 py-3 font-semibold">Preco</th>
                                <th class="px-5 py-3 font-semibold">Categoria</th>
                                <th class="px-5 py-3 font-semibold">Disponivel</th>
                                <th class="px-5 py-3 font-semibold text-right">Acoes</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100" id="catalogTableBody">
                            ${products.map(product => catalogRow(product)).join('') || emptyRow(6, 'Nenhum produto cadastrado.')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('addProductBtn')?.addEventListener('click', () => openProductModal());
        panel.querySelectorAll('[data-action="edit-product"]').forEach(btn => {
            btn.addEventListener('click', () => openProductModal(btn.dataset.id));
        });
        panel.querySelectorAll('[data-action="delete-product"]').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
        panel.querySelectorAll('[data-action="toggle-availability"]').forEach(input => {
            input.addEventListener('change', () => toggleAvailability(input.dataset.id, input.checked));
        });
    }

    function catalogRow(product) {
        const isAvailable = !product.indisponivel;
        const priceLabel = product.salePrice
            ? `<span class="line-through text-slate-400">${formatPrice(product.price)}</span> <strong>${formatPrice(product.salePrice)}</strong>`
            : `<strong>${formatPrice(product.price)}</strong>`;

        return `
            <tr class="hover:bg-slate-50/80">
                <td class="px-5 py-3">
                    <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"
                        class="h-14 w-14 rounded-xl object-cover ring-1 ring-slate-200">
                </td>
                <td class="px-5 py-3">
                    <p class="font-semibold text-slate-900">${escapeHtml(product.name)}</p>
                    <p class="text-xs text-slate-400">${escapeHtml(product.id)}</p>
                </td>
                <td class="px-5 py-3 text-slate-700">${priceLabel}</td>
                <td class="px-5 py-3 text-slate-600">${escapeHtml(CATEGORY_LABELS[product.category] || product.category)}</td>
                <td class="px-5 py-3">
                    <label class="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" class="peer sr-only" data-action="toggle-availability" data-id="${escapeHtml(product.id)}" ${isAvailable ? 'checked' : ''}>
                        <span class="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500"></span>
                        <span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span>
                    </label>
                </td>
                <td class="px-5 py-3">
                    <div class="flex justify-end gap-2">
                        <button type="button" data-action="edit-product" data-id="${escapeHtml(product.id)}"
                            class="rounded-lg border border-slate-200 px-3 py-2 text-slate-700 hover:bg-slate-50" title="Editar">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" data-action="delete-product" data-id="${escapeHtml(product.id)}"
                            class="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    function openProductModal(productId = null) {
        // reset preview/UI state
        const previewWrap = document.getElementById('product-image-preview');
        const previewImg = document.getElementById('product-image-preview-img');
        const fileInput = document.getElementById('product-image');
        const hiddenImageField = document.getElementById('productImage');
        if (previewWrap) previewWrap.classList.add('hidden');
        if (previewImg) previewImg.src = '';
        if (fileInput) fileInput.value = '';
        if (hiddenImageField) hiddenImageField.value = '';

        state.editingProductId = productId;

        const product = productId ? window.LuminaCatalog?.getProductById(productId) : null;

        els.productModalTitle.textContent = product ? 'Editar Produto' : 'Novo Produto';
        document.getElementById('productId').value = product?.id || '';
        document.getElementById('productName').value = product?.name || '';
        document.getElementById('productPrice').value = product?.price ?? '';
        document.getElementById('productSalePrice').value = product?.salePrice ?? '';
        document.getElementById('productCategory').value = product?.category || 'Masculino';
        document.getElementById('productBadge').value = product?.badge || 'novo';
        document.getElementById('productImage').value = product?.image || '';
        document.getElementById('productNote').value = product?.note || '';
        document.getElementById('productDescription').value = product?.description || '';
        document.getElementById('productSizes').value = (product?.sizes || []).join(', ');
        document.getElementById('productColors').value = (product?.colors || []).join(', ');
        document.getElementById('productStock').value = product?.stock ?? 10;

        els.productModal.classList.remove('hidden');
        els.productModal.classList.add('flex');
    }

    function closeProductModal() {
        els.productModal.classList.add('hidden');
        els.productModal.classList.remove('flex');
        els.productForm.reset();
        state.editingProductId = null;
    }

    function saveProductFromForm(event) {
        event.preventDefault();

        const products = getProducts();
        const existingId = document.getElementById('productId').value.trim();
        const name = document.getElementById('productName').value.trim();
        const price = Number(document.getElementById('productPrice').value);
        const salePriceRaw = document.getElementById('productSalePrice').value;
        const salePrice = salePriceRaw ? Number(salePriceRaw) : null;

        const payload = {
            id: existingId || `${slugify(name)}-${Date.now()}`,
            name,
            category: document.getElementById('productCategory').value,
            price,
            salePrice: salePrice && salePrice < price ? salePrice : null,
            badge: document.getElementById('productBadge').value,
            image: document.getElementById('productImage').value.trim(),
            note: document.getElementById('productNote').value.trim(),
            description: document.getElementById('productDescription').value.trim(),
            sizes: parseList(document.getElementById('productSizes').value),
            colors: parseList(document.getElementById('productColors').value),
            stock: Number(document.getElementById('productStock').value || 0),
            indisponivel: existingId ? (products.find(item => item.id === existingId)?.indisponivel || false) : false
        };

        const index = products.findIndex(item => item.id === payload.id);
        if (index >= 0) {
            products[index] = { ...products[index], ...payload };
            window.LuminaStore?.logActivity('catalog', `Produto editado: ${payload.name}`);
        } else {
            products.unshift(payload);
            window.LuminaStore?.logActivity('catalog', `Produto criado: ${payload.name}`);
        }

        saveProducts(products);
        closeProductModal();
        renderCatalog();
        showToast('Produto salvo com sucesso.');
    }

    function deleteProduct(productId) {
        const products = getProducts();
        const product = products.find(item => item.id === productId);
        if (!product) return;

        if (!window.confirm(`Eliminar "${product.name}" do catalogo?`)) return;

        saveProducts(products.filter(item => item.id !== productId));
        window.LuminaStore?.logActivity('catalog', `Produto eliminado: ${product.name}`);
        renderCatalog();
        showToast('Produto eliminado.');
    }

    function toggleAvailability(productId, isAvailable) {
        const products = getProducts().map(product => {
            if (product.id !== productId) return product;
            return { ...product, indisponivel: !isAvailable };
        });

        saveProducts(products);
        const product = products.find(item => item.id === productId);
        window.LuminaStore?.logActivity('catalog', `${product?.name}: ${isAvailable ? 'disponivel' : 'indisponivel'}`);
        showToast(isAvailable ? 'Produto visivel na Home.' : 'Produto oculto da vitrine.');
    }

    // ─── Definicoes ──────────────────────────────────────────────

    function renderSettings() {
        const panel = els.panels.settings;
        const config = window.LuminaStore?.getConfig() || {};

        panel.innerHTML = `
            <form id="settingsForm" class="space-y-6">
                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 class="mb-4 text-base font-bold text-slate-900"><i class="fa-brands fa-whatsapp mr-2 text-emerald-500"></i>Canais</h2>
                    <div class="grid gap-4 md:grid-cols-2">
                        <label class="block">
                            <span class="mb-1 block text-sm font-semibold text-slate-700">Numero WhatsApp (com codigo do pais)</span>
                            <input name="whatsappNumber" type="text" value="${escapeHtml(config.whatsapp?.number || '')}"
                                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                                placeholder="244900000000" required>
                        </label>
                        <label class="block md:col-span-2">
                            <span class="mb-1 block text-sm font-semibold text-slate-700">Mensagem padrao do carrinho</span>
                            <textarea name="whatsappMessage" rows="2"
                                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">${escapeHtml(config.whatsapp?.defaultMessage || '')}</textarea>
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 class="mb-4 text-base font-bold text-slate-900"><i class="fa-solid fa-share-nodes mr-2 text-sky-500"></i>Redes Sociais</h2>
                    <div class="grid gap-4 md:grid-cols-3">
                        <label class="block">
                            <span class="mb-1 block text-sm font-semibold text-slate-700">Facebook</span>
                            <input name="facebook" type="url" value="${escapeHtml(config.social?.facebook || '')}"
                                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                        </label>
                        <label class="block">
                            <span class="mb-1 block text-sm font-semibold text-slate-700">Instagram</span>
                            <input name="instagram" type="url" value="${escapeHtml(config.social?.instagram || '')}"
                                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                        </label>
                        <label class="block">
                            <span class="mb-1 block text-sm font-semibold text-slate-700">Twitter / X</span>
                            <input name="twitter" type="url" value="${escapeHtml(config.social?.twitter || '')}"
                                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
                        </label>
                    </div>
                </section>

                <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 class="mb-4 text-base font-bold text-slate-900"><i class="fa-solid fa-building mr-2 text-violet-500"></i>Institucional</h2>
                    <div class="grid gap-4 md:grid-cols-2">
                        <label class="block">
                            <span class="mb-1 block text-sm font-semibold text-slate-700">Nome da loja</span>
                            <input name="storeName" type="text" value="${escapeHtml(config.institutional?.storeName || '')}"
                                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" required>
                        </label>
                        <label class="block">
                            <span class="mb-1 block text-sm font-semibold text-slate-700">E-mail de contacto</span>
                            <input name="contactEmail" type="email" value="${escapeHtml(config.institutional?.email || '')}"
                                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" required>
                        </label>
                        <label class="block md:col-span-2">
                            <span class="mb-1 block text-sm font-semibold text-slate-700">Morada</span>
                            <input name="address" type="text" value="${escapeHtml(config.institutional?.address || '')}"
                                class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" required>
                        </label>
                    </div>
                </section>

                <div class="flex justify-end">
                    <button type="submit"
                        class="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                        Salvar definicoes
                    </button>
                </div>
            </form>
        `;

        document.getElementById('settingsForm')?.addEventListener('submit', saveSettings);
    }

    function saveSettings(event) {
        event.preventDefault();
        const form = event.target;
        const data = new FormData(form);

        const nextConfig = {
            whatsapp: {
                number: String(data.get('whatsappNumber') || '').replace(/\D/g, ''),
                defaultMessage: String(data.get('whatsappMessage') || '').trim()
            },
            social: {
                facebook: String(data.get('facebook') || '').trim(),
                instagram: String(data.get('instagram') || '').trim(),
                twitter: String(data.get('twitter') || '').trim()
            },
            institutional: {
                storeName: String(data.get('storeName') || '').trim(),
                email: String(data.get('contactEmail') || '').trim(),
                address: String(data.get('address') || '').trim()
            }
        };

        window.LuminaStore?.saveConfig(nextConfig);
        window.LuminaStore?.logActivity('settings', 'Definicoes do site atualizadas');
        showToast('Definicoes salvas em config_lumina.');
    }

    // ─── Leads ───────────────────────────────────────────────────

    function renderLeads() {
        const panel = els.panels.leads;
        const leads = window.LuminaStore?.getNewsletterLeads() || [];

        panel.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 class="text-lg font-bold text-slate-900">Leads da Newsletter</h2>
                    <p class="text-sm text-slate-500">Fonte: <code class="rounded bg-slate-100 px-1.5 py-0.5 text-xs">newsletter_lumina</code></p>
                </div>
                <button id="exportCsvBtn" type="button"
                    class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <i class="fa-solid fa-file-csv"></i> Exportar CSV
                </button>
            </div>

            <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="overflow-x-auto">
                    <table class="min-w-full text-left text-sm">
                        <thead class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                            <tr>
                                <th class="px-5 py-3 font-semibold">#</th>
                                <th class="px-5 py-3 font-semibold">E-mail</th>
                                <th class="px-5 py-3 font-semibold">Data de registo</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${leads.map((lead, index) => `
                                <tr class="hover:bg-slate-50/80">
                                    <td class="px-5 py-3 text-slate-400">${index + 1}</td>
                                    <td class="px-5 py-3 font-medium text-slate-800">${escapeHtml(lead.email)}</td>
                                    <td class="px-5 py-3 text-slate-500">${formatDate(lead.date)}</td>
                                </tr>
                            `).join('') || emptyRow(3, 'Nenhum lead capturado ainda.')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.getElementById('exportCsvBtn')?.addEventListener('click', exportLeadsCsv);
    }

    function exportLeadsCsv() {
        const leads = window.LuminaStore?.getNewsletterLeads() || [];
        if (!leads.length) {
            showToast('Nao ha leads para exportar.');
            return;
        }

        const rows = [
            ['email', 'data'],
            ...leads.map(lead => [lead.email, lead.date])
        ];

        const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lumina-leads-${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        window.LuminaStore?.logActivity('leads', 'Exportacao CSV de leads');
        showToast('CSV exportado com sucesso.');
    }

    // ─── Init ────────────────────────────────────────────────────

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function bindImageUpload() {
        const fileInput = document.getElementById('product-image');
        const previewWrap = document.getElementById('product-image-preview');
        const previewImg = document.getElementById('product-image-preview-img');
        const clearBtn = document.getElementById('clearProductImageBtn');
        const hiddenImageField = document.getElementById('productImage');
        if (!fileInput) return;

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;

            try {
                const dataUrl = await readFileAsDataURL(file);
                if (hiddenImageField) hiddenImageField.value = dataUrl;

                if (previewWrap) previewWrap.classList.remove('hidden');
                if (previewImg) {
                    previewImg.src = dataUrl;
                    // gentle transition on show
                    previewImg.style.transition = 'transform 420ms cubic-bezier(0.25, 1, 0.5, 1)';
                    previewImg.style.transform = 'scale(0.98)';
                    requestAnimationFrame(() => {
                        previewImg.style.transform = 'scale(1)';
                    });
                }
            } catch (e) {
                console.error(e);
                showToast('Falha ao ler a imagem. Tente novamente.');
            }
        });

        clearBtn?.addEventListener('click', () => {
            if (fileInput) fileInput.value = '';
            if (hiddenImageField) hiddenImageField.value = '';
            previewWrap?.classList.add('hidden');
            if (previewImg) previewImg.src = '';
        });
    }

    function bindEvents() {

        els.navButtons.forEach(button => {
            button.addEventListener('click', () => switchTab(button.dataset.tab));
        });

        els.sidebarToggle?.addEventListener('click', () => toggleSidebar());
        els.sidebarOverlay?.addEventListener('click', () => toggleSidebar(false));

        els.refreshDataBtn?.addEventListener('click', () => {
            reloadData();
            switchTab(state.activeTab);
            showToast('Dados atualizados do localStorage.');
        });

        els.productForm?.addEventListener('submit', saveProductFromForm);
        els.closeProductModal?.addEventListener('click', closeProductModal);
        els.cancelProductBtn?.addEventListener('click', closeProductModal);

        els.productModal?.addEventListener('click', event => {
            if (event.target === els.productModal) closeProductModal();
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeProductModal();
        });
    }

    function init() {
        reloadData();
        bindEvents();
        switchTab('dashboard');
    }

    init();
})();
