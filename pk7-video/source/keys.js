// usage: node keys.js out_dir t1 t2 ...   -> out_dir/k_<t>.jpg ; prints console errors
const { chromium } = require('playwright');
const [out, ...ts] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://127.0.0.1:8096/index.html', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
  for (const t of ts) { await p.evaluate(t => window.render(t), +t); await p.screenshot({ path: `${out}/k_${t}.jpg`, type: 'jpeg', quality: 85 }); }
  if (errs.length) console.log('ERRORS:\n' + errs.join('\n'));
  await b.close();
})();
