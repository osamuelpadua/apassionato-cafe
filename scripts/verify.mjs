// Verificação ponta a ponta dos estados interativos + capturas em docs/estados/ + auditoria axe.
// Uso: (com `npm run dev` rodando) node scripts/verify.mjs [baseURL]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.argv[2] || 'http://localhost:5180/';
const OUT = 'docs/estados/';
await mkdir(OUT, { recursive: true });
const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, ok: !!cond, extra }); console.log(`${cond ? '✔' : '✘'} ${name}${extra ? ` — ${extra}` : ''}`); };

const browser = await chromium.launch();
async function newPage(w, h, reduced = true) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: w < 768, isMobile: w < 768 });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await ctx.addInitScript(() => { try { localStorage.setItem('cookie-ok', '1'); } catch {} });
  return page;
}
const shot = (page, name, opts = {}) => page.screenshot({ path: `${OUT}${name}.png`, ...opts });
const val = (page, sel) => page.locator(sel).first().getAttribute('aria-valuenow');

/* ---------------- Desktop 1440 × 760 ---------------- */
{
  const page = await newPage(1440, 760);
  await page.goto(BASE, { waitUntil: 'networkidle' });

  // 1. Slider da primeira dobra: 25 / 50 / 75 por teclado
  const handle = page.locator('.hero .cmp__handle');
  await handle.focus();
  await page.keyboard.press('Home'); for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  ok('Slider: Home + 5×→ = 25%', (await val(page, '.hero .cmp__handle')) === '25');
  await shot(page, 'desktop-01-hero-25');
  await page.keyboard.press('End'); for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
  ok('Slider: End + 5×← = 75%', (await val(page, '.hero .cmp__handle')) === '75');
  await shot(page, 'desktop-02-hero-75');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
  ok('Slider volta a 50%', (await val(page, '.hero .cmp__handle')) === '50');
  await page.locator('.hero .cmp__handle').blur();
  await shot(page, 'desktop-03-hero-50');
  // arraste com mouse
  const box = await page.locator('.hero__cmp').boundingBox();
  const hb = await handle.boundingBox();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
  await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.3, hb.y + 10, { steps: 6 }); await page.mouse.up();
  const dragged = +(await val(page, '.hero .cmp__handle'));
  ok('Slider: arraste da alça com mouse', Math.abs(dragged - 30) <= 2, `${dragged}%`);

  // Sobreposição: título, CTAs e alça não podem se sobrepor
  const rects = await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect().toJSON();
    return { title: r('.hero__half--before'), ctas: r('.hero__ctas'), handle: r('.hero .cmp__handle'), support: r('.hero__support') };
  });
  const overlap = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
  ok('1440×760: alça não sobrepõe CTAs', !overlap(rects.handle, rects.ctas));
  ok('1440×760: título não sobrepõe apoio', !overlap(rects.title, rects.support));

  // 2. Quiz
  await page.locator('#quiz').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await shot(page, 'desktop-04-quiz-inicio');
  await page.locator('.quiz__intro [data-quiz-start]').click();
  await page.waitForTimeout(150);
  await shot(page, 'desktop-05-quiz-pergunta-1');
  await page.getByRole('radio', { name: /Manhã/ }).click(); await page.waitForTimeout(200);
  await shot(page, 'desktop-06-quiz-pergunta-2');
  await page.getByRole('radio', { name: /Coador ou filtro/ }).click(); await page.waitForTimeout(200);
  await shot(page, 'desktop-07-quiz-pergunta-3');
  // teclado no radiogroup: seta para baixo + Enter
  await page.getByRole('radio', { name: /Suave e adocicado/ }).focus();
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const resTxt = await page.locator('#qz-result').textContent();
  ok('Quiz: coador + suave → Delicato Moído', /Delicato Moído/.test(resTxt), resTxt);
  ok('Quiz: texto do momento', /manhã/.test(await page.locator('.qz__res-moment').textContent()));
  await shot(page, 'desktop-08-quiz-resultado');
  await page.locator('[data-qz-open]').click(); await page.waitForTimeout(350);
  ok('Quiz abre o modal do café recomendado', /Delicato Moído/.test(await page.locator('#modal-title').textContent()));
  ok('Hash do modal', page.url().includes('#cafe-delicato-moido'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(350);
  ok('ESC fecha o modal e devolve o foco', await page.evaluate(() => document.activeElement?.matches('[data-qz-open]')));

  // 3. Vitrine com filtro
  await page.locator('#cafes').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Cápsulas', exact: true }).click(); await page.waitForTimeout(500);
  const visible = await page.locator('[data-showcase] [role="listitem"]:not([hidden])').count();
  ok('Filtro Cápsulas mostra 1 cartão', visible === 1, `${visible}`);
  await page.getByRole('button', { name: 'Grãos', exact: true }).click(); await page.waitForTimeout(500);
  ok('Filtro Grãos mostra 3 cartões', (await page.locator('[data-showcase] [role="listitem"]:not([hidden])').count()) === 3);
  await page.locator('.cafes__head').scrollIntoViewIfNeeded();
  await shot(page, 'desktop-09-vitrine-filtro-graos');
  await page.getByRole('button', { name: 'Todos', exact: true }).click(); await page.waitForTimeout(500);

  // 4. Modal de produto (desktop) + variação
  await page.locator('[data-open-product="delicato"]').first().click(); await page.waitForTimeout(350);
  const store1 = await page.locator('.modal__bar .btn--buy').getAttribute('href');
  ok('Modal: link da loja com UTM', /delicato-250g\?utm_source=landing&utm_medium=botao/.test(store1), store1);
  await page.getByRole('radio', { name: '1 kg' }).click();
  const store2 = await page.locator('.modal__bar .btn--buy').getAttribute('href');
  const wa2 = decodeURIComponent(await page.locator('.modal__bar .btn--wa').getAttribute('href'));
  ok('Modal: variação 1 kg atualiza a loja', /delicato-1kg/.test(store2));
  ok('Modal: variação 1 kg atualiza o WhatsApp', wa2.includes('Delicato Grãos (1 kg)'), wa2.split('text=')[1]);
  ok('Modal: links externos em nova aba', (await page.locator('.modal__bar a[target="_blank"][rel~="noopener"]').count()) === 2);
  ok('Modal: rolagem do fundo travada', await page.evaluate(() => document.body.style.position === 'fixed'));
  await shot(page, 'desktop-10-modal-produto');
  // foco preso
  for (let i = 0; i < 30; i++) await page.keyboard.press('Tab');
  ok('Modal: foco preso no diálogo', await page.evaluate(() => !!document.activeElement.closest('.modal__dialog')));
  await page.locator('[data-modal-next]').click(); await page.waitForTimeout(100);
  ok('Modal: seta próximo café', /Delicato Moído/.test(await page.locator('#modal-title').textContent()));
  await page.locator('.modal__veil').click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(350);
  ok('Clique fora fecha o modal', !(await page.locator('[data-modal]').evaluate((m) => m.classList.contains('is-open'))));

  // 5. Clube: 3 planos
  await page.locator('#clube .plan').scrollIntoViewIfNeeded();
  const planShots = [['15', 22, 12, 'quinzenal'], ['30', 20, 6, 'mensal'], ['60', 18, 3, 'bimestral']];
  for (const [d, off, n, nome] of planShots) {
    await page.locator('#clube .segmented').getByRole('radio', { name: new RegExp(`${d} dias`) }).click();
    await page.waitForTimeout(700);
    const num = await page.locator('[data-club-num]').textContent();
    const marks = await page.locator('[data-club-timeline] i').count();
    ok(`Clube ${nome}: ${off}% e ${n} entregas`, +num === off && marks === n, `${num}% · ${marks}`);
    await page.locator('#clube .club__grid').screenshot({ path: `${OUT}desktop-11-clube-${nome}.png` });
  }

  // 6. FAQ
  await page.locator('#duvidas').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /Vocês entregam/ }).click(); await page.waitForTimeout(400);
  const expanded = await page.locator('.acc__btn[aria-expanded="true"]').count();
  ok('FAQ: um item aberto por vez', expanded === 1);
  await page.locator('#duvidas').screenshot({ path: `${OUT}desktop-12-faq-aberto.png` });

  ok('Desktop sem erros no console', page.errors.length === 0, page.errors.join(' | '));
  await page.close();
}

