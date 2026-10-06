// Rolagem suave com inércia leve (Lenis). Só com mouse/trackpad: no toque a rolagem é nativa,
// e com prefers-reduced-motion fica desligada. Não prende a rolagem: só suaviza o movimento.
import Lenis from 'lenis';
import { reducedMotion } from '../utils.js';

let lenis = null;

export function initSmooth() {
  if (reducedMotion() || window.matchMedia('(pointer: coarse)').matches) return null;
  const headerH = () => (document.querySelector('[data-header]')?.offsetHeight || 80) + 8;
  lenis = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 0.95,
    smoothWheel: true,
    anchors: { offset: -headerH(), duration: 1.4 },
    prevent: (node) => !!node.closest('.modal, .mobile-menu, [data-lenis-prevent]'),
    autoRaf: true,
  });
  window.lenis = lenis;
  return lenis;
}

export const smooth = {
  stop() { lenis?.stop(); },
  start() { lenis?.start(); },
  to(target, opts) { if (lenis) lenis.scrollTo(target, opts); else if (typeof target === 'number') window.scrollTo({ top: target, behavior: reducedMotion() ? 'auto' : 'smooth' }); },
  resync(y) { lenis?.scrollTo(y, { immediate: true, force: true }); },
};
