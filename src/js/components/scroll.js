// Motor de rolagem: um único laço por quadro, sem leituras de layout durante a rolagem.
// Cada efeito tem measure() (no carregamento e ao redimensionar) e update(y, vh) (a cada quadro de rolagem).
// Escreve apenas variáveis CSS e classes; o CSS traduz em transform/opacity/clip-path.
import { $, $$, clamp, reducedMotion, lowPower, isMobile } from '../utils.js';
import { smooth } from './smooth.js';

const effects = [];
let vh = window.innerHeight;
let raf = 0;
let lastY = -1;

const absTop = (el) => el.getBoundingClientRect().top + window.scrollY;

function frame() {
  raf = 0;
  const y = window.scrollY;
  if (y === lastY) return;
  lastY = y;
  for (const fx of effects) fx.update(y, vh);
}
const request = () => { if (!raf) raf = requestAnimationFrame(frame); };
function measureAll() {
  vh = window.innerHeight;
  for (const fx of effects) fx.measure?.(vh);
  lastY = -1;
  frame();
}

export function addEffect(fx) { effects.push(fx); }

/** Linha de progresso de leitura no cabeçalho (vale também com reduced-motion: não é animação). */
function readingProgress() {
  const header = $('[data-header]');
  if (!header) return;
  let max = 1;
  addEffect({
    measure() { max = Math.max(1, document.documentElement.scrollHeight - vh); },
    update(y) { header.style.setProperty('--sp', (y / max).toFixed(4)); },
  });
}

/** Hero fixo que recua enquanto a história desliza por cima. */
function heroExit() {
  const hero = $('[data-hero]');
  if (!hero) return;
  let gone = false;
  addEffect({
    update(y, h) {
      const p = clamp(y / h, 0, 1);
      hero.style.setProperty('--hx', p.toFixed(4));
      const g = y > h * 1.05;
      if (g !== gone) { gone = g; hero.classList.toggle('is-gone', g); }
    },
  });
}

/** Jornada: cartões empilhados. --e = entrada (0 na base da tela → 1 no topo); --c = coberto pelo próximo. */
function journey(animate = true) {
  const track = $('[data-journey]');
  if (!track) return;
  const steps = $$('.jstep', track);
  const end = $('.journey__end', track);
  const dots = $$('[data-jdot]', track);
  const wrap = $('.jprogress-wrap', track);
  const bar = $('.jprogress-bar span', track);
  // índice de cada filho do conteúdo, para a cascata em CSS
  steps.forEach((s) => $$('.jstep__content > *', s).forEach((c, i) => c.style.setProperty('--i', i)));
  let tops = [];
  let endTop = 0;
  let active = -1;
  const covered = new Array(steps.length).fill(false);
  // os cartões são sticky: a âncora usa a posição natural de cada etapa, não a posição fixa
  dots.forEach((d, i) => d.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    smooth.to(tops[i] + 2, { duration: 1.6 });
    history.replaceState(null, '', d.getAttribute('href'));
  }));

  addEffect({
    measure() {
      // posição natural de cada cartão (são sticky: soma alturas + margens a partir do topo da lista)
      const ol = steps[0].parentElement;
      let t = absTop(ol);
      tops = steps.map((s) => {
        const top = t;
        t += s.offsetHeight + parseFloat(getComputedStyle(s).marginBottom);
        return top;
      });
      endTop = end ? absTop(end) : t;
    },
    update(y, h) {
      const es = tops.map((top) => clamp((y + h - top) / h, 0, 1));
      const eEnd = clamp((y + h - endTop) / h, 0, 1);
      steps.forEach((s, i) => {
        const c = i < steps.length - 1 ? es[i + 1] : eEnd;
        if (!animate) return;
        s.style.setProperty('--e', es[i].toFixed(4));
        s.style.setProperty('--c', c.toFixed(4));
        const cov = c >= 0.999;
        if (cov !== covered[i]) { covered[i] = cov; s.classList.toggle('is-covered', cov); }
      });
      let a = -1;
      es.forEach((e, i) => { if (e >= 0.5) a = i; });
      if (a !== active) {
        active = a;
        dots.forEach((d, k) => { d.classList.toggle('is-active', k === a); if (k === a) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
      }
      wrap?.classList.toggle('is-hidden', es[0] < 0.6 || eEnd > 0.5);
      if (bar) {
        const p = clamp((y + h * 0.5 - tops[0]) / (endTop - tops[0]), 0, 1);
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
      }
    },
  });
}

/** Janelas (clube, CTA final): abrem de um bloco recuado com cantos arredondados até a largura total. */
function windows() {
  $$('[data-window]').forEach((el) => {
    let top = 0;
    addEffect({
      measure() { top = absTop(el); },
      // 0 quando o topo da seção entra pela base da tela; 1 quando chega a 25 % da altura
      update(y, h) { el.style.setProperty('--w', clamp((y + h - top) / (h * 0.75), 0, 1).toFixed(4)); },
    });
  });
}

/** Parallax genérico ([data-parallax="v"]): desloca a v× a distância do centro do bloco ao centro da tela. */
function parallax() {
  const mobile = isMobile();
  $$('[data-parallax]').forEach((el) => {
    if (mobile && el.dataset.parallaxMobile === 'off') return;
    const speed = parseFloat(el.dataset.parallax) || 0.2;
    const box = el.closest('.final, .chapter-hero, section') || el.parentElement;
    let center = 0;
    addEffect({
      measure() { center = absTop(box) + box.offsetHeight / 2; },
      update(y, h) {
        const d = center - (y + h / 2);
        if (Math.abs(d) > h * 1.5) return;
        el.style.transform = `translate3d(0, ${(-d * speed * 0.35).toFixed(1)}px, 0)`;
      },
    });
  });
}

export function initScroll() {
  readingProgress();
  if (!reducedMotion()) {
    heroExit();
    journey();
    windows();
    if (!lowPower()) parallax();
  } else {
    journey(false); // sem animação: só o indicador de etapa
  }
  measureAll();
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', () => { measureAll(); }, { passive: true });
  // a página cresce depois (imagens, seções montadas em tempo ocioso): remede
  new ResizeObserver(() => measureAll()).observe(document.body);
}

