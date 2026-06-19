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

    const productDetails = {
        zenith: {
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Preto', 'Azul', 'Cinza'],
            description: 'Conjunto social com corte limpo, tecido estruturado e acabamento discreto para eventos, reunioes e rotina executiva.'
        },
        'luna-dress': {
            sizes: ['XS', 'S', 'M', 'L'],
            colors: ['Preto', 'Marfim', 'Vinho'],
            description: 'Vestido midi de caimento elegante, pensado para transitar entre escritorio, jantar e momentos especiais.'
        },
        'terra-sneaker': {
            sizes: ['38', '39', '40', '41', '42', '43'],
            colors: ['Branco', 'Preto', 'Verde'],
            description: 'Tenis knit leve, respiravel e facil de combinar, com sola confortavel para longos dias em movimento.'
        },
        'noir-belt': {
            sizes: ['90', '95', '100', '105'],
            colors: ['Preto', 'Castanho'],
            description: 'Cinto de pele com fivela discreta e acabamento minimalista para equilibrar looks casuais e sociais.'
        },
        'aurora-coat': {
            sizes: ['S', 'M', 'L'],
            colors: ['Camel', 'Marfim', 'Preto'],
            description: 'Casaco leve em linho misto, ideal para criar camadas elegantes sem pesar no visual.'
        },
        'atlas-shirt': {
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Branco', 'Azul', 'Preto'],
            description: 'Camisa oxford com estrutura, toque macio e visual limpo para uma rotina masculina bem composta.'
        },
        'mira-heels': {
            sizes: ['36', '37', '38', '39', '40'],
            colors: ['Preto', 'Nude', 'Dourado'],
            description: 'Salto de perfil elegante com palmilha macia para manter postura, conforto e presenca.'
        },
        'solis-bag': {
            sizes: ['Unico'],
            colors: ['Preto', 'Camel', 'Marfim'],
            description: 'Bolsa transversal compacta, com espaco para o essencial e alca ajustavel para uso diario.'
        },
        'noah-chino': {
            sizes: ['38', '40', '42', '44', '46'],
            colors: ['Preto', 'Camel', 'Cinza'],
            description: 'Calca chino slim com corte versatil para combinar com camisa, polo, tenis ou loafer.'
        },
        'eva-set': {
            sizes: ['XS', 'S', 'M', 'L'],
            colors: ['Preto', 'Marfim', 'Verde'],
            description: 'Conjunto feminino de alfaiataria com linhas firmes, proporcao moderna e presenca premium.'
        },
        'stride-loafer': {
            sizes: ['39', '40', '41', '42', '43'],
            colors: ['Preto', 'Castanho'],
            description: 'Loafer em pele com perfil classico, feito para elevar producoes sociais sem perder conforto.'
        },
        'aria-scarf': {
            sizes: ['Unico'],
            colors: ['Marfim', 'Azul', 'Dourado'],
            description: 'Lenco macio e leve para usar no pescoco, cabelo, bolsa ou como detalhe final do look.'
        }
    };

    let activeCard = null;

    function setActiveChoice(group, value) {
        group.querySelectorAll('.detail-choice').forEach(button => {
            button.classList.toggle('active', button.dataset.value === value);
            button.setAttribute('aria-pressed', String(button.dataset.value === value));
        });
    }

    function renderChoices(group, values, type) {
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

    function getCardData(card) {
        const id = card.dataset.id;
        const fallbackNote = card.querySelector('.product-note')?.textContent?.trim() || '';

        return {
            id,
            name: card.dataset.name || card.querySelector('.product-name')?.textContent?.trim() || '',
            category: card.dataset.category || '',
            price: Number(card.dataset.price || 0),
            stock: Number(card.dataset.stock || 0),
            image: card.querySelector('.product-image')?.getAttribute('src') || '',
            badge: card.querySelector('.product-badge')?.textContent?.trim() || 'Lumina',
            details: productDetails[id] || {
                sizes: ['S', 'M', 'L'],
                colors: ['Preto', 'Branco'],
                description: fallbackNote
            }
        };
    }

    function openProductDetail(card) {
        activeCard = card;
        const product = getCardData(card);

        detailImage.src = product.image;
        detailImage.alt = product.name;
        detailBadge.textContent = product.badge;
        detailCategory.textContent = categoryLabels[product.category] || product.category;
        detailTitle.textContent = product.name;
        detailPrice.textContent = formatter.format(product.price);
        detailDescription.textContent = product.details.description;
        detailStock.textContent = `${product.stock} unidade${product.stock === 1 ? '' : 's'} disponiveis`;

        renderChoices(detailSizes, product.details.sizes, 'size');
        renderChoices(detailColors, product.details.colors, 'color');

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('no-scroll');

        requestAnimationFrame(() => closeBtn?.focus());
    }

    function closeProductDetail() {
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('no-scroll');
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
