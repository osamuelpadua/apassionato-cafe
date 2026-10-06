// Baixa da loja (Tray CDN) as fotos das embalagens em resolução cheia, o logo e o favicon.
// Uso: node scripts/fetch-store-assets.mjs  → salva em _ref/store/
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'https://loja.appassionatocafe.com.br';
const OUT = new URL('../_ref/store/', import.meta.url);
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130' };

const pages = {
  'delicato-graos-250g': '/cafe-especial/cafe-torrado-em-graos-delicato-250g',
  'delicato-graos-1kg': '/cafe-especial/cafe-torrado-em-graos-delicato-1kg',
  'delicato-moido-250g': '/cafe-especial/cafe-torrado-e-moido-delicato-250g',
  'moderato-moido-250g': '/cafe-especial/cafe-torrado-e-moido-moderato-250g',
  'moderato-intenso-1kg': '/cafe-gourmet/em-graos/cafe-em-graos-appassionato-moderato-intenso-gourmet-1kg',
  'especial-graos-250g': '/cafe-especial-/cafe-especial-appassionato-em-graos-100-arabica-250g',
  'capsulas': '/cafe-especial/cafe-em-capsulas',
  'kit-2-delicato-graos': '/cafe-especial/cafe-gourmet-torrado-em-graos-delicato-notas-de-avela-e-caramelo-1kg',
  'kit-5-delicato-graos': '/cafe-especial/kit-5-cafe-gourmet-torrado-em-graos-delicato-notas-de-avela-e-caramelo-1kg',
  'kit-4-delicato-moido': '/cafe-gourmet/em-po/kit-4-cafe-gourmet-torrado-e-moido-po-appassionato-250g',
  'kit-3-expresso-graos': '/cafe-especial/kit-3-un-cafe-gourmet-em-graos-expresso-100-arabica-1kg',
  'kit-2-especial-graos': '/cafe-especial-/kit-2-cafe-especial-appassionato-em-graos-100-arabica-250g',
  'kit-4-especial-graos': '/cafe-especial-/kit-4-cafe-especial-appassionato-em-graos-100-arabica-250g',
};

const extras = {
  'logo.png': 'https://images.tcdn.com.br/files/1062101/themes/41/img/settings/logonova123.png',
  'favicon.ico': 'https://images.tcdn.com.br/img/img_prod/1062101/1663957883_favicon.ico',
};

async function save(url, name) {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  await writeFile(new URL(name, OUT), Buffer.from(await res.arrayBuffer()));
  console.log('ok', name);
}

await mkdir(OUT, { recursive: true });
const report = {};

for (const [slug, path] of Object.entries(pages)) {
  const html = await (await fetch(BASE + path, { headers: UA })).text();
  // Imagens do produto: URLs img_prod com qualquer prefixo de tamanho (ex.: 180_, 1000_); remove o prefixo para a original.
  const urls = [...html.matchAll(/https:\/\/images\.tcdn\.com\.br\/img\/img_prod\/1062101\/[^"'\s)?]+\.(?:jpe?g|png|webp)/gi)]
    .map((m) => m[0].replace(/\/\d+_(?=[^/]+$)/, '/'))
    .filter((u) => !/banner|favicon/i.test(u));
  const unique = [...new Set(urls)];
  const title = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '').replace(/<[^>]+>/g, '').trim();
  report[slug] = { path, title, images: unique.slice(0, 4) };
  let i = 1;
  for (const u of unique.slice(0, 2)) {
    const ext = u.split('.').pop().toLowerCase();
    try { await save(u, `${slug}-${i}.${ext}`); i++; } catch (e) { console.warn('falhou', e.message); }
  }
}
for (const [name, url] of Object.entries(extras)) await save(url, name);
await writeFile(new URL('report.json', OUT), JSON.stringify(report, null, 2));
