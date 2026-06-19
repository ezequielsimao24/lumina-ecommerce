const sliderWrapper = document.getElementById('sliderWrapper');
const slides = Array.from(document.querySelectorAll('.slide'));
const heroSliderEl = document.querySelector('.hero-slider');
const heroToast = document.getElementById('heroToast');
const sliderDots = document.getElementById('sliderDots');
const navbar = document.querySelector('.navbar');

const productCards = Array.from(document.querySelectorAll('.product-card'));
const categoryButtons = Array.from(document.querySelectorAll('.category-btn'));
const categoryLinks = Array.from(document.querySelectorAll('[data-category-link]'));
const searchToggleBtn = document.querySelector('.search-toggle-btn');
const collectionSection = document.getElementById('collection');
const collectionSearch = document.getElementById('collectionSearch');
const searchCloseBtn = document.querySelector('.search-close-btn');
const productSearch = document.getElementById('productSearch');
const resultsStatus = document.getElementById('resultsStatus');
const sortProducts = document.getElementById('sortProducts');
const priceRange = document.getElementById('priceRange');
const priceRangeValue = document.getElementById('priceRangeValue');
const favoritesOnly = document.getElementById('favoritesOnly');
const categoriesContainer = document.querySelector('.categories-container');

const cartBtn = document.querySelector('.cart-btn');
const cartCount = document.querySelector('.cart-count');
const cartDrawer = document.getElementById('cartDrawer');
const cartCloseBtn = document.querySelector('.cart-close-btn');
const cartItemsEl = document.getElementById('cartItems');
const cartEmptyEl = document.getElementById('cartEmpty');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const checkoutForm = document.getElementById('checkoutForm');
const openCheckoutBtn = document.getElementById('openCheckoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const checkoutModalClose = document.querySelector('.checkout-modal-close');
const clearCartBtn = document.querySelector('.clear-cart-btn');
const shippingMessage = document.getElementById('shippingMessage');
const shippingBar = document.getElementById('shippingBar');
const overlay = document.getElementById('overlay');
const newsletterForm = document.getElementById('newsletterForm');

const totalSlidesReais = slides.length;
const tempoTroca = 6000;
const currencyFormatter = new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0
});

let indexAtual = 0;
let autoplayAtivo = true;
let categoriaAtual = 'Todos';
let termoBusca = '';
let ordenacaoAtual = 'featured';
let precoMaximo = Number(priceRange?.value || 250000);
let mostrarApenasFavoritos = false;
let toastTimer;
let carrinhoAberto = false;
let checkoutAberto = false;
let carrinho = loadFromStorage('lumina-cart', []);
let favoritos = loadFromStorage('lumina-favorites', []);
const buttonResetTimers = new WeakMap();
let ultimoTotalCarrinho = carrinho.reduce((total, item) => total + item.quantity, 0);
const freteGratisMeta = 150000;
const whatsappPedidoNumero = '244952685457';

function loadFromStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        return fallback;
    }
}

function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message) {
    if (!heroToast) return;

    clearTimeout(toastTimer);
    heroToast.textContent = message;
    heroToast.classList.add('show');

    toastTimer = setTimeout(() => {
        heroToast.classList.remove('show');
    }, 2400);
}

function irParaSlide(nextIndex) {
    if (!sliderWrapper || !slides.length) return;

    slides[indexAtual]?.classList.remove('active-slide');
    indexAtual = (nextIndex + slides.length) % slides.length;

    sliderWrapper.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    sliderWrapper.style.transform = `translateX(-${indexAtual * 100}vw)`;
    slides[indexAtual]?.classList.add('active-slide');
    updateDots();
}

function alternarSlide() {
    if (slides.length < 2) return;
    irParaSlide(indexAtual + 1);
}

function createDots() {
    if (!sliderDots || totalSlidesReais <= 1) return;

    sliderDots.innerHTML = '';
    for (let index = 0; index < totalSlidesReais; index++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slider-dot';
        dot.setAttribute('aria-label', `Ir para slide ${index + 1}`);
        dot.addEventListener('click', () => {
            autoplayAtivo = false;
            irParaSlide(index);
        });
        sliderDots.appendChild(dot);
    }
    updateDots();
}

function updateDots() {
    if (!sliderDots) return;

    const dots = Array.from(sliderDots.querySelectorAll('.slider-dot'));
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === indexAtual % totalSlidesReais);
    });
}

