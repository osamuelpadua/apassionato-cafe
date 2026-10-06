// Vitrine: cartões gerados a partir de products.js + filtro por formato com troca animada (FLIP).
import { products, FORMATS } from '../data/products.js';
import { $, $$, pic, icon, escapeHtml, reducedMotion } from '../utils.js';

export function productCard(p, { headingLevel = 3 } = {}) {
  const h = `h${headingLevel}`;
  const [base, extra] = p.titulo || [p.nome, ''];
  return `
    <article class="p-card" data-id="${p.id}" data-format="${p.formato}">
      <div class="p-card__stage">
        <span class="p-card__disc" aria-hidden="true"></span>
        <span class="p-card__floor" aria-hidden="true"></span>
        <span class="p-card__img">${pic(p.imagem, { sizes: '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 70vw', alt: `Embalagem ${p.nomeCompleto}` })}</span>
      </div>
      <div class="p-card__body">
        <p class="p-card__meta">${escapeHtml(p.selo)}</p>
        <${h} class="p-card__name">${escapeHtml(base)}${extra ? ` <em>${escapeHtml(extra)}</em>` : ''}</${h}>
        <p class="p-card__desc">${escapeHtml(p.curta)}</p>
        <div class="p-card__foot" aria-hidden="true">
          <span class="p-card__more">Mais informações</span>
          <span class="p-card__arrow">${icon('i-arrow-right')}</span>
        </div>
      </div>
      <button type="button" class="p-card__hit" data-open-product="${p.id}"><span class="sr-only">Mais informações sobre ${escapeHtml(p.nomeCompleto)}</span></button>
    </article>`;
}

export function initShowcase() {
  const grid = $('[data-showcase]');
  if (!grid) return;
  grid.innerHTML = products.map((p, i) => `<div role="listitem" data-format="${p.formato}" data-reveal="card" style="--reveal-delay:${(i % 4) * 90}ms">${productCard(p)}</div>`).join('');
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
    shown.forEach((el) => el.classList.add('is-in')); // depois de filtrar, os cartões já estão no lugar
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
