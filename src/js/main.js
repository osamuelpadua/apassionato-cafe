import '../styles/main.css';
import { $, $$ } from './utils.js';
import { initAnalytics } from './components/analytics.js';
import { initHeader } from './components/header.js';
import { initCompare } from './components/compareSlider.js';
import { initHeroIntro } from './components/heroIntro.js';
import { initSmooth } from './components/smooth.js';
import { initScroll } from './components/scroll.js';
import { initReveal } from './components/motion.js';
import { initQuiz } from './components/quiz.js';
import { initShowcase } from './components/showcase.js';
import { initProductModal } from './components/productModal.js';
import { initClubSelector } from './components/clubSelector.js';
import { renderTestimonials, initCarousel, renderFaq, initAccordion } from './components/widgets.js';
import { initNeon } from './components/neon.js';

// Primeira dobra: imediato
initAnalytics();
initSmooth();
initHeader();
$$('[data-compare]').forEach(initCompare);
initHeroIntro();
initScroll();
const modal = initProductModal();

// Abaixo da dobra: em tempo ocioso, para não atrasar a primeira pintura (LCP).
// Se a página abrir com âncora (#cafes, #cafe-x…), monta tudo na hora.
const below = () => {
  initShowcase();
  initQuiz((id, from) => modal.open(id, from));
  initClubSelector();
  renderTestimonials();
  $$('[data-carousel]').forEach(initCarousel);
  renderFaq();
  const acc = $('[data-accordion]');
  if (acc) initAccordion(acc);
  initReveal();
  initNeon();
  if (location.hash && !location.hash.startsWith('#cafe-')) document.querySelector(location.hash)?.scrollIntoView();
};
if (location.hash || !('requestIdleCallback' in window)) below();
else requestIdleCallback(below, { timeout: 1200 });