/* ---------------- Outras resoluções da primeira dobra ---------------- */
for (const [w, h] of [[1920, 1080], [390, 844]]) {
  const page = await newPage(w, h);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const g = (s) => document.querySelector(s).getBoundingClientRect().toJSON();
    return { b: g('.hero__half--before'), a: g('.hero__half--after'), ctas: g('.hero__ctas'), handle: g('.hero .cmp__handle'), micro: g('.hero__micro'), hint: g('.hero .cmp__hint') };
  });
  const overlap = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
  ok(`${w}×${h}: alça livre de CTAs e microlinha`, !overlap(r.handle, r.ctas) && !overlap(r.handle, r.micro));
  ok(`${w}×${h}: título dentro da tela`, r.b.left >= 0 && r.a.right <= w);
  await shot(page, `${w < 768 ? 'mobile' : 'wide'}-hero-50`);
  await page.close();
}

/* ---------------- Celular 390 × 844 ---------------- */
{
  const page = await newPage(390, 844);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const handle = page.locator('.hero .cmp__handle');
  await handle.focus(); await page.keyboard.press('Home'); for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  await handle.blur(); await shot(page, 'mobile-01-hero-25');
  await handle.focus(); await page.keyboard.press('End'); for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
  await handle.blur(); await shot(page, 'mobile-02-hero-75');
  ok('Celular: área do slider mantém rolagem vertical (touch-action pan-y)', (await page.locator('.hero__cmp').evaluate((e) => getComputedStyle(e).touchAction)) === 'pan-y');
  ok('Celular: alça captura o gesto (touch-action none)', (await handle.evaluate((e) => getComputedStyle(e).touchAction)) === 'none');

  // Menu do celular
  await page.locator('[data-menu-open]').click(); await page.waitForTimeout(300);
  ok('Menu do celular abre com foco no fechar', await page.evaluate(() => document.activeElement.matches('[data-menu-close]')));
  await shot(page, 'mobile-03-menu');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);

  // Barra fixa aparece depois da primeira dobra
  await page.evaluate(() => window.scrollTo(0, 1400)); await page.waitForTimeout(400);
  ok('Celular: barra fixa Comprar/Assinar visível após a 1ª dobra', await page.locator('[data-mbar]').evaluate((e) => e.classList.contains('is-visible')));
  await shot(page, 'mobile-04-jornada-barra-fixa');

  // Quiz, vitrine e modal bottom sheet
  await page.locator('#quiz').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
  await page.locator('.quiz__intro [data-quiz-start]').click(); await page.waitForTimeout(400);
  await shot(page, 'mobile-05-quiz-pergunta-1');
  await page.locator('#cafes .cafes__head').scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
  await shot(page, 'mobile-06-vitrine-carrossel');
  await page.locator('[data-open-product="moderato-intenso"]').first().click(); await page.waitForTimeout(400);
  const sheet = await page.locator('.modal__dialog').boundingBox();
  ok('Celular: bottom sheet com ~92% da altura', Math.abs(sheet.height / 844 - 0.92) < 0.02, `${Math.round((sheet.height / 844) * 100)}%`);
  const bar = await page.locator('.modal__bar').boundingBox();
  ok('Celular: botões de compra visíveis sem rolar', bar.y + bar.height <= 844 + 1);
  await shot(page, 'mobile-07-modal-bottom-sheet');
  // arrastar para baixo fecha
  const g = await page.locator('[data-modal-grab]').boundingBox();
  await page.mouse.move(g.x + g.width / 2, g.y + 10); await page.mouse.down();
  await page.mouse.move(g.x + g.width / 2, g.y + 260, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(400);
  ok('Celular: arrastar a alça para baixo fecha o modal', !(await page.locator('[data-modal]').evaluate((m) => m.classList.contains('is-open'))));

  await page.locator('#clube').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await page.locator('#clube .club__grid').screenshot({ path: `${OUT}mobile-08-clube.png` });
  ok('Celular sem erros no console', page.errors.length === 0, page.errors.join(' | '));
  await page.close();
}

