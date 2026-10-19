// usage: NODE_PATH=$(npm root -g) node cues.js [page=index.html]  -> cues.json {cues,total}
const { chromium } = require('playwright'); const path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
 await p.goto((process.env.BASE || 'http://127.0.0.1:8099/') + (process.argv[2] || 'index.html'), { waitUntil: 'load' });
 const c = await p.evaluate(() => ({ cues: window.CUES, total: window.TOTAL }));
 require('fs').writeFileSync('cues.json', JSON.stringify(c)); const by = {}; c.cues.forEach(x => by[x.n] = (by[x.n] || 0) + 1);
 console.log(c.cues.length, c.total, JSON.stringify(by)); await b.close(); })();
