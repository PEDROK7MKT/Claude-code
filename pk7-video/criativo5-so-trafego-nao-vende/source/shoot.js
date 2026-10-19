// usage: NODE_PATH=$(npm root -g) node shoot.js <page.html> <t0> <t1> <step> <outdir> [query e.g. "qa=1"]
// renders single samples (no motion blur) at t0, t0+step, ... < t1 into outdir/t_<sec>.jpg and prints console errors
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const [page, t0, t1, step, out, qs] = process.argv.slice(2);
(async () => { fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto((process.env.BASE || 'http://127.0.0.1:8099/') + page + (qs ? '?' + qs : ''), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  for (let t = +t0; t < +t1 - 1e-6; t += +step) { const T = Math.round(t * 1000) / 1000;
    await p.evaluate(t => window.render(t), T); await p.screenshot({ path: `${out}/t_${T.toFixed(3)}.jpg`, type: 'jpeg', quality: 82 }); }
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n')); else console.log('ok, no page errors');
  await b.close(); })();