/* ---------------- Hash compartilhável ---------------- */
{
  const page = await newPage(1440, 900);
  await page.goto(`${BASE}#cafe-delicato`, { waitUntil: 'networkidle' }); await page.waitForTimeout(400);
  ok('Hash #cafe-delicato abre o modal ao carregar', /Delicato Grãos/.test(await page.locator('#modal-title').textContent()));
  await page.close();
}

/* ---------------- Movimento: demonstração automática x reduced-motion ---------------- */
{
  const page = await newPage(1440, 760, false);
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1700);
  const mid = +(await val(page, '.hero .cmp__handle'));
  ok('Demonstração automática roda após 1,2 s', mid !== 50, `${mid}%`);
  await page.waitForTimeout(2600);
  ok('Demonstração termina em 50%', (await val(page, '.hero .cmp__handle')) === '50');
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(1700);
  ok('Demonstração roda só uma vez por sessão', (await val(page, '.hero .cmp__handle')) === '50');
  await page.close();

  const red = await newPage(1440, 760, true);
  await red.goto(BASE, { waitUntil: 'networkidle' }); await red.waitForTimeout(1800);
  ok('Reduced motion: sem demonstração', (await val(red, '.hero .cmp__handle')) === '50');
  ok('Reduced motion: sem zoom de fundo', !(await red.locator('.hero__cmp').evaluate((e) => e.classList.contains('is-ambient'))));
  await red.evaluate(() => window.scrollTo(0, 2200)); await red.waitForTimeout(200);
  ok('Reduced motion: sem parallax', (await red.locator('.jstep__bg').first().evaluate((e) => e.style.transform)) === '');
  await red.close();
}

