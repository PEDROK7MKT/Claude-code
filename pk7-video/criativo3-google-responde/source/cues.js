const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
 await p.goto('http://127.0.0.1:8098/index.html', { waitUntil: 'load' });
 const c = await p.evaluate(() => ({cues: window.CUES, total: window.TOTAL}));
 require('fs').writeFileSync('cues.json', JSON.stringify(c)); console.log(c.cues.length, c.total);
 const by = {}; c.cues.forEach(x => by[x.n] = (by[x.n] || 0) + 1); console.log(JSON.stringify(by)); await b.close(); })();
