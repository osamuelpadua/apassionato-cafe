// Quiz "Descubra o café ideal para você": início → 3 perguntas → resultado.
// Só front-end: nada é salvo, sem cadastro. Cada pergunta é um radiogroup navegável por setas.
import { byId, QUIZ_MAP } from '../data/products.js';
import { $, $$, pic, icon, escapeHtml, reducedMotion, announce } from '../utils.js';
import { track } from './analytics.js';

const QUESTIONS = [
  {
    key: 'momento', q: 'Qual é o seu momento do dia?',
    opts: [
      { v: 'manha', t: 'Manhã', s: 'Para começar o dia' },
      { v: 'tarde', t: 'Tarde', s: 'Uma pausa no meio da tarde' },
      { v: 'almoco', t: 'Depois do almoço', s: 'O cafezinho de sempre' },
      { v: 'noite', t: 'Noite', s: 'Com calma, sem pressa' },
    ],
  },
  {
    key: 'preparo', q: 'Como você prepara o seu café?',
    opts: [
      { v: 'capsulas', t: 'Cápsulas' },
      { v: 'graos', t: 'Expresso ou moka', s: 'Máquina de expresso ou cafeteira italiana' },
      { v: 'moido', t: 'Coador ou filtro', s: 'Pano, papel ou cafeteira elétrica' },
      { v: 'graos', t: 'Prensa francesa', id: 'prensa' },
      { v: 'drip', t: 'Só água quente', s: 'Drip coffee, sem equipamento' },
    ],
  },
  {
    key: 'sabor', q: 'Que sabor você procura?',
    opts: [
      { v: 'suave', t: 'Suave e adocicado' },
      { v: 'equilibrado', t: 'Equilibrado' },
      { v: 'intenso', t: 'Intenso e encorpado' },
    ],
  },
];

const MOMENTO_TXT = { manha: 'Perfeito para a sua manhã.', tarde: 'Perfeito para a sua pausa da tarde.', almoco: 'Perfeito para o seu café depois do almoço.', noite: 'Perfeito para o seu fim de dia.' };