/* ---------------- Página interna ---------------- */
{
  const page = await newPage(1440, 900);
  await page.goto(`${BASE}historia.html#colheita`, { waitUntil: 'networkidle' });
  await shot(page, 'historia-desktop-abertura');
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  await shot(page, 'historia-desktop-completa', { fullPage: true });
  await page.locator('[data-ch-next]').click(); await page.waitForTimeout(500);
  ok('Página interna: próximo capítulo → secagem', /Sem pressa/.test(await page.locator('#ch-title').textContent()));
  await page.locator('[data-taste] [data-open-product]').first().click(); await page.waitForTimeout(350);
  ok('Página interna: cartão abre o mesmo modal', /Delicato/.test(await page.locator('#modal-title').textContent()));
  await page.keyboard.press('Escape'); await page.waitForTimeout(350);
  ok('Fechar o modal mantém o capítulo no hash', page.url().endsWith('#secagem'), page.url());
  ok('Página interna sem erros', page.errors.length === 0, page.errors.join(' | '));
  await page.close();

  const m = await newPage(390, 844);
  await m.goto(`${BASE}historia.html#colheita`, { waitUntil: 'networkidle' });
  await shot(m, 'historia-mobile-abertura');
  await m.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  await m.locator('.toc').scrollIntoViewIfNeeded();
  await m.locator('.toc summary').click(); await m.waitForTimeout(200);
  await shot(m, 'historia-mobile-indice-aberto');
  await m.locator('.toc summary').click();
  await shot(m, 'historia-mobile-completa', { fullPage: true });
  await m.close();
}

/* ---------------- Acessibilidade (axe) ---------------- */
for (const path of ['', 'historia.html#colheita', 'design-system.html']) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const page = await newPage(w, h);
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(900); // espera os fades de revelação terminarem
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const bad = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    ok(`axe ${path || 'index'} @${w}: sem violações sérias`, bad.length === 0, bad.map((v) => `${v.id}(${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')}`).join(' | '));
    const minor = res.violations.filter((v) => !['serious', 'critical'].includes(v.impact));
    if (minor.length) console.log('   menores:', minor.map((v) => `${v.id}(${v.nodes.length})`).join(', '));
    await page.close();
  }
}

await browser.close();
const fail = results.filter((r) => !r.ok);
console.log(`\n${results.length - fail.length}/${results.length} verificações ok`);
process.exit(fail.length ? 1 : 0);
