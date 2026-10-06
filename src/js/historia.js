import '../styles/main.css';
import '../styles/historia.css';
import { $, $$, pic, icon, escapeHtml, reducedMotion } from './utils.js';
import { chapters, bySlug } from './data/chapters.js';
import { byId } from './data/products.js';
import { initAnalytics, track } from './components/analytics.js';
import { initHeader } from './components/header.js';
import { initProductModal } from './components/productModal.js';
import { productCard } from './components/showcase.js';
import { initReveal, initParallax } from './components/motion.js';

const DEFAULT = 'colheita';
const TBC = ' <span class="tbc">confirmar</span>';

function renderBody(c) {
  const parts = c.corpo.map((b) => {
    if (b.p) return `<p${b.capitular ? ' class="has-dropcap"' : ''}>${escapeHtml(b.p)}</p>`;
    if (b.h) return `<h2>${escapeHtml(b.h)}</h2>`;
    if (b.foto) return `<figure class="prose__wide">${pic(b.foto, { sizes: '(min-width: 1024px) 1100px, 100vw', alt: b.alt })}<figcaption>${escapeHtml(b.legenda)}</figcaption></figure>`;
    if (b.galeria) return `
      <div class="gallery" role="group" aria-label="Galeria de fotos">
        <ul class="gallery__track" role="list" tabindex="0">
          ${b.galeria.map((g) => `<li><figure>${pic(g.img, { sizes: '(min-width: 1024px) 360px, 80vw', alt: g.alt })}<figcaption>${escapeHtml(g.legenda)}</figcaption></figure></li>`).join('')}
        </ul>
      </div>`;
    if (b.video) return videoBlock(c);
    return '';
  });
  if (!c.corpo.some((b) => b.video)) parts.push(videoBlock(c));
  // citação depois do 2º parágrafo
  const quote = `<blockquote class="pull"><span class="pull__mark script" aria-hidden="true">“</span><p>${escapeHtml(c.citacao)}</p></blockquote>`;
  const idx = c.corpo.findIndex((b, i) => b.p && c.corpo.slice(0, i + 1).filter((x) => x.p).length === 2);
  parts.splice(idx >= 0 ? idx + 1 : parts.length, 0, quote);
  return `<p class="prose__note">Textos sugeridos a partir do briefing${TBC}</p>${parts.join('')}`;
}

function videoBlock(c) {
  return `
    <figure class="player" data-player>
      <button type="button" class="player__poster" data-play aria-label="Assistir ao vídeo: ${escapeHtml(c.video.titulo)}">
        ${pic(c.video.poster, { sizes: '(min-width: 1024px) 760px, 100vw', alt: '' })}
        <span class="player__btn" aria-hidden="true">${icon('i-play')}</span>
        <span class="player__meta"><b>${escapeHtml(c.video.titulo)}</b><span>Duração a confirmar</span></span>
      </button>
      <figcaption class="placeholder-note">Vídeo: ${escapeHtml(c.eyebrow.toLowerCase())} · 16:9 · carrega só ao clicar</figcaption>
    </figure>`;
}

function render(slug, { scroll = false } = {}) {
  const c = bySlug(slug) || bySlug(DEFAULT);
  const i = chapters.indexOf(c);
  document.title = `${c.eyebrow} — Nossa história · Appassionato Café`;

  $('[data-ch-bg]').innerHTML = pic(c.imagem, { sizes: '100vw', alt: '', loading: 'eager' });
  $('[data-ch-num]').textContent = c.num;
  $('[data-ch-eyebrow]').textContent = `Capítulo ${c.num} · ${c.eyebrow}`;
  $('[data-ch-title]').innerHTML = escapeHtml(c.titulo) + TBC;
  $('[data-ch-lead]').textContent = c.abertura;
  $('[data-ch-ph]').textContent = `Foto ou vídeo: ${c.eyebrow.toLowerCase()} · 16:9 (provisória)`;
  $('[data-ch-body]').innerHTML = renderBody(c);

  // Índice lateral / menu recolhível
  $('[data-toc-current]').textContent = `${c.num} · ${c.eyebrow}`;
  $('[data-toc-list]').innerHTML = chapters.map((x) => `
    <li><a href="#${x.slug}"${x === c ? ' aria-current="page"' : ''}><span class="script">${x.num}</span>${escapeHtml(x.eyebrow)}</a></li>`).join('');

  // Cartões dos 5 capítulos + anterior/próximo
  $('[data-ch-cards]').innerHTML = chapters.map((x) => `
    <li class="ch-card${x === c ? ' is-current' : ''}">
      <a href="#${x.slug}"${x === c ? ' aria-current="page"' : ''}>
        <span class="ch-card__img">${pic(x.imagem, { sizes: '(min-width: 1024px) 260px, 60vw', alt: '' })}</span>
        <span class="ch-card__num script" aria-hidden="true">${x.num}</span>
        <span class="ch-card__name">${escapeHtml(x.eyebrow)}</span>
        ${x === c ? '<span class="ch-card__here">Você está aqui</span>' : ''}
      </a>
    </li>`).join('');
  const prev = chapters[i - 1], next = chapters[i + 1];
  const pBtn = $('[data-ch-prev]'), nBtn = $('[data-ch-next]');
  pBtn.hidden = !prev; nBtn.hidden = !next;
  if (prev) pBtn.href = `#${prev.slug}`;
  if (next) nBtn.href = `#${next.slug}`;

  $$('[data-play]').forEach((b) => b.addEventListener('click', () => {
    // O vídeo real entra aqui (carregado só ao clicar). Enquanto não chega, mostra o aviso.
    const fig = b.closest('[data-player]');
    fig.classList.add('is-playing');
    b.insertAdjacentHTML('afterend', '<p class="player__soon" role="status">Vídeo em produção. Assim que o cliente enviar o arquivo, ele toca aqui. <span class="tbc">confirmar</span></p>');
    b.disabled = true;
    track('video_play', { capitulo: c.slug });
  }, { once: true }));

  track('capitulo_aberto', { capitulo: c.slug });
  if (scroll) window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
}

initAnalytics();
initHeader();
initProductModal();

// Faixa "Prove essa história": 3 cafés que abrem o mesmo modal da home
$('[data-taste]').innerHTML = ['delicato', 'moderato-intenso', 'especial'].map((id) => `<div role="listitem">${productCard(byId(id))}</div>`).join('');

const slugFromHash = () => (location.hash || '').replace('#', '') || DEFAULT;
render(bySlug(slugFromHash()) ? slugFromHash() : DEFAULT);
window.addEventListener('hashchange', () => {
  const s = slugFromHash();
  if (bySlug(s)) { render(s, { scroll: true }); const toc = $('[data-toc]'); if (window.matchMedia('(max-width: 1023px)').matches) toc.open = false; }
});
if (window.matchMedia('(max-width: 1023px)').matches) $('[data-toc]').open = false;

initReveal();
initParallax();
