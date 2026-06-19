(function () {
    const modal = document.getElementById('productDetailModal');
    if (!modal) return;

    const detailImage = document.getElementById('detailImage');
    const detailBadge = document.getElementById('detailBadge');
    const detailCategory = document.getElementById('detailCategory');
    const detailTitle = document.getElementById('productDetailTitle');
    const detailPrice = document.getElementById('detailPrice');
    const detailDescription = document.getElementById('detailDescription');
    const detailSizes = document.getElementById('detailSizes');
    const detailColors = document.getElementById('detailColors');
    const detailStock = document.getElementById('detailStock');
    const detailContent = modal.querySelector('.product-detail-content');
    const addToCartBtn = document.getElementById('detailAddToCart');
    const closeBtn = modal.querySelector('.product-detail-close');
    const secondaryCloseBtn = document.getElementById('detailCloseSecondary');

    const formatter = new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: 'AOA',
        maximumFractionDigits: 0
    });

    const categoryLabels = {
        Masculino: 'Masculino',
        Feminino: 'Feminino',
        Calcados: 'Calçados & Tênis',
        Acessorios: 'Acessórios'
    };

    const colorTokens = {
        Preto: '#111827',
        Branco: '#f8fafc',
        Marfim: '#f5efe4',
        Azul: '#1d4ed8',
        Cinza: '#64748b',
        Camel: '#b7793f',
        Verde: '#166534',
        Vinho: '#7f1d1d',
        Dourado: '#c69c38',
        Prata: '#cbd5e1',
        Nude: '#d6a77a',
        Castanho: '#7c4a2d'
    };

    let activeCard = null;

    function getProductById(id) {
        return window.LuminaCatalog?.getProductById(id) || null;
    }

    function resolveBadge(product) {
        const badgeKey = product.badge || '';
        const label = window.LuminaPage?.productBadgeLabels?.[badgeKey] || badgeKey || 'Lumina';
        return { key: badgeKey, label };
    }

    function setActiveChoice(group, value) {
        group.querySelectorAll('.detail-choice').forEach(button => {
            button.classList.toggle('active', button.dataset.value === value);
            button.setAttribute('aria-pressed', String(button.dataset.value === value));
        });
    }

    function renderChoices(group, values, type) {
        if (!group) return;
        group.innerHTML = '';

        values.forEach((value, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `detail-choice${type === 'color' ? ' color-choice' : ''}`;
            button.dataset.value = value;
            button.setAttribute('aria-pressed', String(index === 0));

            if (type === 'color') {
                const swatch = document.createElement('span');
                swatch.className = 'detail-swatch';
                swatch.style.backgroundColor = colorTokens[value] || '#94a3b8';
                button.appendChild(swatch);
            }

            button.append(document.createTextNode(value));
            button.classList.toggle('active', index === 0);
            button.addEventListener('click', () => setActiveChoice(group, value));
            group.appendChild(button);
        });
    }

    function openProductDetail(card) {
        const product = getProductById(card.dataset.id);
        if (!product) return;

        activeCard = card;
        const badge = resolveBadge(product);
        const sizes = product.sizes?.length ? product.sizes : ['S', 'M', 'L'];
        const colors = product.colors?.length ? product.colors : ['Preto', 'Branco'];
        const description = product.description || product.note || '';

        detailImage.src = product.image;
        detailImage.alt = product.name;
        detailBadge.textContent = badge.label;
        detailBadge.className = 'product-detail-badge';
        if (badge.key) {
            detailBadge.classList.add(`badge-${badge.key}`);
        }
        detailCategory.textContent = categoryLabels[product.category] || product.category;
        detailTitle.textContent = product.name;
        detailPrice.textContent = formatter.format(product.salePrice || product.price);
        detailDescription.textContent = description;
        detailStock.textContent = `${product.stock} unidade${product.stock === 1 ? '' : 's'} disponiveis`;

        renderChoices(detailSizes, sizes, 'size');
        renderChoices(detailColors, colors, 'color');

        detailContent?.scrollTo(0, 0);

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        window.LuminaPage?.syncScrollLock?.();

        requestAnimationFrame(() => closeBtn?.focus());
    }

    function closeProductDetail() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        window.LuminaPage?.syncScrollLock?.();
        activeCard = null;
    }

    addToCartBtn?.addEventListener('click', () => {
        if (!activeCard) return;
        activeCard.querySelector('.add-to-bag-btn')?.click();
        closeProductDetail();
    });

    closeBtn?.addEventListener('click', closeProductDetail);
    secondaryCloseBtn?.addEventListener('click', closeProductDetail);

    modal.addEventListener('click', event => {
        if (event.target === modal) closeProductDetail();
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && modal.classList.contains('open')) {
            closeProductDetail();
        }
    });

    window.LuminaProductDetails = {
        openProductDetail
    };
})();