function getProductData(card) {
    return {
        id: card.dataset.id,
        name: card.dataset.name,
        category: card.dataset.category,
        price: Number(card.dataset.price),
        stock: Number(card.dataset.stock || 0),
        image: card.querySelector('.product-image')?.getAttribute('src') || '',
        quantity: 1
    };
}

function normalizeCategory(category) {
    const c = String(category || 'Todos').trim();
    // Mantem os filtros alinhados as categorias reais da vitrine.
    const map = {
        'todos': 'todos',
        'masculino': 'masculino',
        'feminino': 'feminino',
        'calcados': 'calcados',
        'calcados & tenis': 'calcados',
        'calçados': 'calcados',
        'calçados & tênis': 'calcados',
        'acessorios': 'acessorios',
        'acessórios': 'acessorios'
    };

    const lower = c.toLowerCase();
    return map[lower] || lower;
}


function ordenarProdutos() {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    const sortedCards = [...productCards].sort((a, b) => {
        if (ordenacaoAtual === 'price-low') {
            return Number(a.dataset.price) - Number(b.dataset.price);
        }

        if (ordenacaoAtual === 'price-high') {
            return Number(b.dataset.price) - Number(a.dataset.price);
        }

        if (ordenacaoAtual === 'name') {
            return a.dataset.name.localeCompare(b.dataset.name);
        }

        return productCards.indexOf(a) - productCards.indexOf(b);
    });

    sortedCards.forEach(card => grid.appendChild(card));
}

function setActiveCategory(category) {
    categoriaAtual = String(category || 'All').trim();
    const activeCategory = normalizeCategory(categoriaAtual);

    categoryButtons.forEach(button => {
        button.classList.toggle('active', normalizeCategory(button.dataset.category) === activeCategory);
    });
    filtrarProdutos();
}

function filtrarProdutos() {
    const termo = termoBusca.trim().toLowerCase();
    let totalVisivel = 0;

    productCards.forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const category = card.dataset.category.toLowerCase();
        const price = Number(card.dataset.price);
        const matchesCategory = normalizeCategory(categoriaAtual) === 'todos'
            || normalizeCategory(card.dataset.category) === normalizeCategory(categoriaAtual);
        const matchesSearch = !termo || name.includes(termo) || category.includes(termo);
        const matchesPrice = price <= precoMaximo;
        const matchesFavorite = !mostrarApenasFavoritos || favoritos.includes(card.dataset.id);
        const isVisible = matchesCategory && matchesSearch && matchesPrice && matchesFavorite;

        card.hidden = !isVisible;
        if (isVisible) totalVisivel++;
    });

    if (resultsStatus) {
        resultsStatus.textContent = totalVisivel
            ? `${totalVisivel} produto${totalVisivel > 1 ? 's' : ''} encontrado${totalVisivel > 1 ? 's' : ''}.`
            : 'Nenhum produto encontrado.';
    }
}

function atualizarPrecoMaximo() {
    precoMaximo = Number(priceRange?.value || 250000);
    if (priceRangeValue) {
        priceRangeValue.textContent = currencyFormatter.format(precoMaximo);
    }
    filtrarProdutos();
}

function toggleCollectionSearch(open, shouldFocus = false) {
    if (!collectionSearch) return;

    collectionSearch.classList.toggle('open', open);
    collectionSearch.setAttribute('aria-hidden', String(!open));

    if (open && shouldFocus) {
        setTimeout(() => productSearch?.focus(), 150);
    }
}

function openSearchInCollection() {
    collectionSection?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });

    setTimeout(() => toggleCollectionSearch(true, true), 320);
}

function atualizarFavoritos() {
    productCards.forEach(card => {
        const button = card.querySelector('.favorite-btn');
        const ativo = favoritos.includes(card.dataset.id);
        button?.classList.toggle('active', ativo);
        button?.setAttribute('aria-pressed', String(ativo));
    });
}

function toggleFavorite(card) {
    const product = getProductData(card);
    const exists = favoritos.includes(product.id);

    favoritos = exists
        ? favoritos.filter(id => id !== product.id)
        : [...favoritos, product.id];

    saveToStorage('lumina-favorites', favoritos);
    atualizarFavoritos();
    filtrarProdutos();
    showToast(exists ? `${product.name} removido dos favoritos.` : `${product.name} favoritado.`);
}

