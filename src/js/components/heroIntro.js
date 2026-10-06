// Entrada coreografada da primeira dobra: a linha se desenha, o título nasce de dentro da divisão,
// a alça aparece e a faixa inferior sobe. As imagens (LCP) já estão visíveis desde o primeiro quadro.
import { $, reducedMotion } from '../utils.js';

export function initHeroIntro() {
  const hero = $('[data-hero]');
  if (!hero) return;
  if (reducedMotion()) { hero.classList.add('is-in', 'is-settled'); return; }
  const go = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    hero.classList.add('is-in');
    setTimeout(() => hero.classList.add('is-settled'), 1600); // depois da entrada, sem atrasos nas transições
  }));
  // espera as fontes (no máximo 700 ms) para o título não trocar de fonte no meio do movimento
  const fonts = document.fonts?.ready || Promise.resolve();
  Promise.race([fonts, new Promise((r) => setTimeout(r, 700))]).then(go);
  // a interação no slider também esconde a dica
  hero.querySelector('.cmp')?.addEventListener('pointerdown', () => hero.classList.add('is-touched'), { once: true });
}
