// Jornada "Da semente à xícara": indicador de progresso (pontos-grão no desktop, barra fina no celular).
import { $, $$ } from '../utils.js';

export function initJourney() {
  const track = $('[data-journey]');
  if (!track) return;
  const steps = $$('.jstep', track);
  const dots = $$('[data-jdot]', track);
  const bar = $('.jprogress-bar span', track);

  const setActive = (i) => dots.forEach((d, k) => {
    d.classList.toggle('is-active', k === i);
    if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setActive(+en.target.dataset.step); });
  }, { rootMargin: '-50% 0px -50% 0px' });
  steps.forEach((s) => io.observe(s));

  let raf = 0;
  const update = () => {
    raf = 0;
    const r = track.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (window.innerHeight * 0.5 - r.top) / r.height));
    bar?.parentElement.style.setProperty('--jp', p.toFixed(3));
    if (bar) bar.style.transform = `scaleX(${p.toFixed(3)})`;
  };
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}
