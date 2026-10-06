// Revelações ao rolar, com hierarquia:
//  data-reveal="head" → bloco de título: eyebrow desenha o fio, o h2 sobe por máscara, o resto vem em cascata
//  data-reveal="card" → cartão de produto: cartão, disco laranja e embalagem em tempos próprios
//  data-reveal="tile" → mosaico: janela que se abre e foto que assenta
//  data-reveal        → fade + subida suave
// Dispara uma vez, quando 15 % do elemento entra na tela.
import { $$ } from '../utils.js';

const HEADS = '.section__head[data-reveal], .final__text[data-reveal], .quiz__intro[data-reveal], .taste__text, .journey__end-inner';

/** Prepara blocos de título: máscara no h2 e índice de cascata nos filhos. */
function prepareHeads(root = document) {
  $$(HEADS, root).forEach((head) => {
    if (head.dataset.revealReady) return;
    head.dataset.revealReady = '1';
    head.dataset.reveal = 'head';
    [...head.children].forEach((child, i) => {
      child.style.setProperty('--ci', i);
      if (/^H[12]$/.test(child.tagName) && !child.classList.contains('rm')) {
        child.classList.add('rm');
        child.innerHTML = `<span class="rm__in">${child.innerHTML}</span>`;
      }
    });
  });
}

let io;
export function initReveal(root = document) {
  prepareHeads(root);
  const items = $$('[data-reveal]:not(.is-in)', root);
  if (!('IntersectionObserver' in window)) { items.forEach((el) => el.classList.add('is-in')); return; }
  io ??= new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -4% 0px' });
  items.forEach((el) => io.observe(el));
}
