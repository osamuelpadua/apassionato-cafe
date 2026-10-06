import sizes from './data/image-sizes.json';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
/** Aparelho de baixa potência: desliga o parallax. */
export const lowPower = () => (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 2);

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** <picture> AVIF + WebP a partir do manifesto gerado por scripts/optimize-images.mjs */
export function pic(name, { sizes: sz = '100vw', alt = '', cls = '', imgCls = '', loading = 'lazy' } = {}) {
  const m = sizes[name];
  if (!m) return '';
  const set = (ext) => m.widths.map((w) => `img/${name}-${w}.${ext} ${w}w`).join(', ');
  const fb = m.widths.find((w) => w >= 480) || m.widths[m.widths.length - 1];
  const h = Math.round(1000 * m.ratio);
  return `<picture class="pic ${cls}"><source type="image/avif" srcset="${set('avif')}" sizes="${sz}"><source type="image/webp" srcset="${set('webp')}" sizes="${sz}"><img src="img/${name}-${fb}.webp" width="1000" height="${h}" alt="${escapeHtml(alt)}" class="${imgCls}" loading="${loading}" decoding="async"></picture>`;
}

export const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;

/** Anuncia uma mensagem para leitores de tela */
export function announce(msg) {
  const live = document.querySelector('[data-live]');
  if (!live) return;
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = msg; });
}

/** sessionStorage protegido (pode falhar em janela privada) */
export const session = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* sem armazenamento */ } },
};
export const local = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } },
};
