// Gera as texturas de grão de filme usadas sobre blocos e fotos.
// - distribuição gaussiana (muitos grãos fracos, poucos fortes), como película
// - leve desfoque: os grãos formam pequenos grumos orgânicos em vez de pixels soltos
// - grain.png: neutro (branco/preto), para fundos claros
// - grain-dark.png: só grãos escuros, para fundos escuros e fotos — não clareia nem cria véu leitoso
// Sem mix-blend-mode: funciona sobre qualquer cor e não pesa na rolagem.
// A intensidade é calibrada por bloco em CSS (--grain), não aqui.
import sharp from 'sharp';

const S = 192;
let seed = 20261006;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

// campo de luminância com média 0, ligeiramente suavizado (com borda periódica: o ladrilho não mostra emenda)
const f = new Float32Array(S * S).map(() => gauss());
const g = new Float32Array(S * S);
const at = (x, y) => f[((y + S) % S) * S + ((x + S) % S)];
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  g[y * S + x] = at(x, y) * 0.52 + (at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1)) * 0.1 + (at(x - 1, y - 1) + at(x + 1, y + 1) + at(x - 1, y + 1) + at(x + 1, y - 1)) * 0.02;
}

const write = (file, pixel) => {
  const px = Buffer.alloc(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    const [c, a] = pixel(g[i]);
    px.set([c, c, c, Math.round(Math.min(255, a) / 8) * 8], i * 4);   // alfa em degraus: arquivo menor
  }
  return sharp(px, { raw: { width: S, height: S, channels: 4 } }).png({ compressionLevel: 9, palette: true, colours: 64, dither: 0 }).toFile(file);
};

await write('src/assets/img/grain.png', (v) => [v > 0 ? 255 : 0, Math.abs(v) * 62]);
// só a metade escura do campo, com alfa mais alto para compensar a densidade menor
await write('src/assets/img/grain-dark.png', (v) => [0, v < 0 ? -v * 120 : 0]);
console.log('ok');
