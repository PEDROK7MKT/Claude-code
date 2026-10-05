const { chromium } = require('playwright');
const [start, end] = process.argv.slice(2).map(Number); const FPS = 30;
const V = process.env.VAR || 'dare'; const OUT = process.env.OUT || 'frames';
// motion-blur windows [from, to, subframes]; a frame uses the largest K of the windows containing it
const W = [[2.60,2.73,24],[4.38,4.62,96],[7.59,7.83,96],[10.92,11.18,96],[14.73,15.67,48],[18.99,19.23,96],[19.23,19.56,32],
  [24.94,25.27,48],[25.78,26.08,96],[26.28,26.48,48],[26.44,26.82,32],[27.60,28.01,48],[28.08,28.49,48],[30.58,30.96,96],[32.78,33.10,96],[33.34,33.48,48],
  [34.78,35.10,48],[34.94,35.50,24],[38.50,38.74,96],[39.63,40.02,48]];
const kOf = t => W.reduce((k, [a, b, n]) => (t >= a && t <= b ? Math.max(k, n) : k), 1);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('http://127.0.0.1:'+(process.env.PORT||8098)+'/index.html?v=' + V, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  for (let f = start; f < end; f++) { const T = f / FPS; const nm = String(f).padStart(5, '0'); const K = kOf(T);
    if (K > 1) { for (let k = 0; k < K; k++) { await p.evaluate(t => window.render(t), T + ((k + .5) / K - .5) * (.5 / FPS));
        await p.screenshot({ path: `${OUT}/sub/f${nm}_${k}.jpg`, type: 'jpeg', quality: 95 }); } }
    else { await p.evaluate(t => window.render(t), T); await p.screenshot({ path: `${OUT}/f${nm}.jpg`, type: 'jpeg', quality: 95 }); } }
  await b.close(); })();
