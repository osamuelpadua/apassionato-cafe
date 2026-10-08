// Cabeçalho fixo (transparente → marrom com desfoque após 80 px; no desktop recolhe ao símbolo ao descer), menu do celular,
// barra fixa Comprar/Assinar (aparece quando os CTAs da primeira dobra saem da tela) e item ativo do menu.
import { $, $$, local } from '../utils.js';
import { smooth } from './smooth.js';

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

  // Recolher ao descer (só desktop com mouse): a barra sobe e fica o símbolo. Volta ao subir alguns px,
  // com o mouse sobre o símbolo (some de novo ao sair do cabeçalho) ou com o foco do teclado dentro dele.
  const desk = window.matchMedia('(min-width: 1024px) and (hover: hover)');
  const TUCK_FROM = 160; // perto do topo, sempre visível
  const TUCK_RUN = 6;    // px descendo para recolher
  const SHOW_RUN = 24;   // px subindo para reaparecer
  let lastY = window.scrollY, run = 0, tucked = false, hover = false, focus = false;
  const applyTuck = () => header.classList.toggle('is-tucked', desk.matches && tucked && !hover && !focus);

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('is-solid', solidAlways || y > 80);
    const dy = y - lastY;
    lastY = y;
    if (dy && (dy > 0) !== (run > 0)) run = 0; // trocou de sentido: recomeça a contagem
    run += dy;
    if (y < TUCK_FROM) tucked = false;
    else if (run > TUCK_RUN) tucked = true;
    else if (run < -SHOW_RUN) tucked = false;
    applyTuck();
  };
  onScroll();
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  // recolhido, só o símbolo recebe o mouse: entrar nele conta como entrar no cabeçalho
  header.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { hover = true; applyTuck(); } });
  header.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { hover = false; applyTuck(); } });
  header.addEventListener('focusin', (e) => { focus = e.target.matches(':focus-visible'); applyTuck(); });
  header.addEventListener('focusout', (e) => { if (!header.contains(e.relatedTarget)) { focus = false; applyTuck(); } });
  desk.addEventListener('change', applyTuck);

  // Menu do celular
  const menu = $('[data-menu]');
  const openBtn = $('[data-menu-open]');
  const closeBtn = $('[data-menu-close]');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    openBtn.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
    document.body.classList.toggle('menu-open', open);
    open ? smooth.stop() : smooth.start();
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
  const hero = $('[data-hero]');
  let barOn = null;
  const showBar = (on) => { if (on === barOn) return; barOn = on; mbar?.classList.toggle('is-visible', on); document.body.classList.toggle('mbar-on', on); };
  // o hero é fixo (sticky): a barra aparece quando a história já cobriu metade da primeira dobra
  const checkBar = () => showBar(!hero || window.scrollY > window.innerHeight * 0.55);
  checkBar();
  window.addEventListener('scroll', checkBar, { passive: true });

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
    // aviso discreto: só depois que a pessoa começa a rolar (ou após 6 s), para não poluir a primeira dobra
    const show = () => { bar.hidden = false; window.removeEventListener('scroll', onFirst); };
    const onFirst = () => { if (window.scrollY > window.innerHeight * 0.4) show(); };
    window.addEventListener('scroll', onFirst, { passive: true });
    setTimeout(show, 6000);
    $('[data-cookie-ok]', bar).addEventListener('click', () => { local.set('cookie-ok', '1'); bar.hidden = true; });
  }
}