function adicionarAoCarrinho(card) {
    const product = getProductData(card);
    const item = carrinho.find(cartItem => cartItem.id === product.id);

    if (item) {
        item.quantity += 1;
    } else {
        carrinho.push(product);
    }

    saveToStorage('lumina-cart', carrinho);
    renderCarrinho();

    checkoutAberto = false;
    checkoutModal?.classList.remove('open');
    checkoutModal?.setAttribute('aria-hidden', 'true');

    showToast(`${product.name} adicionado ao carrinho.`);
}

function mostrarProdutoAdicionado(card) {
    const button = card.querySelector('.add-to-bag-btn');
    if (!button) return;

    clearTimeout(buttonResetTimers.get(button));
    button.textContent = 'Adicionado...';
    button.classList.add('added');
    button.disabled = true;

    const timer = setTimeout(() => {
        button.textContent = 'Adicionar ao carrinho';
        button.classList.remove('added');
        button.disabled = false;
        buttonResetTimers.delete(button);
    }, 1300);

    buttonResetTimers.set(button, timer);
}

function alterarQuantidade(productId, delta) {
    const item = carrinho.find(cartItem => cartItem.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        carrinho = carrinho.filter(cartItem => cartItem.id !== productId);
    }

    saveToStorage('lumina-cart', carrinho);
    renderCarrinho();
}

function renderCarrinho() {
    const totalItems = carrinho.reduce((total, item) => total + item.quantity, 0);
    const subtotal = carrinho.reduce((total, item) => total + item.price * item.quantity, 0);
    const shippingProgress = Math.min((subtotal / freteGratisMeta) * 100, 100);
    const faltanteFrete = Math.max(freteGratisMeta - subtotal, 0);

    if (cartCount) {
        cartCount.textContent = String(totalItems);
        if (totalItems !== ultimoTotalCarrinho) {
            cartCount.classList.remove('cart-count-bump');
            void cartCount.offsetWidth;
            cartCount.classList.add('cart-count-bump');
            ultimoTotalCarrinho = totalItems;
        }
    }
    if (cartSubtotalEl) cartSubtotalEl.textContent = currencyFormatter.format(subtotal);
    if (cartEmptyEl) cartEmptyEl.hidden = carrinho.length > 0;
    if (openCheckoutBtn) openCheckoutBtn.disabled = carrinho.length === 0;
    if (clearCartBtn) clearCartBtn.disabled = carrinho.length === 0;
    if (shippingBar) shippingBar.style.width = `${shippingProgress}%`;
    if (shippingMessage) {
        shippingMessage.textContent = subtotal >= freteGratisMeta
            ? 'Frete gratis liberado para este pedido.'
            : carrinho.length
                ? `Faltam ${currencyFormatter.format(faltanteFrete)} para frete gratis.`
                : 'Adicione produtos para calcular o frete.';
    }

    if (!cartItemsEl) return;

    cartItemsEl.innerHTML = carrinho.map(item => `
        <article class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <strong>${item.name}</strong>
                <span>${currencyFormatter.format(item.price)}</span>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button type="button" data-cart-action="decrease" data-id="${item.id}" aria-label="Diminuir quantidade">-</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-cart-action="increase" data-id="${item.id}" aria-label="Aumentar quantidade">+</button>
                    </div>
                    <button class="remove-item-btn" type="button" data-cart-action="remove" data-id="${item.id}">
                        Remover
                    </button>
                </div>
            </div>
        </article>
    `).join('');
}

function getCarrinhoSubtotal() {
    return carrinho.reduce((total, item) => total + item.price * item.quantity, 0);
}

function getFormValue(formData, key, fallback = 'Nao informado') {
    const value = String(formData.get(key) || '').trim();
    return value || fallback;
}

