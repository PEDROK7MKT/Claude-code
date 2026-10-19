// usage: NODE_PATH=$(npm root -g) node frames2.js <start> <end>   (env VAR, OUT, PAGE)
const { chromium } = require('playwright'); const path = require('path');
const [start, end] = process.argv.slice(2).map(Number); const FPS = 30;
const V = process.env.VAR || 'org'; const OUT = process.env.OUT || 'frames'; const PAGE = process.env.PAGE || 'index.html';
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto((process.env.BASE || 'http://127.0.0.1:8099/') + PAGE + '?v=' + V, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  const W = await p.evaluate(() => window.BLUR || []);
  const kOf = t => W.reduce((k, [a, b, n]) => (t >= a && t <= b ? Math.max(k, n) : k), 1);
  for (let f = start; f < end; f++) { const T = f / FPS; const nm = String(f).padStart(5, '0'); const K = kOf(T);
    if (K > 1) { for (let k = 0; k < K; k++) { await p.evaluate(t => window.render(t), T + ((k + .5) / K - .5) * (.5 / FPS));
        await p.screenshot({ path: `${OUT}/sub/f${nm}_${k}.jpg`, type: 'jpeg', quality: 95 }); } }
    else { await p.evaluate(t => window.render(t), T); await p.screenshot({ path: `${OUT}/f${nm}.jpg`, type: 'jpeg', quality: 95 }); } }
  await b.close(); })();
