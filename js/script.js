const sliderWrapper = document.getElementById('sliderWrapper');
const slides = document.querySelectorAll('.slide');

// Conta o total de slides reais antes do clone final
const totalSlidesReais = slides.length - 1;

let indexAtual = 0;
const tempoTroca = 6000; // Troca a cada 6 segundos

function alternarSlide() {
    // Remove as animações do slide que está a sair
    slides[indexAtual].classList.remove('active-slide');

    indexAtual++;

    // Desliza a linha horizontal
    sliderWrapper.style.transition = "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
    sliderWrapper.style.transform = `translateX(-${indexAtual * 100}vw)`;

    // Aplica as animações ao novo slide
    if (indexAtual < slides.length) {
        slides[indexAtual].classList.add('active-slide');
    }

    // Mecânica do Reset Invisível (Fim do Slider)
    if (indexAtual === totalSlidesReais) {
        setTimeout(() => {
            sliderWrapper.style.transition = "none";
            slides[indexAtual].classList.remove('active-slide');

            indexAtual = 0;
            sliderWrapper.style.transform = `translateX(0vw)`;

            // Força o reset de renderização do browser
            void sliderWrapper.offsetWidth;
            slides[indexAtual].classList.add('active-slide');
        }, 800); // Aguarda exatamente os 800ms da animação acabar
    }
}

// Inicializa o temporizador automático
setInterval(alternarSlide, tempoTroca);


// ==========================================================================
// MONITORIZAÇÃO DO SCROLL PARA MUDANÇA DE COR DA NAVBAR
// ==========================================================================
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});









// ==========================================================================
// FILTRO DE CATEGORIAS
// ==========================================================================
const botoesCategoria = document.querySelectorAll('.category-btn');

botoesCategoria.forEach(botao => {
    botao.addEventListener('click', () => {
        const botaoAtivoAntigo = document.querySelector('.category-btn.active');
        if (botaoAtivoAntigo) {
            botaoAtivoAntigo.classList.remove('active');
        }
        botao.classList.add('active');
    });
});