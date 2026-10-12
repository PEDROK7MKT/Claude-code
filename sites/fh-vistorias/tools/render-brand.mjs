#!/usr/bin/env node
// Renderiza os ativos de marca (favicon, ícones PWA, logo PNG e imagem Open Graph)
// a partir de HTML/SVG, usando o Chromium do Playwright.
//   node tools/render-brand.mjs
// Requer: playwright instalado (global ou local) e ImageMagick (`convert`) para o .ico.
import { createRequire } from 'node:module';
import { writeFileSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BIZ, PRICE } from '../src/data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUB = join(ROOT, 'public');
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require('/opt/node22/lib/node_modules/playwright'); }

// Fontes embutidas em data: URI (páginas about:blank não carregam file://).
const font = (f) => `data:font/woff2;base64,${readFileSync(join(PUB, 'assets/fonts', f)).toString('base64')}`;
const fonts = `@font-face{font-family:"BC";font-weight:800;src:url(${font('barlow-condensed-latin-800-normal.woff2')})}
@font-face{font-family:"BI";font-style:italic;font-weight:800;src:url(${font('barlow-latin-800-italic.woff2')})}`;

// Lupa da marca (a mesma do site).
const lupa = (ring = '#111', lens = '#F26A1B', dot = '#fff') => `<svg viewBox="0 0 40 40"><path d="M13 27L4.5 35.5" stroke="${ring}" stroke-width="6" stroke-linecap="round"/><circle cx="22" cy="18" r="12.5" fill="${lens}" stroke="${ring}" stroke-width="4"/><circle cx="27" cy="13" r="3.2" fill="${dot}"/></svg>`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#111"/><g transform="translate(9 7) scale(1.2)"><path d="M13 27L4.5 35.5" stroke="#F4F4F5" stroke-width="6" stroke-linecap="round"/><circle cx="22" cy="18" r="12.5" fill="#F26A1B" stroke="#F4F4F5" stroke-width="4"/><circle cx="27" cy="13" r="3.2" fill="#fff"/></g></svg>\n`;
writeFileSync(join(PUB, 'icon.svg'), iconSvg);

const logoHtml = (ring, fh, lens, dot) => `<span class="logo"><span class="fh" style="color:${fh}">FH</span><span class="v">vist<i class="l">${lupa(ring, lens, dot)}</i>rias</span></span>`;
const base = `<style>${fonts}*{margin:0;box-sizing:border-box}body{width:var(--w);height:var(--h);overflow:hidden}
.logo{display:inline-flex;align-items:baseline;gap:.06em;line-height:1;white-space:nowrap}
.fh{font:italic 800 1.62em/1 "BI";letter-spacing:-.04em}
.v{font:700 1.5em/1 Arial,Helvetica,sans-serif;letter-spacing:-.02em;color:#F26A1B;display:inline-flex;align-items:baseline}
.l{display:inline-block;width:.72em;height:.72em;margin:0 .02em;transform:translateY(.08em)}.l svg{width:100%;height:100%;overflow:visible}</style>`;

const jobs = [
  {
    out: 'images/logo-fh-vistorias.png', w: 512, h: 512,
    html: `${base}<body style="--w:512px;--h:512px;background:#F26A1B;display:grid;place-items:center;font-size:48px;border-radius:0">
      <div style="text-align:center">${logoHtml('#111', '#111', '#fff', '#F26A1B')}
      <div style="font:800 30px/1 BC;letter-spacing:.16em;color:#111;margin-top:20px;text-transform:uppercase;white-space:nowrap">Vistoria veicular · LEM-BA</div></div>
      <style>.v{color:#fff}</style></body>`,
  },
  {
    out: 'images/og-fh-vistorias.png', w: 1200, h: 630,
    html: `${base}<body style="--w:1200px;--h:630px;background:#111;color:#fff;font-family:Arial,Helvetica,sans-serif;position:relative">
      <div style="position:absolute;right:-350px;top:-60px;width:620px;height:760px;background:linear-gradient(115deg,transparent 0 40%,#F26A1B 40% 44%,transparent 44% 52%,rgba(242,106,27,.16) 52% 100%)"></div>
      <div style="position:absolute;left:72px;top:64px;right:72px">
        <div style="font-size:34px">${logoHtml('#EDEDED', '#fff')}</div>
        <div style="font:800 92px/0.95 BC;text-transform:uppercase;margin-top:40px;max-width:900px">Vistoria veicular em<br>Luís Eduardo Magalhães</div>
        <div style="font:800 44px/1 BC;color:#FF7A2E;text-transform:uppercase;margin-top:18px;letter-spacing:.02em">Credenciada pelo DETRAN-BA</div>
        <div style="display:flex;gap:14px;margin-top:40px;flex-wrap:wrap;font-weight:700;font-size:24px">
          ${['Carro · moto · caminhão', 'Sem agendamento', 'Laudo na hora', PRICE.display].map((t, i) => `<span style="padding:12px 20px;border-radius:999px;${i === 3 ? 'background:#F26A1B;color:#111' : 'border:2px solid #3a3a3f'}">${t}</span>`).join('')}
        </div>
        <div style="margin-top:34px;font-size:24px;color:#B9B9BF">${BIZ.street}, Centro · LEM-BA · WhatsApp ${BIZ.phoneDisplay}</div>
      </div></body>`,
  },
  ...[
    ['apple-touch-icon.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['favicon-32.png', 32],
    ['favicon-16.png', 16],
  ].map(([out, s]) => ({ out, w: s, h: s, html: `<style>*{margin:0}body{width:${s}px;height:${s}px;overflow:hidden}svg{width:${s}px;height:${s}px;display:block}</style>${iconSvg}` })),
];

const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const j of jobs) {
  await page.setViewportSize({ width: j.w, height: j.h });
  await page.setContent(j.html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(PUB, j.out), omitBackground: false });
  console.log('✓', j.out);
}
await browser.close();

execFileSync('convert', [join(PUB, 'favicon-16.png'), join(PUB, 'favicon-32.png'), join(PUB, 'favicon.ico')]);
for (const f of ['favicon-16.png', 'favicon-32.png']) execFileSync('rm', [join(PUB, f)]);
console.log('✓ favicon.ico');
