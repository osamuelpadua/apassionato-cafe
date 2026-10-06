// Captura um elemento: node scripts/shot-el.mjs <url> <seletor> <saida> [largura] [altura] [reduced]
import { chromium } from 'playwright';
const [url, sel, out, w = 1440, h = 900, reduced = '1'] = process.argv.slice(2);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, reducedMotion: reduced === '1' ? 'reduce' : 'no-preference' });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto(url, { waitUntil: 'networkidle' });
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
const el = p.locator(sel).first();
await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(700);
await el.screenshot({ path: out });
if (errs.length) console.log(errs.join('\n'));
await b.close();
