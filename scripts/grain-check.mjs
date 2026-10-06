// Prancha de calibração do grão: recorta uma área sem texto de cada bloco, em tamanho real (1:1).
import { chromium } from 'playwright';
import sharp from 'sharp';
const BASE = process.argv[2] || 'http://localhost:5180/';
const W = 300, H = 170;
const targets = [
  ['', '.hero', 'right', 'Hero (foto)'],
  ['', '.journey__intro', 'left', 'História (marrom)'],
  ['', '#etapa-colheita', 'right', 'Etapa (foto)'],
  ['', '.journey__end', 'left', 'Fechamento (marrom)'],
  ['', '.quiz', 'left', 'Quiz (creme)'],
  ['', '.cafes', 'right', 'Cafés (creme)'],
  ['', '.club', 'right', 'Clube (laranja)'],
  ['', '.testimonials', 'right', 'Depoimentos (creme)'],
  ['', '.insta', 'right', 'Instagram (papel)'],
  ['', '.final', 'right', 'CTA final (marrom)'],
  ['', '.site-footer', 'right', 'Rodapé (marrom escuro)'],
  ['historia.html#colheita', '.taste', 'left', 'Prove (marrom)'],
];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await p.addInitScript(() => { try { localStorage.setItem('cookie-ok', '1'); } catch {} });
const tiles = [];
let cur = null;
for (const [path, sel, side, label] of targets) {
  if (cur !== path) { await p.goto(BASE + path, { waitUntil: 'networkidle' }); cur = path; await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } }); }
  const box = await p.evaluate((s) => { const el = document.querySelector(s); if (s === '.hero') scrollTo(0, 0); else el.scrollIntoView({ block: 'start' }); const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
  await p.waitForTimeout(500);
  const x = side === 'right' ? Math.max(0, box.x + box.w - W - 24) : box.x + 24;
  const y = sel === '.site-footer' ? box.y + 20 : sel === '.taste' ? box.y + 20 : sel === '.hero' ? 110 : Math.max(box.y + 90, 100);
  const buf = await p.screenshot({ clip: { x, y, width: W, height: H } });
  const lab = Buffer.from(`<svg width="${W}" height="22"><rect width="100%" height="100%" fill="#000"/><text x="6" y="15" font-size="12" font-family="Arial" fill="#fff">${label}</text></svg>`);
  tiles.push(await sharp({ create: { width: W, height: H + 22, channels: 3, background: '#000' } }).composite([{ input: buf, top: 0, left: 0 }, { input: lab, top: H, left: 0 }]).png().toBuffer());
}
const cols = 4, rows = Math.ceil(tiles.length / cols);
await sharp({ create: { width: cols * (W + 6), height: rows * (H + 28), channels: 3, background: '#777' } })
  .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * (W + 6), top: Math.floor(i / cols) * (H + 28) }))).png().toFile(process.argv[3] || 'grain-check.png');
await b.close();