function montarMensagemWhatsapp(formData) {
    const subtotal = getCarrinhoSubtotal();
    const totalItems = carrinho.reduce((total, item) => total + item.quantity, 0);
    const linhasProdutos = carrinho.map((item, index) => {
        const itemTotal = item.price * item.quantity;
        return `${index + 1}. ${item.name}\n   Categoria: ${item.category}\n   Quantidade: ${item.quantity}\n   Preco unitario: ${currencyFormatter.format(item.price)}\n   Total do item: ${currencyFormatter.format(itemTotal)}`;
    }).join('\n\n');

    return [
        '*NOVO PEDIDO - LUMINA*',
        '',
        '*Dados do cliente*',
        `Nome: ${getFormValue(formData, 'customerName')}`,
        `Telefone: ${getFormValue(formData, 'customerPhone')}`,
        `Endereco: ${getFormValue(formData, 'customerAddress')}`,
        `Ponto de referencia: ${getFormValue(formData, 'customerReference')}`,
        `Localizacao: ${getFormValue(formData, 'customerLocation')}`,
        `Forma de pagamento: ${getFormValue(formData, 'paymentMethod')}`,
        `Observacoes: ${getFormValue(formData, 'customerNotes')}`,
        '',
        '*Produtos do pedido*',
        linhasProdutos,
        '',
        '*Resumo*',
        `Total de itens: ${totalItems}`,
        `Subtotal: ${currencyFormatter.format(subtotal)}`,
        subtotal >= freteGratisMeta
            ? 'Frete: gratis conforme regra da loja'
            : 'Frete: confirmar com a loja',
        `Total a pagar: ${currencyFormatter.format(subtotal)}`,
        '',
        'Pedido enviado pelo site Lumina.'
    ].join('\n');
}

function atualizarOverlay() {
    if (!overlay) return;
    overlay.classList.toggle('show', carrinhoAberto || checkoutAberto);
}

function isPageScrollLocked() {
    const modalOpen = document.getElementById('productDetailModal')?.classList.contains('open');
    return carrinhoAberto || checkoutAberto || modalOpen;
}

let savedScrollY = 0;

function bloquearScrollPagina(bloquear) {
    const shouldLock = typeof bloquear === 'boolean' ? bloquear : isPageScrollLocked();

    if (shouldLock) {
        if (!document.body.classList.contains('no-scroll')) {
            savedScrollY = window.scrollY;
            document.documentElement.classList.add('no-scroll');
            document.body.classList.add('no-scroll');
            document.body.style.position = 'fixed';
            document.body.style.top = `-${savedScrollY}px`;
            document.body.style.left = '0';
            document.body.style.right = '0';
            document.body.style.width = '100%';
        }
        return;
    }

    if (!isPageScrollLocked()) {
        document.documentElement.classList.remove('no-scroll');
        document.body.classList.remove('no-scroll');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, savedScrollY);
    }
}

function syncPageScrollLock() {
    bloquearScrollPagina(isPageScrollLocked());
}

function toggleCart(open) {
    if (!cartDrawer) return;

    if (open && checkoutAberto) {
        toggleCheckoutModal(false, { returnToCart: false });
    }

    carrinhoAberto = open;
    cartDrawer.classList.toggle('open', open);
    cartDrawer.setAttribute('aria-hidden', String(!open));
    atualizarOverlay();
    bloquearScrollPagina(isPageScrollLocked());
}

function toggleCheckoutModal(open, options = {}) {
    if (!checkoutModal) return;

    const { returnToCart = true } = options;

    if (open) {
        if (!carrinho.length) return;

        carrinhoAberto = false;
        cartDrawer?.classList.remove('open');
        cartDrawer?.setAttribute('aria-hidden', 'true');

        checkoutAberto = true;
        checkoutModal.classList.add('open');
        checkoutModal.setAttribute('aria-hidden', 'false');
        atualizarOverlay();
        bloquearScrollPagina(true);

        requestAnimationFrame(() => {
            document.getElementById('customerName')?.focus();
        });
        return;
    }

    checkoutAberto = false;
    checkoutModal.classList.remove('open');
    checkoutModal.setAttribute('aria-hidden', 'true');

    if (returnToCart && carrinho.length > 0) {
        carrinhoAberto = true;
        cartDrawer?.classList.add('open');
        cartDrawer?.setAttribute('aria-hidden', 'false');
    }

    atualizarOverlay();
    bloquearScrollPagina(isPageScrollLocked());
}

function finalizarPedido(event) {
    event?.preventDefault();
    if (!carrinho.length) return;

    if (checkoutForm && !checkoutForm.checkValidity()) {
        checkoutForm.reportValidity();
        return;
    }

    const formData = new FormData(checkoutForm);
    const mensagem = montarMensagemWhatsapp(formData);
    const whatsappUrl = `https://wa.me/${whatsappPedidoNumero}?text=${encodeURIComponent(mensagem)}`;

    showToast('Abrindo WhatsApp para finalizar o pedido.');
    window.location.href = whatsappUrl;
}

function limparCarrinho() {
    if (!carrinho.length) return;

    carrinho = [];
    saveToStorage('lumina-cart', carrinho);
    renderCarrinho();
    showToast('Carrinho limpo.');
}

