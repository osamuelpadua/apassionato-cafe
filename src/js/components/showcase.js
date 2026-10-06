// Vitrine: cartões gerados a partir de products.js + filtro por formato com troca animada (FLIP).
import { products, FORMATS } from '../data/products.js';
import { $, $$, pic, escapeHtml, reducedMotion } from '../utils.js';

export function productCard(p, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  return `
    <article class="p-card" data-id="${p.id}" data-format="${p.formato}">
      <div class="p-card__stage">
        <span class="badge p-card__tag">${escapeHtml(p.selo)}</span>
        <span class="p-card__disc" aria-hidden="true"></span>
        <span class="p-card__img">${pic(p.imagem, { sizes: '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 70vw', alt: `Embalagem ${p.nomeCompleto}` })}</span>
      </div>
      <${h} class="p-card__name">${escapeHtml(p.nome)}</${h}>
      <p class="p-card__desc">${escapeHtml(p.curta)}</p>
      <span class="p-card__more" aria-hidden="true">Mais informações</span>
      <button type="button" class="p-card__hit" data-open-product="${p.id}"><span class="sr-only">Mais informações sobre ${escapeHtml(p.nomeCompleto)}</span></button>
    </article>`;
}

export function initShowcase() {
  const grid = $('[data-showcase]');
  if (!grid) return;
  grid.innerHTML = products.map((p) => `<div role="listitem" data-format="${p.formato}">${productCard(p)}</div>`).join('');
  const live = $('[data-showcase-live]');
  const chips = $$('[data-filter]');

  const apply = (filter) => {
    const items = $$('[role="listitem"]', grid);
    // FLIP: guarda posições, troca, anima a diferença
    const first = new Map(items.map((el) => [el, el.getBoundingClientRect()]));
    items.forEach((el) => {
      const show = filter === 'todos' || el.dataset.format === filter;
      el.hidden = !show;
    });
    const shown = items.filter((el) => !el.hidden);
    if (!reducedMotion()) {
      shown.forEach((el, i) => {
        const a = first.get(el), b = el.getBoundingClientRect();
        const wasHidden = a.width === 0;
        const dx = a.left - b.left, dy = a.top - b.top;
        el.animate(wasHidden
          ? [{ opacity: 0, transform: 'translate3d(0,16px,0) scale(.97)' }, { opacity: 1, transform: 'none' }]
          : [{ transform: `translate3d(${dx}px, ${dy}px, 0)` }, { transform: 'none' }],
          { duration: 420, delay: wasHidden ? i * 40 : 0, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)', fill: 'backwards' });
      });
    }
    if (window.matchMedia('(max-width: 767px)').matches) grid.scrollTo({ left: 0, behavior: 'smooth' });
    live.textContent = `${shown.length} ${shown.length === 1 ? 'café' : 'cafés'} em ${filter === 'todos' ? 'todos os formatos' : FORMATS[filter]}`;
  };

  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    apply(c.dataset.filter);
  }));
}
