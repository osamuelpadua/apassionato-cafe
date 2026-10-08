// Aplica o logo real e o rótulo na caixa provisória do Drip Coffee. [confirmar] embalagem oficial.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const src = '_ref/cutout/drip-coffee.png';
const logoSvg = (await readFile('src/assets/svg/logo-horizontal.svg', 'utf8')).replace('var(--logo-name,currentColor)', '#fff');
const logo = await sharp(Buffer.from(logoSvg), { density: 300 }).resize({ width: 300 }).png().toBuffer();
const lm = await sharp(logo).metadata();
const cx = 480, top = 330;
const label = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="520" height="120">
  <text x="260" y="52" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="58" letter-spacing="6" fill="#F3E6CF">DRIP COFFEE</text>
  <text x="260" y="98" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" letter-spacing="7" fill="#E3C07A">CAFÉ COADO NA XÍCARA</text>
</svg>`);
await sharp(src).composite([
  { input: logo, left: Math.round(cx - lm.width / 2), top },
  { input: label, left: cx - 260, top: top + lm.height + 40 },
]).png().toFile('_ref/cutout/drip-coffee-branded.png');
console.log('ok');
