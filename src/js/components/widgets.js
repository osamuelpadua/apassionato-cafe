// Carrossel (scroll-snap + setas + pontos + arraste com mouse) e acordeão (um item aberto por vez).
import { $, $$, icon, escapeHtml, reducedMotion } from '../utils.js';
import { testimonials, faq } from '../data/content.js';

export function renderTestimonials() {
  const track = $('[data-testimonials]');
  if (!track) return;
  track.innerHTML = testimonials.map((t, i) => {
    const initials = t.nome.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    return `
      <div class="t-card" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${testimonials.length}">
        <span class="t-card__quote" aria-hidden="true">“</span>
        <div class="t-card__stars" role="img" aria-label="5 de 5 estrelas">${icon('i-star').repeat(5)}</div>
        <blockquote class="t-card__text">${escapeHtml(t.texto)}</blockquote>
        <p class="t-card__who"><span class="t-card__avatar" aria-hidden="true">${initials}</span><span><b>${escapeHtml(t.nome)}</b><span>${escapeHtml(t.cidade)} <span class="tbc">exemplo</span></span></span></p>
      </div>`;
  }).join('');
}

export function initCarousel(root) {
  const track = $('[data-carousel-track]', root);
  const prev = $('[data-carousel-prev]', root);
  const next = $('[data-carousel-next]', root);
  const dotsBox = $('[data-carousel-dots]', root);
  const items = [...track.children];
  const behavior = () => (reducedMotion() ? 'auto' : 'smooth');

  const perView = () => Math.max(1, Math.round(track.clientWidth / (items[0]?.getBoundingClientRect().width || 1)));
  const pages = () => Math.max(1, items.length - perView() + 1);
  const index = () => {
    const x = track.scrollLeft;
    let best = 0, dist = Infinity;
    items.forEach((it, i) => { const d = Math.abs(it.offsetLeft - items[0].offsetLeft - x); if (d < dist) { dist = d; best = i; } });
    return best;
  };
  const go = (i) => {
    const it = items[Math.max(0, Math.min(items.length - 1, i))];
    track.scrollTo({ left: it.offsetLeft - items[0].offsetLeft, behavior: behavior() });
  };

  const renderDots = () => {
    const n = pages();
    dotsBox.innerHTML = Array.from({ length: n }, (_, i) => `<button type="button" aria-label="Ir para o depoimento ${i + 1}"></button>`).join('');
    $$('button', dotsBox).forEach((b, i) => b.addEventListener('click', () => go(i)));
    update();
  };
  const update = () => {
    const i = index();
    $$('button', dotsBox).forEach((b, k) => b.setAttribute('aria-current', String(k === Math.min(i, pages() - 1))));
    prev.disabled = i <= 0;
    next.disabled = i >= pages() - 1;
  };

  prev.addEventListener('click', () => go(index() - 1));
  next.addEventListener('click', () => go(index() + 1));
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index() - 1); }
  });

  // Arraste com mouse (no toque, o scroll nativo já arrasta)
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    const x0 = e.clientX, s0 = track.scrollLeft;
    let moved = false;
    track.classList.add('is-dragging');
    const move = (ev) => { const dx = ev.clientX - x0; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = s0 - dx; };
    const up = () => {
      track.classList.remove('is-dragging');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      go(index());
      if (moved) track.addEventListener('click', (ev) => ev.preventDefault(), { once: true, capture: true });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });

  new ResizeObserver(renderDots).observe(track);
  renderDots();
}

export function renderFaq() {
  const box = $('[data-accordion]');
  if (!box) return;
  box.innerHTML = faq.map((f, i) => `
    <div class="acc${i === 0 ? ' is-open' : ''}" data-reveal style="--reveal-delay:${i * 60}ms">
      <h3 style="margin:0;font:inherit">
        <button type="button" class="acc__btn" id="faq-b${i}" aria-expanded="${i === 0}" aria-controls="faq-p${i}">
          <span>${escapeHtml(f.q)}</span><span class="acc__icon" aria-hidden="true"></span>
        </button>
      </h3>
      <div class="acc__panel" id="faq-p${i}" role="region" aria-labelledby="faq-b${i}"${i === 0 ? '' : ' inert'}>
        <div><p>${escapeHtml(f.a)}${f.tbc ? ' <span class="tbc">confirmar</span>' : ''}</p></div>
      </div>
    </div>`).join('');
}

export function initAccordion(root) {
  const items = $$('.acc', root);
  items.forEach((item) => {
    const btn = $('.acc__btn', item);
    const panel = $('.acc__panel', item);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      items.forEach((other) => {
        const b = $('.acc__btn', other), p = $('.acc__panel', other);
        const on = other === item && open;
        other.classList.toggle('is-open', on);
        b.setAttribute('aria-expanded', String(on));
        p.inert = !on;
      });
      void panel;
    });
  });
}
