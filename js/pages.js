document.querySelectorAll('[data-faq-question]').forEach(button => {
    button.addEventListener('click', () => {
        const item = button.closest('.faq-item');
        if (!item) return;

        const isOpen = item.classList.toggle('open');
        button.setAttribute('aria-expanded', String(isOpen));
    });
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
