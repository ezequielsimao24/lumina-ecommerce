/**
 * Camada central de persistencia Lumina (localStorage).
 * Usada pela Home e pelo painel Admin.
 */
(function () {
    const KEYS = {
        CONFIG: 'config_lumina',
        NEWSLETTER: 'newsletter_lumina',
        ANALYTICS: 'analytics_lumina'
    };

    const DEFAULT_CONFIG = {
        whatsapp: {
            number: '244952685457',
            defaultMessage: 'Ola! Gostaria de finalizar o meu pedido na Lumina:'
        },
        social: {
            facebook: '#',
            instagram: '#',
            twitter: '#'
        },
        institutional: {
            storeName: 'Lumina',
            email: 'contacto@lumina.ao',
            address: 'Luanda, Angola'
        }
    };

    const DEFAULT_ANALYTICS = {
        whatsappClicks: 0,
        recentActivity: [
            {
                id: 'seed-1',
                type: 'system',
                label: 'Painel Lumina inicializado',
                date: new Date().toISOString()
            }
        ]
    };

    const DEFAULT_NEWSLETTER = [
        {
            id: 'lead-seed-1',
            email: 'cliente.demo@lumina.ao',
            date: new Date().toISOString()
        }
    ];

    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch (error) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function initConfig() {
        const stored = readJson(KEYS.CONFIG, null);
        if (stored && typeof stored === 'object') return stored;
        writeJson(KEYS.CONFIG, DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
    }

    function initAnalytics() {
        const stored = readJson(KEYS.ANALYTICS, null);
        if (stored && typeof stored === 'object') return stored;
        writeJson(KEYS.ANALYTICS, DEFAULT_ANALYTICS);
        return DEFAULT_ANALYTICS;
    }

    function initNewsletter() {
        const stored = readJson(KEYS.NEWSLETTER, null);
        if (Array.isArray(stored)) return stored;
        writeJson(KEYS.NEWSLETTER, DEFAULT_NEWSLETTER);
        return DEFAULT_NEWSLETTER;
    }

    let config = initConfig();
    let analytics = initAnalytics();
    let newsletter = initNewsletter();

    function getConfig() {
        return config;
    }

    function saveConfig(nextConfig) {
        config = {
            whatsapp: { ...config.whatsapp, ...(nextConfig.whatsapp || {}) },
            social: { ...config.social, ...(nextConfig.social || {}) },
            institutional: { ...config.institutional, ...(nextConfig.institutional || {}) }
        };
        writeJson(KEYS.CONFIG, config);
        return config;
    }

    function getAnalytics() {
        return analytics;
    }

    function logActivity(type, label) {
        const entry = {
            id: `act-${Date.now()}`,
            type,
            label,
            date: new Date().toISOString()
        };

        analytics.recentActivity = [entry, ...(analytics.recentActivity || [])].slice(0, 25);
        writeJson(KEYS.ANALYTICS, analytics);
        return entry;
    }

    function incrementWhatsappClicks(label = 'Clique de conversao WhatsApp') {
        analytics.whatsappClicks = Number(analytics.whatsappClicks || 0) + 1;
        logActivity('whatsapp', label);
        writeJson(KEYS.ANALYTICS, analytics);
        return analytics.whatsappClicks;
    }

    function getNewsletterLeads() {
        return newsletter;
    }

    function addNewsletterLead(email) {
        const normalized = String(email || '').trim().toLowerCase();
        if (!normalized) return null;

        const exists = newsletter.some(lead => lead.email === normalized);
        if (exists) return null;

        const lead = {
            id: `lead-${Date.now()}`,
            email: normalized,
            date: new Date().toISOString()
        };

        newsletter = [lead, ...newsletter];
        writeJson(KEYS.NEWSLETTER, newsletter);
        logActivity('newsletter', `Novo lead: ${normalized}`);
        return lead;
    }

    function reloadAll() {
        config = initConfig();
        analytics = initAnalytics();
        newsletter = initNewsletter();
    }

    window.LuminaStore = {
        KEYS,
        DEFAULT_CONFIG,
        getConfig,
        saveConfig,
        getAnalytics,
        logActivity,
        incrementWhatsappClicks,
        getNewsletterLeads,
        addNewsletterLead,
        reloadAll
    };
})();