if (slides.length) {
    createDots();
    setInterval(() => {
        if (autoplayAtivo) alternarSlide();
    }, tempoTroca);
}

if (heroSliderEl) {
    heroSliderEl.addEventListener('mouseenter', () => {
        autoplayAtivo = false;
    });
    heroSliderEl.addEventListener('mouseleave', () => {
        autoplayAtivo = true;
    });
}

window.addEventListener('scroll', () => {
    navbar?.classList.toggle('navbar-scrolled', window.scrollY > 50);
});

categoriesContainer?.addEventListener('click', event => {
    const button = event.target.closest('.category-btn');
    if (!button) return;

    event.preventDefault();
    setActiveCategory(button.dataset.category);
});

categoryLinks.forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        const category = link.dataset.categoryLink;
        setActiveCategory(category);

        collectionSection?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});

searchToggleBtn?.addEventListener('click', openSearchInCollection);
searchCloseBtn?.addEventListener('click', () => {
    termoBusca = '';
    if (productSearch) productSearch.value = '';
    filtrarProdutos();
    toggleCollectionSearch(false);
});
productSearch?.addEventListener('input', event => {
    termoBusca = event.target.value;
    filtrarProdutos();
});
sortProducts?.addEventListener('change', event => {
    ordenacaoAtual = event.target.value;
    ordenarProdutos();
    filtrarProdutos();
});
priceRange?.addEventListener('input', atualizarPrecoMaximo);
favoritesOnly?.addEventListener('change', event => {
    mostrarApenasFavoritos = event.target.checked;
    filtrarProdutos();
});

