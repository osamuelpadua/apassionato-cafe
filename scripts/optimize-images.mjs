// Gera as imagens finais em public/img/ (AVIF + WebP, várias larguras) a partir de _ref/.
// Uso: node scripts/optimize-images.mjs
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const OUT = 'public/img/';
await mkdir(OUT, { recursive: true });

// nome → [origem, larguras, opções]
const photos = {
  'hero-antes': ['_ref/gen/hero-antes-a.png', [640, 960, 1440, 1920, 2560]],
  'hero-depois': ['_ref/gen/hero-depois-d.png', [640, 960, 1440, 1920, 2560]],
  plantio: ['_ref/gen/plantio.png', [320, 640, 960, 1440, 1920]],
  colheita: ['_ref/gen/colheita.png', [320, 640, 960, 1440, 1920]],
  secagem: ['_ref/gen/secagem.png', [320, 640, 960, 1440, 1920]],
  torra: ['_ref/gen/torra.png', [320, 640, 960, 1440, 1920]],
  xicara: ['_ref/gen/xicara.png', [320, 640, 960, 1440, 1920]],
  'clube-antes': ['_ref/gen/clube-antes.png', [640, 960, 1440]],
  'clube-depois': ['_ref/gen/clube-depois.png', [640, 960, 1440]],
  cta: ['_ref/gen2/cta.png', [480, 800, 1200]],
  quiz: ['_ref/gen2/quiz.png', [480, 800]],
  'insta-1': ['_ref/gen2/insta-1.png', [400, 720]],
  'insta-2': ['_ref/gen2/insta-2.png', [400, 720]],
  'insta-3': ['_ref/gen2/insta-4.png', [400, 720]],
  'insta-4': ['_ref/gen2/quiz.png', [400, 720], { square: true }],
  'insta-5': ['_ref/gen2/cena-produto.png', [400, 720], { square: true, position: 'right' }],
  'insta-6': ['_ref/gen2/gal-4.png', [400, 720], { square: true }],
  'cena-produto': ['_ref/gen2/cena-produto.png', [640, 960, 1440]],
  'colheita-wide': ['_ref/gen2/colheita-wide.png', [960, 1440, 1920, 2560]],
  'gal-1': ['_ref/gen2/gal-1.png', [480, 960, 1440]],
  'gal-2': ['_ref/gen2/gal-2.png', [480, 960, 1440]],
  'gal-3': ['_ref/gen2/gal-3.png', [480, 960, 1440]],
  'gal-4': ['_ref/gen2/gal-4.png', [480, 960, 1440]],
};

// Embalagens recortadas (PNG com alfa)
const packs = {
  'delicato-graos': '_ref/cutout/delicato-graos.png',
  'delicato-moido': '_ref/cutout/delicato-moido.png',
  'moderato-moido': '_ref/cutout/moderato-moido.png',
  'moderato-intenso': '_ref/cutout/moderato-intenso.png',
  'especial-graos': '_ref/cutout/especial-graos.png',
  capsulas: '_ref/cutout/capsulas.png',
  'drip-coffee': '_ref/cutout/drip-coffee-branded.png',
  kits: '_ref/cutout/kits.png',
};

const sizes = {};

async function emit(name, input, widths, opts = {}) {
  let base = sharp(input);
  if (opts.square) {
    const m = await sharp(input).metadata();
    const side = Math.min(m.width, m.height);
    const left = opts.position === 'right' ? m.width - side - Math.round(m.width * 0.08) : Math.round((m.width - side) / 2);
    base = sharp(await sharp(input).extract({ left: Math.max(0, left), top: Math.round((m.height - side) / 2), width: side, height: side }).toBuffer());
  }
  const buf = await base.toBuffer();
  const meta = await sharp(buf).metadata();
  const ratio = meta.height / meta.width;
  for (const w of widths) {
    if (w > meta.width * 1.05) continue;
    const r = sharp(buf).resize({ width: w });
    await r.clone().avif({ quality: opts.lineArt ? 38 : opts.alpha ? 60 : 52, effort: 5 }).toFile(`${OUT}${name}-${w}.avif`);
    await r.clone().webp({ quality: opts.alpha ? 82 : 78, alphaQuality: 90 }).toFile(`${OUT}${name}-${w}.webp`);
  }
  sizes[name] = { w: meta.width, h: meta.height, ratio: +ratio.toFixed(4), widths: widths.filter((w) => w <= meta.width * 1.05) };
  console.log('ok', name);
}

