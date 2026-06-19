(function () {
    const PRODUTOS_STORAGE_KEY = 'produtos_lumina';

    const DEFAULT_PRODUTOS = [
        {
            id: 'zenith',
            name: 'Zenith Social Set',
            category: 'Masculino',
            price: 129900,
            stock: 12,
            image: 'images/roupaSocial.jpg',
            badge: 'premium',
            note: 'Alfaiataria elegante para eventos e rotina executiva.',
            description: 'Conjunto social com corte limpo, tecido estruturado e acabamento discreto para eventos, reunioes e rotina executiva.',
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Preto', 'Azul', 'Cinza']
        },
        {
            id: 'luna-dress',
            name: 'Luna Midi Dress',
            category: 'Feminino',
            price: 54900,
            stock: 18,
            image: 'images/roupaSocial.jpg',
            badge: 'novo',
            note: 'Vestido midi elegante para trabalho, jantar e eventos.',
            description: 'Vestido midi de caimento elegante, pensado para transitar entre escritorio, jantar e momentos especiais.',
            sizes: ['XS', 'S', 'M', 'L'],
            colors: ['Preto', 'Marfim', 'Vinho']
        },
        {
            id: 'terra-sneaker',
            name: 'Terra Knit Sneaker',
            category: 'Calcados',
            price: 45900,
            stock: 16,
            image: 'images/roupa.jpg',
            badge: 'conforto',
            note: 'Tenis versatil para uso diario e viagens.',
            description: 'Tenis knit leve, respiravel e facil de combinar, com sola confortavel para longos dias em movimento.',
            sizes: ['38', '39', '40', '41', '42', '43'],
            colors: ['Branco', 'Preto', 'Verde']
        },
        {
            id: 'noir-belt',
            name: 'Noir Leather Belt',
            category: 'Acessorios',
            price: 22500,
            stock: 21,
            image: 'images/roupaSocial.jpg',
            badge: 'essencial',
            note: 'Cinto minimalista para completar looks casuais e sociais.',
            description: 'Cinto de pele com fivela discreta e acabamento minimalista para equilibrar looks casuais e sociais.',
            sizes: ['90', '95', '100', '105'],
            colors: ['Preto', 'Castanho']
        },
        {
            id: 'aurora-coat',
            name: 'Aurora Linen Coat',
            category: 'Feminino',
            price: 78900,
            stock: 9,
            image: 'images/roupa.jpg',
            badge: 'eco',
            note: 'Camada leve para looks casuais bem resolvidos.',
            description: 'Casaco leve em linho misto, ideal para criar camadas elegantes sem pesar no visual.',
            sizes: ['S', 'M', 'L'],
            colors: ['Camel', 'Marfim', 'Preto']
        },
        {
            id: 'atlas-shirt',
            name: 'Atlas Oxford Shirt',
            category: 'Masculino',
            price: 34900,
            stock: 16,
            image: 'images/roupaSocial.jpg',
            badge: 'classico',
            note: 'Camisa oxford estruturada para rotinas elegantes.',
            description: 'Camisa oxford com estrutura, toque macio e visual limpo para uma rotina masculina bem composta.',
            sizes: ['S', 'M', 'L', 'XL'],
            colors: ['Branco', 'Azul', 'Preto']
        },
        {
            id: 'mira-heels',
            name: 'Mira Soft Heels',
            category: 'Calcados',
            price: 49900,
            stock: 14,
            image: 'images/roupa.jpg',
            badge: 'elegante',
            note: 'Salto confortavel para eventos e dias de escritorio.',
            description: 'Salto de perfil elegante com palmilha macia para manter postura, conforto e presenca.',
            sizes: ['36', '37', '38', '39', '40'],
            colors: ['Preto', 'Nude', 'Dourado']
        },
        {
            id: 'solis-bag',
            name: 'Solis Crossbody Bag',
            category: 'Acessorios',
            price: 39900,
            stock: 11,
            image: 'images/roupaSocial.jpg',
            badge: 'pratico',
            note: 'Bolsa transversal compacta para o essencial do dia.',
            description: 'Bolsa transversal compacta, com espaco para o essencial e alca ajustavel para uso diario.',
            sizes: ['Unico'],
            colors: ['Preto', 'Camel', 'Marfim']
        },
        {
            id: 'noah-chino',
            name: 'Noah Slim Chino',
            category: 'Masculino',
            price: 42900,
            stock: 5,
            image: 'images/roupaSocial.jpg',
            badge: 'bestseller',
            note: 'Calca chino com corte limpo para combinar facil.',
            description: 'Calca chino slim com corte versatil para combinar com camisa, polo, tenis ou loafer.',
            sizes: ['38', '40', '42', '44', '46'],
            colors: ['Preto', 'Camel', 'Cinza']
        },
        {
            id: 'eva-set',
            name: 'Eva Tailored Set',
            category: 'Feminino',
            price: 89900,
            stock: 8,
            image: 'images/roupaSocial.jpg',
            badge: 'alfaiataria',
            note: 'Conjunto de alfaiataria feminino com presenca premium.',
            description: 'Conjunto feminino de alfaiataria com linhas firmes, proporcao moderna e presenca premium.',
            sizes: ['XS', 'S', 'M', 'L'],
            colors: ['Preto', 'Marfim', 'Verde']
        },
        {
            id: 'stride-loafer',
            name: 'Stride Leather Loafer',
            category: 'Calcados',
            price: 59900,
            stock: 19,
            image: 'images/roupa.jpg',
            badge: 'couro',
            note: 'Loafer em couro para uma base elegante e confortavel.',
            description: 'Loafer em pele com perfil classico, feito para elevar producoes sociais sem perder conforto.',
            sizes: ['39', '40', '41', '42', '43'],
            colors: ['Preto', 'Castanho']
        },
        {
            id: 'aria-scarf',
            name: 'Aria Silk Scarf',
            category: 'Acessorios',
            price: 19900,
            stock: 24,
            image: 'images/roupa.jpg',
            badge: 'detalhe',
            note: 'Lenco leve para dar acabamento a looks minimalistas.',
            description: 'Lenco macio e leve para usar no pescoco, cabelo, bolsa ou como detalhe final do look.',
            sizes: ['Unico'],
            colors: ['Marfim', 'Azul', 'Dourado']
        }
    ];

    function readStoredProducts() {
        try {
            const raw = localStorage.getItem(PRODUTOS_STORAGE_KEY);
            if (!raw) return null;

            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : null;
        } catch (error) {
            return null;
        }
    }

    function saveProducts(products) {
        localStorage.setItem(PRODUTOS_STORAGE_KEY, JSON.stringify(products));
        catalog = products;
    }

    function initCatalog() {
        const stored = readStoredProducts();
        if (stored && stored.length) {
            return stored;
        }

        saveProducts(DEFAULT_PRODUTOS);
        return DEFAULT_PRODUTOS;
    }

    let catalog = initCatalog();

    function getProducts() {
        return catalog;
    }

    function getProductById(id) {
        return catalog.find(product => product.id === id) || null;
    }

    function reloadProducts() {
        catalog = readStoredProducts() || DEFAULT_PRODUTOS;
        return catalog;
    }

    window.LuminaCatalog = {
        STORAGE_KEY: PRODUTOS_STORAGE_KEY,
        DEFAULT_PRODUTOS,
        getProducts,
        getProductById,
        reloadProducts,
        saveProducts
    };
})();
