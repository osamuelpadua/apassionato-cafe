import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;
const read = (p) => readFileSync(resolve(root, p), 'utf8');

/**
 * Pequeno "templating" em tempo de build para as páginas estáticas:
 *  <x-include src="partials/x.html"></x-include>  → conteúdo do parcial (recursivo)
 *  <x-logo class=".."></x-logo> → SVG inline do logo horizontal oficial (cores via CSS vars)
 *  <x-symbol class=".."></x-symbol> → símbolo coração-grão inline
 *  <x-pic name="hero-antes" sizes="100vw" alt=".." class=".." loading="lazy|eager" fetchpriority="high"></x-pic>
 *      → <picture> com AVIF + WebP, srcset e width/height (evita CLS)
 */
function brandHtml() {
  const sizes = () => JSON.parse(read('src/js/data/image-sizes.json'));
  const attrs = (s) => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

  function pic(a, s) {
    const meta = s[a.name];
    if (!meta) throw new Error(`x-pic: imagem desconhecida "${a.name}"`);
    const set = (ext) => meta.widths.map((w) => `img/${a.name}-${w}.${ext} ${w}w`).join(', ');
    const largest = meta.widths[meta.widths.length - 1];
    const fallbackW = meta.widths.find((w) => w >= 960) || largest;
    const sz = a.sizes || '100vw';
    const w = a.width || 1000, h = a.height || Math.round(1000 * meta.ratio);
    const extra = ['loading', 'fetchpriority', 'decoding', 'style', 'data-parallax']
      .filter((k) => a[k] !== undefined).map((k) => ` ${k}="${a[k]}"`).join('');
    const imgCls = a['img-class'] ? ` class="${a['img-class']}"` : '';
    return `<picture class="pic ${a.class || ''}"${a['data-layer'] ? ` data-layer="${a['data-layer']}"` : ''}>` +
      `<source type="image/avif" srcset="${set('avif')}" sizes="${sz}">` +
      `<source type="image/webp" srcset="${set('webp')}" sizes="${sz}">` +
      `<img src="img/${a.name}-${fallbackW}.webp" width="${w}" height="${h}" alt="${a.alt ?? ''}"${imgCls}${extra}${a.loading ? '' : ' loading="lazy"'} decoding="async">` +
      `</picture>`;
  }

  function expand(html, depth = 0) {
    if (depth > 5) return html;
    html = html.replace(/<x-include\s+src="([^"]+)"\s*><\/x-include>/g, (_, p) => expand(read(p), depth + 1));
    return html;
  }

  return {
    name: 'appassionato-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const s = sizes();
        html = expand(html);
        // Logo e símbolo declarados uma vez no sprite (<x-brand-defs>) e reutilizados com <use>
        const brand = { 'logo-horizontal': 'logo-horizontal.svg', 'i-heart': 'symbol.svg' };
        const vb = {};
        const defs = Object.entries(brand).map(([id, file]) => {
          const svg = read(`src/assets/svg/${file}`);
          vb[id] = svg.match(/viewBox="([^"]+)"/)[1];
          const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
          return `<symbol id="${id}" viewBox="${vb[id]}">${inner}</symbol>`;
        }).join('');
        html = html.replace('<x-brand-defs></x-brand-defs>', defs);
        // O <symbol> já mapeia o próprio viewBox; o <svg> externo usa só largura × altura a partir de 0 0
        const outerVb = (id) => { const [, , w, h] = vb[id].split(/\s+/); return `0 0 ${w} ${h}`; };
        const useSvg = (id, cls) => `<svg class="${cls}" viewBox="${outerVb(id)}" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
        html = html.replace(/<x-logo([^>]*)><\/x-logo>/g, (_, at) => useSvg('logo-horizontal', attrs(at).class || ''));
        html = html.replace(/<x-symbol([^>]*)><\/x-symbol>/g, (_, at) => useSvg('i-heart', attrs(at).class || 'heart-bean'));
        html = html.replace(/<x-pic([^>]*)><\/x-pic>/g, (_, at) => pic(attrs(at), s));
        return html;
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [brandHtml()],
  server: { port: 5180, host: true },
  preview: { port: 4180 },
  build: {
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        historia: resolve(root, 'historia.html'),
        'design-system': resolve(root, 'design-system.html'),
      },
    },
  },
});
