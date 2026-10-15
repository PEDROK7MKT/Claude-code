#!/usr/bin/env node
// Grava um vídeo de navegação do site no celular (390×844 @2x) e converte para MP4.
//   node tools/record-mobile.mjs [saida.mp4]
// Requer: Playwright (Chromium) e ffmpeg.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const OUT = process.argv[2] || join(ROOT, 'preview/fh-vistorias-mobile.mp4');
const TMP = join(ROOT, 'preview/.rec');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = p === '/' ? join(PUB, 'index.html') : join(PUB, p);
  if (!existsSync(f) || statSync(f).isDirectory()) f += '.html';
  if (!existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

// Indicador de toque (bolinha) — o vídeo mostra onde o "dedo" tocou.
const tapScript = () => {
  window.__tap = (x, y) => {
    const d = document.createElement('div');
    d.style.cssText = `position:fixed;left:${x - 22}px;top:${y - 22}px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(17,17,17,.35);z-index:99999;pointer-events:none;transform:scale(.6);opacity:1;transition:transform .45s ease,opacity .45s ease`;
    document.documentElement.appendChild(d);
    requestAnimationFrame(() => { d.style.transform = 'scale(1.25)'; d.style.opacity = '0'; });
    setTimeout(() => d.remove(), 600);
  };
};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const browser = await pw.chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  recordVideo: { dir: TMP, size: { width: 780, height: 1688 } },
});
await ctx.addInitScript(tapScript);
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

// rolagem suave controlada (px, ms)
const scrollBy = (dy, ms) => page.evaluate(([dy, ms]) => new Promise((r) => {
  const y0 = scrollY, t0 = performance.now();
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const step = (t) => { const k = Math.min(1, (t - t0) / ms); scrollTo(0, y0 + dy * ease(k)); k < 1 ? requestAnimationFrame(step) : r(); };
  requestAnimationFrame(step);
}), [dy, ms]);
const scrollToSel = async (sel, ms = 1400, offset = 80) => {
  const y = await page.evaluate(([s, o]) => document.querySelector(s).getBoundingClientRect().top - o, [sel, offset]);
  await scrollBy(y, ms);
};
const tap = async (sel, { follow = true } = {}) => {
  const el = page.locator(sel).first();
  const b = await el.boundingBox();
  const x = b.x + b.width / 2, y = b.y + b.height / 2;
  await page.evaluate(([x, y]) => window.__tap(x, y), [x, y]);
  await wait(350);
  if (follow) await el.click();
};
const go = async (path) => { await page.goto(base + path, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); };

// ---------------- roteiro (~50 s)
await go('/');
await wait(2200);
await scrollToSel('.ficha', 1600, 70);           // ficha "antes de vir"
await wait(2000);
await scrollToSel('#resposta', 1400);
await wait(1600);
await scrollToSel('#diferenciais', 1600);
await wait(1400);
await scrollBy(420, 1800);
await wait(700);
await scrollToSel('#servicos', 1400);
await wait(1800);
await scrollToSel('#como', 1500);
await wait(1200);
await scrollBy(560, 2200);
await wait(900);
await scrollBy(-99999, 1500);                     // volta ao topo
await wait(500);
await tap('.menu-btn');                           // abre o menu
await wait(1500);
await tap('#menu a[href="/vistoria-de-transferencia"]', { follow: false });
await go('/vistoria-de-transferencia');
await wait(1600);
await scrollBy(700, 2400);
await wait(1200);
await scrollToSel('.price-box', 1500);
await wait(1500);
await scrollToSel('.steps', 1500);
await wait(1600);
await go('/valores');
await wait(1200);
await scrollToSel('.table', 1600, 90);
await wait(2200);
await go('/perguntas-frequentes');
await wait(900);
await scrollToSel('.faq', 1400, 90);
await page.evaluate(() => document.querySelectorAll('.faq details').forEach((d) => (d.open = false)));
await wait(700);
await tap('.faq details:nth-child(3) summary');
await wait(1800);
await go('/contato');
await wait(1300);
await scrollBy(560, 2000);
await wait(1500);
await scrollBy(-99999, 1200);
await wait(700);
await tap('.actionbar a.wa', { follow: false });  // destaca o WhatsApp (sem sair do site)
await wait(1800);

const video = page.video();
await ctx.close();
const webm = await video.path();
await browser.close();
server.close();

mkdirSync(dirname(OUT), { recursive: true });
// corta o primeiro meio segundo (tela em branco do carregamento) e gera MP4 H.264
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '0.6', '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-an', OUT]);
rmSync(TMP, { recursive: true, force: true });
console.log('✓', OUT);
