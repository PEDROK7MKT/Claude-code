#!/usr/bin/env node
// Checagem pré-publicação: serve ./public com URLs limpas e, com o Chromium,
// verifica cada página do sitemap (+404) em celular e desktop.
//   node tools/check.mjs [pasta-de-screenshots]
// Falha (exit 1) se encontrar: H1 ≠ 1, title > 60, description > 155, JSON-LD inválido,
// link interno quebrado, rolagem horizontal, erro de console ou imagem sem alt.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const SHOTS = process.argv[2];
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json' };
const resolve = (p) => {
  p = decodeURIComponent(p.split('?')[0].split('#')[0]);
  if (p === '/') return join(PUB, 'index.html');
  const f = join(PUB, p);
  if (existsSync(f) && statSync(f).isFile()) return f;
  if (existsSync(f + '.html')) return f + '.html';
  return null;
};
const server = createServer((req, res) => {
  const f = resolve(req.url);
  if (!f) { res.writeHead(404, { 'content-type': TYPES['.html'] }); return res.end(readFileSync(join(PUB, '404.html'))); }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const sitemap = readFileSync(join(PUB, 'sitemap.xml'), 'utf8');
const SITE = sitemap.match(/<loc>(https?:\/\/[^/<]+)/)[1];
const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, '') || '/');
paths.push('/nao-existe');

const browser = await pw.chromium.launch();
const problems = [];
const seenLinks = new Set();
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

for (const [vw, vh, tag] of [[390, 844, 'mobile'], [1366, 900, 'desktop']]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  for (const p of paths) {
    const errors = [];
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.on('console', (m) => m.type() === 'error' && !(p === '/nao-existe' && /404/.test(m.text())) && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(base + p, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const r = await page.evaluate(() => {
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return true; } catch { return false; } });
      return {
        h1: document.querySelectorAll('h1').length,
        title: document.title.length,
        desc: (document.querySelector('meta[name=description]')?.content || '').length,
        canonical: document.querySelector('link[rel=canonical]')?.href || '',
        ldOk: ld.every(Boolean),
        ldCount: ld.length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        noAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
        links: [...document.querySelectorAll('a[href^="/"]')].map((a) => a.getAttribute('href')),
        words: document.querySelector('main').innerText.split(/\s+/).length,
      };
    });
    const id = `${tag} ${p}`;
    if (r.h1 !== 1) problems.push(`${id}: ${r.h1} H1`);
    if (r.title > 60) problems.push(`${id}: title ${r.title} car.`);
    if (r.desc > 155 || r.desc < 50) problems.push(`${id}: description ${r.desc} car.`);
    if (!r.ldOk) problems.push(`${id}: JSON-LD inválido`);
    if (p !== '/nao-existe' && !r.ldCount) problems.push(`${id}: sem JSON-LD`);
    if (r.overflow > 0) problems.push(`${id}: rolagem horizontal de ${r.overflow}px`);
    if (r.noAlt) problems.push(`${id}: ${r.noAlt} imagem(ns) sem alt`);
    if (errors.length) problems.push(`${id}: console → ${errors.join(' | ')}`);
    r.links.forEach((l) => seenLinks.add(l));
    if (tag === 'mobile') console.log(`${p.padEnd(52)} ${String(r.words).padStart(5)} palavras · title ${r.title} · desc ${r.desc}`);
    if (SHOTS) await page.screenshot({ path: join(SHOTS, `${tag}${p === '/' ? '-home' : p.replace(/\//g, '-')}.png`), fullPage: true });
  }
  await ctx.close();
}
for (const l of seenLinks) if (!resolve(l)) problems.push(`link interno quebrado: ${l}`);

await browser.close();
server.close();
if (problems.length) { console.error(`\n✗ ${problems.length} problema(s):\n- ` + problems.join('\n- ')); process.exit(1); }
console.log(`\n✓ ${paths.length} páginas OK em celular e desktop · ${seenLinks.size} links internos verificados`);
