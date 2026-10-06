import '../styles/main.css';
import '../styles/design-system.css';
import { $, $$ } from './utils.js';
import { byId } from './data/products.js';
import { initAnalytics } from './components/analytics.js';
import { initProductModal } from './components/productModal.js';
import { productCard } from './components/showcase.js';
import { initCompare } from './components/compareSlider.js';
import { initClubSelector } from './components/clubSelector.js';
import { renderFaq, initAccordion } from './components/widgets.js';

const COLORS = [
  ['--brown', '#3B2218', 'Marrom café', 'Fundo do logo, rodapé, CTA final, seções escuras'],
  ['--brown-deep', '#2C1912', 'Marrom profundo', 'Rodapé'],
  ['--espresso', '#24140F', 'Espresso', 'Texto principal, véus'],
  ['--orange', '#F07320', 'Laranja Appassionato', 'Símbolo, “ppa”, destaques, botão Comprar'],
  ['--orange-burnt', '#C84E0C', 'Laranja queimado', 'Hover, degradê do clube, fundo com texto branco'],
  ['--gold', '#B98A4B', 'Dourado caramelo', 'Botão Assinar, selos, fios'],
  ['--gold-light', '#E3C07A', 'Dourado claro', 'Eyebrows e ícones em fundo escuro'],
  ['--gold-deep', '#8A6230', 'Dourado escuro', 'Eyebrows em fundo claro (AA)'],
  ['--cream', '#F8F4EC', 'Creme', 'Fundo principal'],
  ['--cream-2', '#F1E9DB', 'Creme 2', 'Trilhas, chips de notas'],
  ['--paper', '#FBF9F5', 'Branco papel', 'Cartões, modal, leitura'],
  ['--whatsapp', '#167F43', 'Verde WhatsApp', 'Botão WhatsApp (ajustado à paleta)'],
];

const lum = (hex) => {
  const c = hex.replace('#', '').match(/../g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

$('[data-swatches]').innerHTML = COLORS.map(([v, hex, nome, uso]) => `
  <figure class="swatch"><span class="swatch__chip" style="background:var(${v})"></span>
  <figcaption><b>${nome}</b><code>${v} · ${hex}</code><span>${uso}</span></figcaption></figure>`).join('');

const PAIRS = [
  ['#24140F', '#F8F4EC', 'Texto em creme'], ['#6B5246', '#F8F4EC', 'Texto suave em creme'], ['#8A6230', '#F8F4EC', 'Eyebrow em creme'],
  ['#24140F', '#F07320', 'Botão Comprar'], ['#24140F', '#B98A4B', 'Botão Assinar'], ['#FFFFFF', '#C84E0C', 'Branco em laranja queimado'],
  ['#F8F4EC', '#3B2218', 'Creme em marrom'], ['#E3C07A', '#3B2218', 'Dourado claro em marrom'], ['#FFFFFF', '#167F43', 'Botão WhatsApp'],
];
$('[data-pairs]').innerHTML = PAIRS.map(([fg, bg, label]) => {
  const r = ratio(fg, bg);
  const tag = r >= 4.5 ? 'AA' : r >= 3 ? 'AA grande' : 'Evitar';
  return `<div class="pair" style="color:${fg};background:${bg}"><b>Aa</b><span>${label}</span><code>${r.toFixed(1)}:1 · ${tag}</code></div>`;
}).join('');

$('[data-spacing]').innerHTML = [4, 8, 12, 16, 24, 32, 48, 64, 96, 128].map((s, i) => `
  <div class="space"><span style="width:${s}px;height:${s}px"></span><code>--s-${i + 1} · ${s}</code></div>`).join('');

$('[data-ds-cards]').innerHTML = ['delicato', 'moderato-intenso', 'capsulas', 'drip-coffee'].map((id) => productCard(byId(id))).join('');

// Três sliders fixos em 25%, 50% e 75%
const heroLayer = (name, cls, text) => `
  <div class="cmp__layer cmp__layer--${cls}" aria-hidden="true"><div class="cmp__media"><picture class="pic"><img src="img/${name}-960.webp" alt=""></picture></div><p class="club__cmp-caption club__cmp-caption--${cls} serif">${text}</p></div>`;
$('[data-ds-cmps]').innerHTML = [25, 50, 75].map((p) => `
  <figure>
    <div class="cmp ds-cmp" data-ds-cmp="${p}" data-label="exemplo ${p}%">
      ${heroLayer('hero-antes', 'before', 'Antes')}${heroLayer('hero-depois', 'after', 'Depois')}
      <div class="cmp__line" aria-hidden="true"></div>
      <span class="cmp__tag cmp__tag--before" aria-hidden="true">Antes</span><span class="cmp__tag cmp__tag--after" aria-hidden="true">Depois</span>
      <div class="cmp__handle" role="slider" tabindex="0" aria-label="Exemplo de slider em ${p}%" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><svg aria-hidden="true"><use href="#i-drag"/></svg></div>
    </div>
    <figcaption>Divisão em ${p}%</figcaption>
  </figure>`).join('');
$$('[data-ds-cmp]').forEach((el) => { el.classList.add('is-touched', 'is-ready'); initCompare(el).set(+el.dataset.dsCmp); });

// Seletor do clube nos 3 planos
const planTpl = document.querySelector('#plan-tpl');
$('[data-ds-plans]').innerHTML = [0, 1, 2].map(() => planTpl.innerHTML).join('');
$$('[data-ds-plans] [data-club]').forEach((root, i) => initClubSelector(root, i));

renderFaq();
initAccordion($('[data-accordion]'));
$$('[data-reveal]').forEach((el) => el.classList.add('is-in'));
initAnalytics();
initProductModal();
