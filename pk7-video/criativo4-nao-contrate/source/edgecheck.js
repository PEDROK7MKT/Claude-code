// usage: NODE_PATH=$(npm root -g) node edgecheck.js <page.html> <t0> <t1> [step=1/30]
// renders with ?edge=1 (avatar border pixels painted magenta) and counts magenta pixels per frame. Any > 0 = FAIL.
const { chromium } = require('playwright'); const path = require('path');
const [page, t0, t1, st] = process.argv.slice(2); const step = st ? +st : 1 / 30;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto((process.env.BASE || 'http://127.0.0.1:8099/') + page + '?edge=1', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  let bad = 0, n = 0;
  for (let t = +t0; t < +t1 - 1e-6; t += step) { const T = Math.round(t * 1000) / 1000; n++;
    await p.evaluate(t => window.render(t), T);
    const buf = await p.screenshot({ type: 'png' });
    const c = await p.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const x = cv.getContext('2d'); x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, cv.width, cv.height).data; let k = 0, minY = 1e9, maxY = -1;
      for (let i = 0; i < d.length; i += 4) if (d[i] > 150 && d[i + 2] > 150 && d[i + 1] < 90 && Math.abs(d[i] - d[i + 2]) < 70) { k++; const y = Math.floor(i / 4 / cv.width); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
      return { k, minY, maxY }; }, buf.toString('base64'));
    if (c.k > 0) { bad++; console.log(`FAIL t=${T.toFixed(3)} magenta_px=${c.k} y=${c.minY}..${c.maxY}`); } }
  console.log(`edgecheck ${t0}-${t1}: ${n} frames, ${bad} with exposed avatar edges`); await b.close(); })();
