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

/** Linha de progresso de leitura no topo da tela (vale também com reduced-motion: não é animação). */
function readingProgress() {
  const bar = $('[data-progress]');
  if (!bar) return;
  let max = 1;
  addEffect({
    measure() { max = Math.max(1, document.documentElement.scrollHeight - vh); },
    update(y) { bar.style.setProperty('--sp', (y / max).toFixed(4)); },
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
  // abertura fixa sob o 1º cartão (CSS: .journey__intro)
  const intro = $('.journey__intro', track.parentElement);
  let introTop = 0;
  let introH = 1;
  let introStick = 0;
  let introGone = false;
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
      if (intro) {
        // posição natural pela seção (a abertura é sticky: o retângulo dela já pode estar fixo no topo)
        introTop = absTop(intro.parentElement);
        introH = Math.max(1, intro.offsetHeight);
        introStick = Math.min(0, vh - introH);
        intro.style.setProperty('--intro-top', `${introStick}px`);
      }
    },
    update(y, h) {
      const es = tops.map((top) => clamp((y + h - top) / h, 0, 1));
      const eEnd = clamp((y + h - endTop) / h, 0, 1);
      if (intro) {
        intro.style.setProperty('--ie', clamp((y + h - introTop) / h, 0, 1).toFixed(4));
        // coberta = quanto o topo do 1º cartão já passou da base da abertura fixa
        const c = clamp((y + introStick + introH - tops[0]) / introH, 0, 1);
        if (animate) intro.style.setProperty('--c', c.toFixed(4));
        const gone = c >= 0.999;
        if (gone !== introGone) { introGone = gone; intro.classList.toggle('is-covered', gone); }
      }
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

/** Instagram: a seção fica presa e a rolagem vertical desliza a fileira na horizontal.
 *  --travel = quanto a fileira anda · --ip = progresso (0 quando a seção chega ao topo → 1 com o cartão final na tela). */
function instaSlider() {
  const sec = $('[data-hscroll]');
  const track = sec && $('[data-hscroll-track]', sec);
  if (!track) return;
  const head = $('.insta__head', sec);
  sec.classList.add('is-hscroll');
  let top = 0;
  let travel = 0;
  let pad = 0;
  addEffect({
    measure() {
      // altura do título primeiro: ela define o tamanho dos posts, que define o percurso
      if (head) sec.style.setProperty('--head-h', `${Math.ceil(head.offsetHeight + parseFloat(getComputedStyle(head).marginBottom))}px`);
      const cs = getComputedStyle(track);
      const last = track.lastElementChild;
      pad = parseFloat(cs.paddingLeft);
      travel = Math.max(0, Math.round(last.offsetLeft + last.offsetWidth + parseFloat(cs.paddingRight) - track.clientWidth));
      sec.style.setProperty('--travel', `${travel}px`);
      top = absTop(sec);
    },
    update(y) { sec.style.setProperty('--ip', (travel ? clamp((y - top) / travel, 0, 1) : 0).toFixed(4)); },
  });
  // Teclado: o foco num post fora da tela leva a página ao ponto da rolagem em que ele aparece inteiro
  track.addEventListener('focusin', (ev) => {
    const li = ev.target.closest('li');
    if (!li || !travel) return;
    const shift = clamp((window.scrollY - top) / travel, 0, 1) * travel;
    const left = li.offsetLeft - shift;
    const right = left + li.offsetWidth;
    let to = shift;
    if (left < pad) to = li.offsetLeft - pad;
    else if (right > track.clientWidth - pad) to = li.offsetLeft + li.offsetWidth - (track.clientWidth - pad);
    if (to === shift) return;
    const y = top + clamp(to, 0, travel);
    window.scrollTo({ top: y, behavior: 'instant' });
    smooth.resync(y);
  });
}

/** Parallax genérico ([data-parallax="v"]): desloca a v× a distância do centro do bloco ao centro da tela.
 *  Dentro de uma moldura que recorta (overflow ≠ visible), o deslocamento nunca passa da sobra da camada
 *  (ex.: inset: -10% 0) — senão a borda da foto aparece dentro da moldura, em qualquer altura de tela. */
function parallax() {
  const mobile = isMobile();
  $$('[data-parallax]').forEach((el) => {
    if (mobile && el.dataset.parallaxMobile === 'off') return;
    const speed = parseFloat(el.dataset.parallax) || 0.2;
    const box = el.closest('.final, .chapter-hero, section') || el.parentElement;
    const frame = el.offsetParent;
    const clips = !!frame && getComputedStyle(frame).overflow !== 'visible';
    let center = 0;
    let up = Infinity; // quanto pode subir sem mostrar a base
    let down = Infinity; // quanto pode descer sem mostrar o topo
    addEffect({
      measure() {
        center = absTop(box) + box.offsetHeight / 2;
        if (clips) {
          // 1 px de margem: o antisserrilhado da borda não chega à moldura
          down = Math.max(0, -el.offsetTop - 1);
          up = Math.max(0, el.offsetTop + el.offsetHeight - frame.clientHeight - 1);
        }
      },
      update(y, h) {
        const d = center - (y + h / 2);
        if (Math.abs(d) > h * 1.5) return;
        const t = clamp(-d * speed * 0.35, -up, down);
        el.style.transform = `translate3d(0, ${t.toFixed(1)}px, 0)`;
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
    instaSlider();
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

