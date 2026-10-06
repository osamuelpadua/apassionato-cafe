// Cabeçalho fixo (transparente → marrom com desfoque após 80 px), menu do celular,
// barra fixa Comprar/Assinar (aparece quando os CTAs da primeira dobra saem da tela) e item ativo do menu.
import { $, $$, local } from '../utils.js';

export function initHeader() {
  const header = $('[data-header]');
  const page = document.body.dataset.page;

  // Na home, "index.html#x" vira "#x" para rolar sem recarregar
  if (page === 'home') {
    $$('a[href^="index.html#"]').forEach((a) => a.setAttribute('href', a.getAttribute('href').replace('index.html', '')));
  }
  $$('[data-only]').forEach((el) => { if (el.dataset.only !== page) el.remove(); });

  // Fundo sólido: sempre fora da primeira dobra da home
  const solidAlways = page !== 'home' && !document.querySelector('.chapter-hero');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    header.classList.toggle('is-solid', solidAlways || window.scrollY > 80);
  };
  onScroll();
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // Menu do celular
  const menu = $('[data-menu]');
  const openBtn = $('[data-menu-open]');
  const closeBtn = $('[data-menu-close]');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
    document.body.classList.toggle('menu-open', open);
    if (open) closeBtn.focus(); else openBtn.focus();
  };
  openBtn?.addEventListener('click', () => setMenu(true));
  closeBtn?.addEventListener('click', () => setMenu(false));
  menu?.addEventListener('click', (e) => { if (e.target.closest('nav a')) setMenu(false); });
  menu?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setMenu(false);
    if (e.key === 'Tab') { // foco preso no menu
      const f = $$('a, button', menu).filter((el) => el.offsetParent !== null);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Barra fixa do celular
  const mbar = $('[data-mbar]');
  const heroCtas = $('[data-hero-ctas]');
  const showBar = (on) => { mbar?.classList.toggle('is-visible', on); document.body.classList.toggle('mbar-on', on); };
  if (heroCtas) {
    new IntersectionObserver(([en]) => showBar(!en.isIntersecting && en.boundingClientRect.top < 0), { threshold: 0 }).observe(heroCtas);
  } else showBar(true);

  // Item ativo do menu conforme a seção na tela
  if (page === 'home') {
    const links = $$('.site-nav a[data-nav]');
    const targets = links.map((a) => document.getElementById(a.dataset.nav)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === en.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach((t) => io.observe(t));
  } else if (page === 'historia') {
    $('.site-nav a[data-nav="historia"]')?.setAttribute('aria-current', 'page');
  }

  // Aviso de cookies
  const bar = $('[data-cookie]');
  if (bar && !local.get('cookie-ok')) {
    bar.hidden = false;
    $('[data-cookie-ok]', bar).addEventListener('click', () => { local.set('cookie-ok', '1'); bar.hidden = true; });
  }
}
