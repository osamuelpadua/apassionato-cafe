// Neon na borda (miniaturas de vídeo): ao passar o mouse ou focar pelo teclado, um traço laranja dá uma volta
// na borda e some. O traço é um <svg> injetado; o JS só mede o perímetro e liga a classe — a animação é do CSS.
import { $$, reducedMotion } from '../utils.js';

const SVG = '<svg class="neon" aria-hidden="true">'
  + ['trail', 'mid', 'head'].map((k) => `<rect class="neon__${k}" width="100%" height="100%"/>`).join('')
  + '</svg>';

export function initNeon(sel = '.vthumb') {
  if (reducedMotion()) return;
  $$(sel).forEach((el) => {
    el.insertAdjacentHTML('beforeend', SVG);
    const rects = $$('rect', el.lastElementChild);
    const run = () => {
      if (el.classList.contains('is-neon')) return; // a volta em curso termina antes de outra começar
      // o traço corre na borda interna: raio interno = raio externo − espessura da borda
      const cs = getComputedStyle(el);
      const w = el.clientWidth;
      const h = el.clientHeight;
      const r = Math.min(w / 2, h / 2, Math.max(0, parseFloat(cs.borderTopLeftRadius) - parseFloat(cs.borderTopWidth)));
      rects.forEach((rc) => rc.setAttribute('rx', r));
      el.style.setProperty('--p', `${(2 * (w + h) - (8 - 2 * Math.PI) * r).toFixed(1)}px`);
      el.classList.add('is-neon');
    };
    el.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') run(); });
    el.addEventListener('focus', () => { if (el.matches(':focus-visible')) run(); });
    el.addEventListener('animationend', (e) => { if (e.animationName === 'neon-lap') el.classList.remove('is-neon'); });
  });
}
