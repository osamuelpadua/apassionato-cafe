// Revelação ao rolar e parallax (só transform translate3d, com requestAnimationFrame).
import { $$, reducedMotion, lowPower, isMobile } from '../utils.js';

/** Fade + subida de 24 px, 600 ms; itens do mesmo grupo com 80 ms de intervalo; dispara uma vez a 15%. */
export function initReveal() {
  const items = $$('[data-reveal]');
  if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('is-in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 });
  items.forEach((el) => io.observe(el));
}

/** Escalona filhos de um grupo (atraso de 80 ms entre eles). */
export function stagger(container, selector = '[data-reveal]', step = 80) {
  $$(selector, container).forEach((el, i) => el.style.setProperty('--reveal-delay', `${i * step}ms`));
}

/**
 * Parallax: cada [data-parallax="v"] se move a v× a velocidade da rolagem relativa ao seu bloco.
 * Fundo 0,15–0,3; primeiro plano 0,4–0,6. No celular, no máximo 2 camadas (data-parallax-mobile="off" desliga).
 */
export function initParallax() {
  if (reducedMotion() || lowPower()) return;
  let els = [];
  const collect = () => {
    const mobile = isMobile();
    els = $$('[data-parallax]').filter((el) => !(mobile && el.dataset.parallaxMobile === 'off')).map((el) => ({
      el, speed: parseFloat(el.dataset.parallax) || 0.2, box: el.closest('.jstep, .final, .chapter-hero, section') || el.parentElement,
    }));
  };
  collect();
  const visible = new Set();
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    const item = els.find((x) => x.box === en.target);
    if (!item) return;
    els.filter((x) => x.box === en.target).forEach((x) => (en.isIntersecting ? visible.add(x) : visible.delete(x)));
  }), { rootMargin: '20% 0px' });
  new Set(els.map((x) => x.box)).forEach((b) => io.observe(b));

  let raf = 0;
  const update = () => {
    raf = 0;
    const vh = window.innerHeight;
    visible.forEach(({ el, speed, box }) => {
      const r = box.getBoundingClientRect();
      const center = r.top + r.height / 2 - vh / 2; // distância do centro do bloco ao centro da tela
      el.style.transform = `translate3d(0, ${(-center * speed * 0.35).toFixed(1)}px, 0)`;
    });
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}
