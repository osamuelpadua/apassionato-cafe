// Seletor de frequência do clube: desconto com contador, plano, benefícios e linha do tempo de 6 meses.
import { plans } from '../data/content.js';
import { $, $$, reducedMotion, easeOut } from '../utils.js';

export function initClubSelector(root = $('[data-club]'), initial = 1) {
  if (!root) return;
  const seg = $('[data-club-seg]', root);
  const radios = $$('[role="radio"]', seg);
  const num = $('[data-club-num]', root);
  const name = $('[data-club-name]', root);
  const forTxt = $('[data-club-for]', root);
  const benefits = $('[data-club-benefits]', root);
  const timeline = $('[data-club-timeline]', root);
  const count = $('[data-club-count]', root);
  let shown = plans[initial].off;
  let raf = 0;

  const countTo = (to) => {
    cancelAnimationFrame(raf);
    if (reducedMotion()) { num.textContent = to; shown = to; return; }
    const from = shown, t0 = performance.now(), dur = 600;
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      shown = Math.round(from + (to - from) * easeOut(k));
      num.textContent = shown;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const select = (i, focus = false) => {
    const p = plans[i];
    radios.forEach((r, k) => { r.setAttribute('aria-checked', String(k === i)); r.tabIndex = k === i ? 0 : -1; });
    if (focus) radios[i].focus();
    seg.style.setProperty('--i', i);
    countTo(p.off);
    name.textContent = p.nome;
    forTxt.textContent = p.para;
    benefits.innerHTML = p.beneficios.map((b) => `<li>${b}</li>`).join('');
    count.textContent = `${p.entregas} entregas`;
    // marcadores: 6 meses = 180 dias; posição proporcional à data de cada entrega
    const every = 180 / p.entregas;
    timeline.innerHTML = Array.from({ length: p.entregas }, (_, k) => `<i style="left:${((k * every + every / 2) / 180) * 100}%;--k:${k}"></i>`).join('');
  };

  radios.forEach((r, i) => {
    r.addEventListener('click', () => select(i));
    r.addEventListener('keydown', (e) => {
      const n = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (n) { e.preventDefault(); select((i + n + radios.length) % radios.length, true); }
    });
  });
  select(initial);
}