productCards.forEach(card => {
    const addButton = card.querySelector('.add-to-bag-btn');
    const favoriteButton = card.querySelector('.favorite-btn');
    const productName = card.dataset.name || card.querySelector('.product-name')?.textContent?.trim() || 'produto';

    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Ver detalhes de ${productName}`);

    function openProductDetailFromCard(event) {
        if (event.target.closest('button, a, input, select, textarea, label')) return;
        window.LuminaProductDetails?.openProductDetail(card);
    }

    card.addEventListener('click', openProductDetailFromCard);

    card.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openProductDetailFromCard(event);
    });

    addButton?.addEventListener('click', event => {
        event.stopPropagation();
        adicionarAoCarrinho(card);
        mostrarProdutoAdicionado(card);
    });

    favoriteButton?.addEventListener('click', event => {
        event.stopPropagation();
        toggleFavorite(card);
    });
});

cartBtn?.addEventListener('click', () => toggleCart(true));
cartCloseBtn?.addEventListener('click', () => toggleCart(false));
openCheckoutBtn?.addEventListener('click', event => {
    event.stopPropagation();
    if (!carrinho.length) return;
    toggleCheckoutModal(true);
});
checkoutModalClose?.addEventListener('click', () => toggleCheckoutModal(false));
checkoutModal?.addEventListener('click', event => {
    if (event.target === checkoutModal) {
        toggleCheckoutModal(false);
    }
});
overlay?.addEventListener('click', () => {
    if (checkoutAberto) {
        toggleCheckoutModal(false);
        return;
    }
    toggleCart(false);
});
checkoutForm?.addEventListener('submit', finalizarPedido);
clearCartBtn?.addEventListener('click', limparCarrinho);

cartItemsEl?.addEventListener('click', event => {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;

    if (button.dataset.cartAction === 'remove') {
        carrinho = carrinho.filter(cartItem => cartItem.id !== button.dataset.id);
        saveToStorage('lumina-cart', carrinho);
        renderCarrinho();
        return;
    }

    const delta = button.dataset.cartAction === 'increase' ? 1 : -1;
    alterarQuantidade(button.dataset.id, delta);
});

newsletterForm?.addEventListener('submit', event => {
    event.preventDefault();
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    showToast('Email cadastrado para novidades.');
    newsletterForm.reset();
    emailInput?.blur();
});

document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;

    if (checkoutAberto) {
        toggleCheckoutModal(false);
        return;
    }

    toggleCart(false);
    toggleCollectionSearch(false);
});

/* ==========================================================================
   AUTH (Login / Cadastro)
   - Página isolada: login.html
   - Este arquivo prepara seletores e event listeners para integrar com API (ex: Supabase)
   ========================================================================== */

// Funcoes auxiliares (placeholder para integracao futura)
function setAuthError(el, message) {
    if (!el) return;
    el.textContent = message || '';
}

function getToggleBtnLabel(btn, isShowing) {
    // Pequena regra para manter UX clara
    return isShowing ? 'Ocultar' : 'Mostrar';
}

function handlePasswordVisibilityToggle(buttonEl) {
    const inputId = buttonEl?.dataset?.togglePassword;
    if (!inputId) return;

    const inputEl = document.getElementById(inputId);
    if (!inputEl) return;

    const isPassword = inputEl.type === 'password';
    inputEl.type = isPassword ? 'text' : 'password';

    const nextLabel = getToggleBtnLabel(buttonEl, !isPassword);
    buttonEl.textContent = nextLabel;
}

function initAuthEventListeners() {
    // Login
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');

    // Cadastro
    const registerForm = document.getElementById('registerForm');
    const registerName = document.getElementById('registerName');
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const registerConfirmPassword = document.getElementById('registerConfirmPassword');
    const registerError = document.getElementById('registerError');

    // Alternancia de telas
    const loginPanel = document.getElementById('loginPanel');
    const registerPanel = document.getElementById('registerPanel');
    const goToRegisterBtn = document.getElementById('goToRegisterBtn');
    const goToLoginBtn = document.getElementById('goToLoginBtn');

    // Links/ UI
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    // Alternar paines sem recarregar
    function showPanel(panel) {
        const isLogin = panel === loginPanel;
        if (loginPanel) loginPanel.classList.toggle('active', isLogin);
        if (registerPanel) registerPanel.classList.toggle('active', !isLogin);

        // limpa erros ao alternar
        setAuthError(loginError, '');
        setAuthError(registerError, '');

        // foco para acessibilidade
        if (isLogin) {
            loginEmail?.focus();
        } else {
            registerName?.focus();
        }
    }

    goToRegisterBtn?.addEventListener('click', event => {
        event.preventDefault();
        showPanel(registerPanel);
    });

    goToLoginBtn?.addEventListener('click', event => {
        event.preventDefault();
        showPanel(loginPanel);
    });

    // Alternar visibilidade de senha
    document.querySelectorAll('[data-toggle-password]').forEach(btn => {
        btn.addEventListener('click', () => handlePasswordVisibilityToggle(btn));
    });

    // Esqueci a senha (placeholder)
    forgotPasswordLink?.addEventListener('click', event => {
        event.preventDefault();
        // Futuro: chamar supabase.auth.resetPasswordForEmail(...)
        setAuthError(loginError, 'Funcao de reset de senha sera conectada a API no futuro.');
    });

    // LOGIN submit (placeholder)
    loginForm?.addEventListener('submit', async event => {
        event.preventDefault();
        setAuthError(loginError, '');

        const email = String(loginEmail?.value || '').trim();
        const password = String(loginPassword?.value || '');

        // Validações basicas
        if (!email || !password) {
            setAuthError(loginError, 'Preencha e-mail e senha.');
            return;
        }

        // Futuro: integrar com Supabase
        // Exemplo (futuro):
        // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        // if (error) throw error;
        // showToast('Login realizado com sucesso.');

        // Placeholder de comportamento (sem API)
        setAuthError(loginError, 'Conexao com API ainda nao configurada.');
    });

    // REGISTER submit (placeholder)
    registerForm?.addEventListener('submit', async event => {
        event.preventDefault();
        setAuthError(registerError, '');

        const fullName = String(registerName?.value || '').trim();
        const email = String(registerEmail?.value || '').trim();
        const password = String(registerPassword?.value || '');
        const confirmPassword = String(registerConfirmPassword?.value || '');

        if (!fullName || !email || !password || !confirmPassword) {
            setAuthError(registerError, 'Preencha todos os campos.');
            return;
        }

        if (password !== confirmPassword) {
            setAuthError(registerError, 'As senhas nao coincidem.');
            return;
        }

        // Futuro: integrar com Supabase
        // Exemplo (futuro):
        // const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { fullName }}});
        // if (error) throw error;
        // showToast('Conta criada. Verifique seu e-mail.');

        // Placeholder
        setAuthError(registerError, 'Conexao com API ainda nao configurada.');
    });
}

// Inicializa apenas quando a pagina tiver elementos de auth
if (document.getElementById('loginForm') || document.getElementById('registerForm')) {
    initAuthEventListeners();
}

atualizarFavoritos();
atualizarPrecoMaximo();
renderCarrinho();
filtrarProdutos();

window.LuminaPage = {
    syncScrollLock: syncPageScrollLock
};
