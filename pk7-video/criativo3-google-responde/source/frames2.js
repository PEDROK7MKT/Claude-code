const { chromium } = require('playwright');
const [start, end] = process.argv.slice(2).map(Number); const FPS = 30;
const V = process.env.VAR || 'dare'; const OUT = process.env.OUT || 'frames';
// motion-blur windows [from, to, subframes]; a frame uses the largest K of the windows containing it
const W = [[4.17,4.41,96],[4.57,5.01,48],[9.52,9.76,96],[9.92,10.36,48],[14.53,15.47,48],[15.08,15.52,48],[15.48,15.92,48],[21.31,21.55,96],[21.71,22.15,48],[26.67,26.91,96],[27.07,27.51,48],[32.22,32.66,48],[37.03,37.97,48],[37.53,37.95,48],[39.78,40.3,32],[40.18,40.58,48]];
const kOf = t => W.reduce((k, [a, b, n]) => (t >= a && t <= b ? Math.max(k, n) : k), 1);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('http://127.0.0.1:8098/index.html?v=' + V, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  for (let f = start; f < end; f++) { const T = f / FPS; const nm = String(f).padStart(5, '0'); const K = kOf(T);
    if (K > 1) { for (let k = 0; k < K; k++) { await p.evaluate(t => window.render(t), T + ((k + .5) / K - .5) * (.5 / FPS));
        await p.screenshot({ path: `${OUT}/sub/f${nm}_${k}.jpg`, type: 'jpeg', quality: 95 }); } }
    else { await p.evaluate(t => window.render(t), T); await p.screenshot({ path: `${OUT}/f${nm}.jpg`, type: 'jpeg', quality: 95 }); } }
  await b.close(); })();
