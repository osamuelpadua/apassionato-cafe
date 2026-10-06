// Modal de produto: janela de 2 colunas no desktop, bottom sheet (92 % da altura) no celular.
// Fecha por X, ESC, clique no véu ou arrastando para baixo. Foco preso e devolvido; rolagem do fundo travada.
// Hash #cafe-<id> para compartilhar; setas para o café anterior e o próximo.
import { products, byId, FORMATS } from '../data/products.js';
import { storeUrl, waUrl, WA_MSG, CLUB_PATH } from '../data/links.js';
import { $, $$, pic, icon, escapeHtml, reducedMotion, isMobile } from '../utils.js';
import { track } from './analytics.js';

export function initProductModal() {
  const modal = $('[data-modal]');
  if (!modal) return { open() {} };
  const dialog = $('.modal__dialog', modal);
  const media = $('[data-modal-media]', modal);
  const body = $('[data-modal-body]', modal);
  const bar = $('[data-modal-bar]', modal);
  let current = null;
  let variant = 0;
  let opener = null;
  let scrollY = 0;
  let prevHash = '';
  const list = products;

  const tbc = (p, field) => (p.tbc?.includes(field) ? ' <span class="tbc">confirmar</span>' : '');

  function renderBar(p) {
    const v = p.variacoes[variant];
    const store = storeUrl(v.path, `modal-${p.id}`);
    const msg = WA_MSG.product(p.nomeCompleto, v.rotulo);
    bar.innerHTML = `
      <a class="btn btn--buy" href="${store}" target="_blank" rel="noopener" data-track="comprar" data-track-place="modal-${p.id}">${icon('i-cart')}Comprar pela loja virtual</a>
      <a class="btn btn--wa" href="${waUrl(msg)}" target="_blank" rel="noopener" data-track="whatsapp" data-track-place="modal-${p.id}">${icon('i-whatsapp')}Comprar por WhatsApp</a>`;
  }

  function render(p) {
    media.innerHTML = `
      ${pic('ramo-h-dark', { sizes: '600px', cls: 'modal__branch' })}
      <span class="modal__disc" aria-hidden="true"></span>
      <span class="modal__pack">${pic(p.imagem, { sizes: '(min-width: 768px) 420px, 60vw', alt: `Embalagem ${p.nomeCompleto}`, loading: 'eager' })}</span>
      ${p.tbc?.includes('imagem') ? '<span class="placeholder-note">Embalagem provisória · aguardando foto oficial</span>' : ''}`;
    const variants = p.variacoes.length > 1 ? `
      <fieldset class="modal__variants">
        <legend>${p.formato === 'kits' ? 'Escolha o kit' : 'Escolha o peso'}</legend>
        <div class="chips" role="radiogroup" aria-label="${p.formato === 'kits' ? 'Kit' : 'Peso'}">
          ${p.variacoes.map((v, i) => `<button type="button" class="chip" role="radio" aria-checked="${i === variant}" tabindex="${i === variant ? 0 : -1}" data-variant="${i}">${escapeHtml(v.rotulo)}</button>`).join('')}
        </div>
      </fieldset>` : '';
    body.innerHTML = `
      <div class="modal__cat"><span class="badge">${FORMATS[p.formato]}</span><span class="eyebrow">Linha ${escapeHtml(p.linha)}</span></div>
      <h2 class="modal__name" id="modal-title">${escapeHtml(p.nomeCompleto)}</h2>
      <div class="chips" aria-label="Notas sensoriais">${p.notas.map((n) => `<span class="chip chip--note">${escapeHtml(n)}</span>`).join('')}${tbc(p, 'Notas')}</div>
      <div class="modal__desc">${p.completa.map((t) => `<p>${escapeHtml(t)}</p>`).join('')}${tbc(p, 'completa')}</div>
      ${variants}
      <dl class="modal__spec">
        ${Object.entries(p.ficha).map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}${tbc(p, k)}</dd></div>`).join('')}
      </dl>
      ${p.clube ? `<a class="link-arrow modal__club" href="${storeUrl(CLUB_PATH, `modal-${p.id}`)}" target="_blank" rel="noopener" data-track="assinar" data-track-place="modal-${p.id}">Ou assine e ganhe até 22% de desconto <span aria-hidden="true">→</span></a>` : ''}
      ${p.tbc?.includes('link') ? `<p class="lead" style="font-size:.875rem">Link da loja aponta para a categoria Especial <span class="tbc">confirmar link do Drip</span></p>` : ''}`;
    renderBar(p);
    $$('[data-variant]', body).forEach((btn, i, all) => {
      btn.addEventListener('click', () => {
        variant = +btn.dataset.variant;
        all.forEach((b) => { b.setAttribute('aria-checked', String(b === btn)); b.tabIndex = b === btn ? 0 : -1; });
        renderBar(p);
      });
      btn.addEventListener('keydown', (e) => {
        const n = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (n) { e.preventDefault(); const next = all[(i + n + all.length) % all.length]; next.focus(); next.click(); }
      });
    });
    body.scrollTop = 0;
  }

  function lockScroll(on) {
    if (on) {
      scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    }
    document.body.classList.toggle('modal-open', on);
  }

  function open(id, from, { fromHash = false } = {}) {
    const p = byId(id);
    if (!p) return;
    const wasOpen = modal.classList.contains('is-open');
    current = p;
    variant = 0;
    render(p);
    if (!wasOpen) {
      opener = from || document.activeElement;
      prevHash = location.hash.startsWith('#cafe-') ? '' : location.hash;
      lockScroll(true);
      modal.setAttribute('aria-hidden', 'false');
      modal.style.setProperty('--drag-y', '0px');
      requestAnimationFrame(() => modal.classList.add('is-open'));
      document.addEventListener('keydown', onKey);
    }
    if (!fromHash) history.replaceState(null, '', `#cafe-${p.id}`);
    setTimeout(() => $('.modal__close', modal).focus({ preventScroll: true }), 30);
    track('modal_aberto', { cafe: p.id });
  }

  function close() {
    if (!modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    document.removeEventListener('keydown', onKey);
    const done = () => {
      modal.setAttribute('aria-hidden', 'true');
      lockScroll(false);
      modal.style.setProperty('--drag-y', '0px');
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
    reducedMotion() ? done() : setTimeout(done, 250);
    if (location.hash.startsWith('#cafe-')) history.replaceState(null, '', location.pathname + location.search + prevHash);
  }

  const step = (n) => {
    const i = list.indexOf(current);
    open(list[(i + n + list.length) % list.length].id);
  };

  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      const f = $$('a[href], button:not([disabled]), [tabindex="0"]', dialog).filter((el) => el.offsetParent !== null || el === document.activeElement);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  $$('[data-modal-close]', modal).forEach((b) => b.addEventListener('click', close));
  $('[data-modal-prev]', modal).addEventListener('click', () => step(-1));
  $('[data-modal-next]', modal).addEventListener('click', () => step(1));

  // Arrastar para baixo para fechar (bottom sheet)
  const grab = $('[data-modal-grab]', modal);
  grab.addEventListener('pointerdown', (e) => {
    if (!isMobile()) return;
    const y0 = e.clientY;
    let dy = 0;
    grab.setPointerCapture(e.pointerId);
    modal.classList.add('is-dragging');
    const move = (ev) => { dy = Math.max(0, ev.clientY - y0); modal.style.setProperty('--drag-y', `${dy}px`); };
    const up = () => {
      modal.classList.remove('is-dragging');
      grab.removeEventListener('pointermove', move);
      grab.removeEventListener('pointerup', up);
      grab.removeEventListener('pointercancel', up);
      if (dy > 120) close(); else modal.style.setProperty('--drag-y', '0px');
    };
    grab.addEventListener('pointermove', move);
    grab.addEventListener('pointerup', up);
    grab.addEventListener('pointercancel', up);
  });

  // Abrir pelos cartões (delegação)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open-product]');
    if (t) { e.preventDefault(); open(t.dataset.openProduct, t); }
  });

  // Hash para compartilhar
  const fromHash = () => {
    const m = location.hash.match(/^#cafe-([\w-]+)/);
    if (m && byId(m[1])) open(m[1], null, { fromHash: true });
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();

  return { open, close };
}
