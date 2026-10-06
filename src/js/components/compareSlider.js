// Slider de comparação antes/depois (primeira dobra e clube).
// - A camada "depois" é recortada por clip-path via a CSS var --pos.
// - Arraste só pela alça (pointer events); clique na trilha move a divisão; teclado: setas ±5%, Home, End.
// - Demonstração automática 50 → 30 → 70 → 50 (~2,5 s), interrompida por qualquer interação.
//   data-demo="load"  → 1,2 s após carregar (uma vez por sessão, chave data-demo-once)
//   data-demo="view"  → quando 60% do bloco entra na tela (uma vez)
// - Aceita <video> nas camadas: autoplay mudo em loop, pausa fora da tela, botão de pausa.
import { clamp, easeInOut, reducedMotion, session } from '../utils.js';
import { track } from './analytics.js';

export function initCompare(root) {
  const handle = root.querySelector('.cmp__handle');
  const pauseBtn = root.querySelector('[data-cmp-pause]');
  const videos = [...root.querySelectorAll('video')];
  const label = root.dataset.label || '';
  let pos = 50;
  let demoRaf = 0;
  let touched = false;

  const set = (p) => {
    pos = clamp(p, 0, 100);
    root.style.setProperty('--pos', `${pos}%`);
    handle.setAttribute('aria-valuenow', String(Math.round(pos)));
    handle.setAttribute('aria-valuetext', `${Math.round(pos)}% — ${pos < 50 ? 'mais do depois' : pos > 50 ? 'mais do antes' : 'metade de cada'}`);
  };

  const stopDemo = () => { cancelAnimationFrame(demoRaf); demoRaf = 0; };
  const touch = () => {
    stopDemo();
    if (!touched) { touched = true; root.classList.add('is-touched'); track('slider', { label }); }
  };

  const fromEvent = (e) => {
    const r = root.getBoundingClientRect();
    return ((e.clientX - r.left) / r.width) * 100;
  };

  // Arraste pela alça
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    touch();
    handle.setPointerCapture(e.pointerId);
    const move = (ev) => set(fromEvent(ev));
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  });

  // Desktop: arrastar em qualquer ponto com o mouse. Celular: só a alça (a área livre mantém a rolagem).
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (e.target.closest('.cmp__handle, a, button')) return;
    touch();
    set(fromEvent(e));
    const move = (ev) => set(fromEvent(ev));
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
  // Toque na trilha (sem arrastar) move a divisão
  root.addEventListener('click', (e) => {
    if (e.target.closest('.cmp__handle, a, button')) return;
    if (e.pointerType === 'mouse') return; // já tratado no pointerdown
    touch();
    set(fromEvent(e));
  });

  handle.addEventListener('keydown', (e) => {
    const map = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 };
    if (e.key in map) { e.preventDefault(); touch(); set(pos + map[e.key]); }
    else if (e.key === 'Home') { e.preventDefault(); touch(); set(0); }
    else if (e.key === 'End') { e.preventDefault(); touch(); set(100); }
    else if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); touch(); set(pos + (e.key === 'PageUp' ? 10 : -10)); }
  });
  window.addEventListener('keydown', (e) => { if (demoRaf && e.key !== 'Tab') stopDemo(); }, { passive: true });

  // Demonstração automática
  const demo = () => {
    if (reducedMotion() || touched) return;
    const keys = [50, 30, 70, 50];
    const dur = 2500, seg = dur / (keys.length - 1);
    const t0 = performance.now();
    const tick = (now) => {
      const t = now - t0;
      if (t >= dur) { set(50); demoRaf = 0; return; }
      const i = Math.floor(t / seg);
      const k = easeInOut((t - i * seg) / seg);
      set(keys[i] + (keys[i + 1] - keys[i]) * k);
      demoRaf = requestAnimationFrame(tick);
    };
    demoRaf = requestAnimationFrame(tick);
  };

  const mode = root.dataset.demo;
  if (mode === 'load') {
    const key = `demo:${root.dataset.demoOnce || 'cmp'}`;
    if (!session.get(key)) {
      session.set(key, '1');
      setTimeout(demo, +(root.dataset.demoDelay || 1200));
    }
  } else if (mode === 'view') {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.intersectionRatio >= 0.6)) { io.disconnect(); demo(); }
    }, { threshold: [0.6] });
    io.observe(root);
  }

  // Animação ambiente (Ken Burns nas fotos ou vídeos): pausa fora da tela e pelo botão
  let userPaused = false;
  const playAll = (on) => {
    root.classList.toggle('is-paused', !on);
    videos.forEach((v) => (on ? v.play().catch(() => {}) : v.pause()));
  };
  if (reducedMotion()) { root.classList.remove('is-ambient'); if (pauseBtn) pauseBtn.hidden = true; videos.forEach((v) => v.removeAttribute('autoplay')); }
  else if (root.hasAttribute('data-ambient')) {
    // zoom lento só depois do carregamento, para não competir com a primeira pintura (LCP)
    const start = () => setTimeout(() => root.classList.add('is-ambient'), 1200);
    document.readyState === 'complete' ? start() : window.addEventListener('load', start, { once: true });
  }
  if (!reducedMotion()) {
    new IntersectionObserver(([en]) => { if (!userPaused) playAll(en.isIntersecting); }, { threshold: 0.05 }).observe(root);
  }
  pauseBtn?.addEventListener('click', () => {
    userPaused = !root.classList.contains('is-paused');
    playAll(!userPaused);
    pauseBtn.setAttribute('aria-label', userPaused ? 'Retomar animação de fundo' : 'Pausar animação de fundo');
  });

  // Loader coração-grão até a mídia carregar
  const firstImg = root.querySelector('.cmp__layer--before img, .cmp__layer--before video');
  const ready = () => root.classList.add('is-ready');
  if (!firstImg || (firstImg.tagName === 'IMG' && firstImg.complete)) ready();
  else firstImg.addEventListener(firstImg.tagName === 'IMG' ? 'load' : 'playing', ready, { once: true });

  set(50);
  return { set, demo };
}
