// Vetoriza o logo a partir da foto da embalagem Especial (fundo branco) — PROVISÓRIO.
// [confirmar] Substituir pelo vetor do PDF do cliente quando ele chegar.
// Saída: src/assets/svg/logo-stacked.svg, logo-horizontal.svg, symbol.svg
// Cores via CSS: .lg-mark (símbolo, "ppa", "Café") = laranja; .lg-name (resto do nome) = currentColor.
import sharp from 'sharp';
import potrace from 'potrace';
import { promisify } from 'node:util';
import { writeFile, mkdir } from 'node:fs/promises';

const trace = promisify(potrace.trace);
const SRC = '_ref/store/especial-graos-250g-1.jpg';
const OUT = 'src/assets/svg/';
const W = 2240;

const { data, info } = await sharp(SRC)
  .extract({ left: 485, top: 440, width: 300, height: 228 })
  .resize({ width: W, kernel: 'lanczos3' })
  .removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const n = w * h;

// Faixas verticais (proporção da altura): símbolo, nome, "Café"
const band = { symbol: [0, 0.47], name: [0.47, 0.7227], cafe: [0.7227, 1] };

const masks = { orange: Buffer.alloc(n, 255), brown: Buffer.alloc(n, 255) };
for (let i = 0; i < n; i++) {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
  const dark = 255 - (0.3 * r + 0.59 * g + 0.11 * b);
  if (dark < 45) continue;
  const v = Math.max(0, 255 - Math.min(255, (dark - 45) * 4));
  const y = Math.floor(i / w) / h;
  const isOrange = y < band.symbol[1] || y >= band.cafe[0] || r - b > 55;
  const m = isOrange ? masks.orange : masks.brown;
  m[i] = Math.min(m[i], v);
}

async function smooth(buf) {
  return sharp(buf, { raw: { width: w, height: h, channels: 1 } }).blur(2.2).threshold(150).png().toBuffer();
}

// Corta uma faixa vertical (e opcionalmente horizontal) e vetoriza; devolve paths sem as manchas pequenas.
async function tracePart(maskPng, [y0, y1], minArea = 900) {
  const top = Math.round(y0 * h), height = Math.round((y1 - y0) * h);
  const part = await sharp(maskPng).extract({ left: 0, top, width: w, height }).png().toBuffer();
  const svg = await trace(part, { turdSize: 60, optTolerance: 0.3, alphaMax: 1, threshold: 128 });
  const d = svg.match(/ d="([^"]+)"/)?.[1] || '';
  // potrace junta todos os subpaths num "d"; separa por "M" e descarta os de área pequena
  const subs = d.split(/(?=M)/).filter(Boolean).filter((p) => {
    const nums = p.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
    const xs = nums.filter((_, k) => k % 2 === 0), ys = nums.filter((_, k) => k % 2 === 1);
    const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    return area >= minArea;
  });
  return { d: subs.join('').replace(/-?\d+\.\d+/g, (n) => String(Math.round(+n * 10) / 10)), top };
}

const orangePng = await smooth(masks.orange);
const brownPng = await smooth(masks.brown);

const symbol = await tracePart(orangePng, band.symbol, 150);
const namePpa = await tracePart(orangePng, band.name, 150);
const nameRest = await tracePart(brownPng, band.name, 450);
const cafe = await tracePart(orangePng, band.cafe, 150);

// Bounding boxes reais a partir das máscaras, para enquadrar o viewBox
async function bbox(png, [y0, y1]) {
  const top = Math.round(y0 * h), height = Math.round((y1 - y0) * h);
  const cut = await sharp(png).extract({ left: 0, top, width: w, height }).negate().png().toBuffer();
  const { info: i } = await sharp(cut).trim({ threshold: 10 }).toBuffer({ resolveWithObject: true });
  return { x: -i.trimOffsetLeft, y: top - i.trimOffsetTop, w: i.width, h: i.height };
}
const bSym = await bbox(orangePng, band.symbol);
const bNameO = await bbox(orangePng, band.name);
const bNameB = await bbox(brownPng, band.name);
const bCafe = await bbox(orangePng, band.cafe);
const nameBox = {
  x: Math.min(bNameO.x, bNameB.x), y: Math.min(bNameO.y, bNameB.y),
  r: Math.max(bNameO.x + bNameO.w, bNameB.x + bNameB.w), b: Math.max(bNameO.y + bNameO.h, bNameB.y + bNameB.h),
};

const style = '';
const FILL = { 'lg-mark': 'fill:var(--logo-mark,#F07320)', 'lg-name': 'fill:var(--logo-name,currentColor)' };
const g = (cls, part) => `<path style="${FILL[cls]}" fill-rule="evenodd" transform="translate(0 ${part.top})" d="${part.d}"/>`;

// Empilhado (símbolo + nome + Café)
{
  const x0 = Math.min(bSym.x, nameBox.x, bCafe.x), y0 = bSym.y;
  const x1 = Math.max(bSym.x + bSym.w, nameBox.r, bCafe.x + bCafe.w), y1 = bCafe.y + bCafe.h;
  const p = 12; const vb = `${x0 - p} ${y0 - p} ${x1 - x0 + 2 * p} ${y1 - y0 + 2 * p}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="Appassionato Café">${style}${g('lg-mark', symbol)}${g('lg-mark', namePpa)}${g('lg-name', nameRest)}${g('lg-mark', cafe)}</svg>`;
  await mkdir(OUT, { recursive: true });
  await writeFile(OUT + 'logo-stacked.svg', svg);
}

// Horizontal (como o logo da loja): símbolo à esquerda, nome à direita, alinhados ao centro
{
  const scale = (nameBox.b - nameBox.y) * 2.1 / bSym.h; // símbolo ~2,1× a altura do nome
  const gap = (nameBox.b - nameBox.y) * 0.55;
  const symW = bSym.w * scale, symH = bSym.h * scale;
  const nameH = nameBox.b - nameBox.y, nameW = nameBox.r - nameBox.x;
  const H = symH, cy = H / 2;
  const symT = `translate(0 0) scale(${scale}) translate(${-bSym.x} ${-bSym.y})`;
  const nameT = `translate(${symW + gap} ${cy - nameH / 2 - nameH * 0.08}) translate(${-nameBox.x} ${-nameBox.y})`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -6 ${(symW + gap + nameW + 12).toFixed(1)} ${(H + 12).toFixed(1)}" role="img" aria-label="Appassionato Café">${style}` +
    `<g transform="${symT}">${g('lg-mark', symbol)}</g>` +
    `<g transform="${nameT}">${g('lg-mark', namePpa)}${g('lg-name', nameRest)}</g></svg>`;
  await writeFile(OUT + 'logo-horizontal.svg', svg);
}

// Símbolo isolado (favicon, loader, marcador, divisor)
{
  const vb = `${bSym.x} ${bSym.y} ${bSym.w} ${bSym.h}`;
  await writeFile(OUT + 'symbol.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><path fill="currentColor" fill-rule="evenodd" transform="translate(0 ${symbol.top})" d="${symbol.d}"/></svg>`);
  await writeFile('public/favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><path fill="#F07320" fill-rule="evenodd" transform="translate(0 ${symbol.top})" d="${symbol.d}"/></svg>`);
}
console.log('logo ok', { bSym, nameBox, bCafe });
