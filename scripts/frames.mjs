// Captura quadros da coreografia de rolagem: node scripts/frames.mjs <url> <prefixo> <largura> <altura> <pos1,pos2,...> (posições em múltiplos da altura da tela)
import { chromium } from 'playwright';
const [url, prefix, w = 1440, h = 760, list = '0'] = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: +w, height: +h }, hasTouch: +w < 768, isMobile: +w < 768 });
await ctx.addInitScript(() => { try { localStorage.setItem('cookie-ok', '1'); sessionStorage.setItem('demo:hero', '1'); } catch {} });
const p = await ctx.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(2600);
for (const v of list.split(',')) {
  // 'seletor@f' = topo da seção a f × altura da tela a partir do topo da janela (ex.: #quiz@0.5)
  let y;
  if (v.includes('@')) { const [sel, f] = v.split('@'); y = await p.evaluate(([s, ff, hh]) => document.querySelector(s).getBoundingClientRect().top + window.scrollY - ff * hh, [sel, +f, +h]); y = Math.round(y); }
  else y = Math.round(parseFloat(v) * +h);
  // rola em passos para disparar revelações e efeitos como numa rolagem real
  await p.evaluate(async (target) => { const s = window.scrollY; const n = 12; for (let k = 1; k <= n; k++) { window.scrollTo(0, s + (target - s) * k / n); await new Promise((r) => setTimeout(r, 16)); } }, y);
  // sincroniza o Lenis com a posição programática (evita quadro deslocado na captura)
  await p.evaluate((target) => window.lenis?.scrollTo(target, { immediate: true, force: true }), y);
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${process.env.TEMP}/shots/${prefix}-${v.replace(/[#@.]/g, "_")}.png` });
}
if (errs.length) console.log(errs.join('\n'));
await b.close();
