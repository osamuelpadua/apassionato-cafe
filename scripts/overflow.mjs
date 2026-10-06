import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +process.argv[3] || 1440, height: 900 } });
await p.goto(process.argv[2], { waitUntil: 'networkidle' });
const r = await p.evaluate(() => {
  const W = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const rc = el.getBoundingClientRect();
    if (rc.right > W + 1 && rc.width > 0) {
      // ignora elementos dentro de containers com overflow escondido/clip
      let a = el.parentElement, clipped = false;
      while (a && a !== document.body) { const s = getComputedStyle(a); if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) { clipped = true; break; } a = a.parentElement; }
      if (!clipped) out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} right=${Math.round(rc.right)}`);
    }
  }
  return { W, sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, out: out.slice(0, 15) };
});
console.log(JSON.stringify(r, null, 1)); await b.close();