export function initQuiz(openProduct) {
  const screen = $('[data-quiz]');
  if (!screen) return;
  const startBtns = $$('[data-quiz-start]');
  let step = -1;
  let answers = {};
  let dir = 1;

  const renderStart = () => {
    screen.innerHTML = `
      <div class="qz">
        <div class="qz__hero">${pic('quiz', { sizes: '400px', alt: 'Xícara de café com arte de coração no leite' })}</div>
        <div class="qz__body">
          <p class="qz__kicker">Pergunta 1 de 3</p>
          <p class="qz__q">${QUESTIONS[0].q}</p>
          <div class="qz__start-preview" aria-hidden="true">
            ${QUESTIONS[0].opts.slice(0, 3).map((o) => `<span class="qz__opt"><span class="qz__mark">${icon('i-check')}</span>${o.t}</span>`).join('')}
          </div>
          <button type="button" class="btn btn--buy btn--block" data-quiz-start style="margin-top:auto">Começar</button>
        </div>
      </div>`;
    $('[data-quiz-start]', screen).addEventListener('click', start);
  };

  const renderQuestion = () => {
    const Q = QUESTIONS[step];
    const optId = (o) => o.id || o.v;
    const current = answers[`${Q.key}_id`];
    screen.innerHTML = `
      <div class="qz">
        <div class="qz__top">
          <button type="button" class="qz__back" data-qz-back ${step === 0 ? 'disabled' : ''}>${icon('i-arrow-left')}<span class="sr-only">Voltar</span></button>
          <div class="qz__progress">
            <span class="qz__progress-txt">${step + 1}/3</span>
            <span class="qz__bar" aria-hidden="true"><span style="transform:scaleX(${(step + 1) / 3})"></span></span>
          </div>
        </div>
        <div class="qz__body qz__slide ${dir < 0 ? 'qz__slide--back' : ''}">
          <p class="qz__q" id="qz-q-${step}" tabindex="-1">${Q.q}</p>
          <div class="qz__opts" role="radiogroup" aria-labelledby="qz-q-${step}">
            ${Q.opts.map((o, i) => {
              const checked = current ? current === optId(o) : false;
              const tab = current ? (checked ? 0 : -1) : (i === 0 ? 0 : -1);
              return `<button type="button" class="qz__opt" role="radio" aria-checked="${checked}" tabindex="${tab}" data-v="${o.v}" data-id="${optId(o)}">
                <span class="qz__mark">${icon('i-check')}</span><span>${o.t}${o.s ? `<small>${o.s}</small>` : ''}</span></button>`;
            }).join('')}
          </div>
        </div>
      </div>`;
    const radios = $$('[role="radio"]', screen);
    const choose = (btn) => {
      radios.forEach((r) => { r.setAttribute('aria-checked', String(r === btn)); r.tabIndex = r === btn ? 0 : -1; });
      answers[Q.key] = btn.dataset.v;
      answers[`${Q.key}_id`] = btn.dataset.id;
      setTimeout(() => { dir = 1; step < 2 ? (step++, renderQuestion()) : renderResult(); }, reducedMotion() ? 0 : 260);
    };
    radios.forEach((r, i) => {
      r.addEventListener('click', () => choose(r));
      r.addEventListener('keydown', (e) => {
        const n = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (n) { e.preventDefault(); const next = radios[(i + n + radios.length) % radios.length]; next.focus(); }
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); choose(r); }
      });
    });
    $('[data-qz-back]', screen).addEventListener('click', () => { dir = -1; step = Math.max(0, step - 1); renderQuestion(); });
    $(`#qz-q-${step}`, screen).focus({ preventScroll: true });
  };

  const renderResult = () => {
    step = 3;
    const id = QUIZ_MAP[answers.preparo]?.[answers.sabor] || 'delicato';
    const p = byId(id);
    const warn = answers.preparo === 'moido' && answers.sabor === 'intenso'
      ? '<p class="qz__warn">O Moderato Intenso vem em grãos: moa na hora, na moagem média, para o coador.</p>' : '';
    screen.innerHTML = `
      <div class="qz">
        <div class="qz__top">
          <button type="button" class="qz__back" data-qz-back>${icon('i-arrow-left')}<span class="sr-only">Voltar</span></button>
          <div class="qz__progress"><span class="qz__progress-txt">Resultado</span><span class="qz__bar" aria-hidden="true"><span style="transform:scaleX(1)"></span></span></div>
        </div>
        <div class="qz__body qz__result qz__slide">
          <div class="qz__stage"><span class="p-card__disc"></span><span class="p-card__img">${pic(p.imagem, { sizes: '200px', alt: `Embalagem ${p.nomeCompleto}` })}</span></div>
          <p class="qz__res-title" id="qz-result" tabindex="-1">O seu café é o <b>${escapeHtml(p.nome)}</b>.</p>
          <div class="chips" style="justify-content:center">${p.notas.map((n) => `<span class="chip chip--note">${escapeHtml(n)}</span>`).join('')}</div>
          <p class="qz__res-moment">${MOMENTO_TXT[answers.momento] || ''}</p>
          ${warn}
          <div class="qz__res-actions">
            <button type="button" class="btn btn--buy" data-qz-open>Ver detalhes e comprar</button>
          </div>
          <div class="qz__res-links">
            <button type="button" data-qz-restart>Refazer o quiz</button>
            <a href="#cafes" data-qz-all>Ver todos os cafés</a>
          </div>
        </div>
      </div>`;
    $('[data-qz-open]', screen).addEventListener('click', (e) => openProduct(p.id, e.currentTarget));
    $('[data-qz-restart]', screen).addEventListener('click', start);
    $('[data-qz-back]', screen).addEventListener('click', () => { dir = -1; step = 2; renderQuestion(); });
    $('#qz-result', screen).focus({ preventScroll: true });
    announce(`Resultado do quiz: o seu café é o ${p.nome}. ${MOMENTO_TXT[answers.momento] || ''}`);
    track('quiz_concluido', { cafe: p.id, preparo: answers.preparo, sabor: answers.sabor, momento: answers.momento });
    rain();
  };

  const rain = () => {
    if (reducedMotion()) return;
    const box = document.createElement('div');
    box.className = 'beans-rain';
    box.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 22; i++) {
      const b = document.createElement('i');
      b.style.left = `${Math.random() * 100}%`;
      b.style.animationDelay = `${Math.random() * 300}ms`;
      b.style.setProperty('--dx', `${(Math.random() - 0.5) * 80}px`);
      b.style.setProperty('--rot', `${(Math.random() - 0.5) * 540}deg`);
      b.style.transform = `scale(${0.7 + Math.random() * 0.5})`;
      box.appendChild(b);
    }
    screen.appendChild(box);
    setTimeout(() => box.remove(), 1400);
  };

  function start() {
    answers = {}; step = 0; dir = 1;
    renderQuestion();
    if (window.matchMedia('(max-width: 1023px)').matches) screen.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
  }

  startBtns.forEach((b) => b.addEventListener('click', start));
  renderStart();
}
