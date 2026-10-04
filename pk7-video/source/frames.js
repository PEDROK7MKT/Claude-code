const { chromium } = require('playwright');
const [start, end] = process.argv.slice(2).map(Number); const FPS = 30;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('http://127.0.0.1:8095/index.html', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
for (let f = start; f < end; f++) { await p.evaluate(t => window.render(t), f / FPS);
  await p.screenshot({ path: `${process.env.V}/frames/f${String(f).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 }); }
await b.close(); })();
