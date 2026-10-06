// Captura de tela com Playwright: node scripts/shot.mjs <url> <saida.png> [largura] [altura] [full=1|0] [reduced=0|1] [scrollTo]
import { chromium } from 'playwright';
const [url, out, w = 1440, h = 900, full = '1', reduced = '0', scrollTo = ''] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, reducedMotion: reduced === '1' ? 'reduce' : 'no-preference', deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
await page.goto(url, { waitUntil: 'networkidle' });
if (full === '1') {
  // rola até o fim para disparar lazy-load e revelações
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(600);
}
if (scrollTo) { await page.locator(scrollTo).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); }
await page.screenshot({ path: out, fullPage: full === '1' });
if (errors.length) console.log(errors.join('\n'));
await browser.close();
