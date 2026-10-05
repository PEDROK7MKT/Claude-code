// usage: node frames2.js start end  -> frames/fNNNNN.png ; frames inside motion windows are rendered as 8 sub-frames
// (180-degree shutter) into frames/sub/ for averaging (real motion blur).
const { chromium } = require('playwright');
const [start, end] = process.argv.slice(2).map(Number); const FPS = 30, K = 24;
const W = [[.08,1.62],[10.6,11.4],[14.45,15.75],[19.3,20.1],[22.55,23.15],[24.85,25.2],[32.6,33.05],[38.1,38.9],[42.3,42.8],
           [46.1,46.9],[49.5,50.0],[52.0,52.5],[54.5,55.0],[57.5,58.0],[59.6,60.4],[66.3,67.1],[69.6,70.4],[74.1,74.9],[79.1,79.9]];
const inW = t => W.some(([a, b]) => t >= a && t <= b);
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('http://127.0.0.1:8096/index.html', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  for (let f = start; f < end; f++) { const T = f / FPS; const nm = String(f).padStart(5, '0');
    if (inW(T)) { for (let k = 0; k < K; k++) { await p.evaluate(t => window.render(t), T + ((k + .5) / K - .5) * (.5 / FPS));
        await p.screenshot({ path: `frames/sub/f${nm}_${k}.jpg`, type: 'jpeg', quality: 95 }); } }
    else { await p.evaluate(t => window.render(t), T); await p.screenshot({ path: `frames/f${nm}.jpg`, type: 'jpeg', quality: 95 }); } }
  await b.close(); })();