// Composição dos Kits: 3 embalagens sobrepostas
async function buildKits() {
  const H = 900;
  const pick = ['_ref/cutout/delicato-graos.png', '_ref/cutout/especial-graos.png', '_ref/cutout/moderato-moido.png'];
  const imgs = await Promise.all(pick.map(async (p, i) => {
    const h = i === 1 ? H : Math.round(H * 0.86);
    const b = await sharp(p).resize({ height: h }).toBuffer();
    const m = await sharp(b).metadata();
    return { b, w: m.width, h: m.height };
  }));
  const overlap = 0.38;
  const width = Math.round(imgs[0].w * (1 - overlap) + imgs[1].w + imgs[2].w * (1 - overlap));
  const x1 = Math.round(imgs[0].w * (1 - overlap));
  const x2 = x1 + imgs[1].w - Math.round(imgs[2].w * overlap);
  await sharp({ create: { width, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: imgs[0].b, left: 0, top: H - imgs[0].h },
      { input: imgs[2].b, left: x2, top: H - imgs[2].h },
      { input: imgs[1].b, left: x1, top: 0 },
    ]).png().toFile('_ref/cutout/kits.png');
}

// Drip Coffee provisório: recorta o PNG gerado (já com alfa)
async function buildDrip() {
  await sharp('_ref/gen2/drip.png').trim({ threshold: 5 }).png().toFile('_ref/cutout/drip-coffee.png');
}

// Ramos em traço: rasteriza o SVG e converte em alfa por luminância, com 2 tintas
async function buildBranches() {
  const tints = { dark: [59, 34, 24], light: [227, 192, 122] };
  for (const name of ['ramo-h', 'ramo-v']) {
    const { data, info } = await sharp(`_ref/gen/${name}.svg`, { density: 96 })
      .resize({ width: name === 'ramo-h' ? 1800 : 1100 })
      .flatten({ background: '#ffffff' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const [tint, rgb] of Object.entries(tints)) {
      const out = Buffer.alloc(info.width * info.height * 4);
      for (let i = 0; i < info.width * info.height; i++) {
        const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
        const lum = 0.3 * r + 0.59 * g + 0.11 * b;
        let a = Math.max(0, Math.min(255, (255 - lum) * 1.4));
        a = a < 48 ? 0 : Math.min(255, Math.round(a / 51) * 51); // alfa quantizado: arquivos bem menores
        const orange = r - b > 70;
        const c = orange ? [240, 115, 32] : rgb;
        out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = orange ? Math.max(a, 200 * ((r - b) / 200)) : a;
      }
      const png = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
      await emit(`${name}-${tint}`, png, [700, 1400], { alpha: true, lineArt: true });
    }
  }
}

await buildKits();
await buildDrip();
for (const [name, [src, widths, opts]] of Object.entries(photos)) {
  if (!existsSync(src)) { console.warn('faltando', src); continue; }
  await emit(name, src, widths, opts);
}
for (const [name, src] of Object.entries(packs)) await emit(`pack-${name}`, src, [240, 480, 720], { alpha: true });
await buildBranches();

// Open Graph 1200×630 (cena de produto) e poster leve do hero para preload
await sharp('_ref/gen2/cena-produto.png').resize(1200, 630, { fit: 'cover', position: 'right' }).jpeg({ quality: 82, mozjpeg: true }).toFile('public/og-image.jpg');

await writeFile('src/js/data/image-sizes.json', JSON.stringify(sizes, null, 2));
console.log('pronto');
