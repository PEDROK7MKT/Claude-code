// Gera video/reel.html a partir de reels/<nome>.js: palco 1080x1920 com a animação (GSAP, pausada) que o render.mjs percorre quadro a quadro.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brandSvg, brandDefs } from '../src/brand.mjs'
import { cities } from '../src/data.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
// qual Reels montar: reels/<nome>.js (node build-reel.mjs --reel ideal)
const iReel = process.argv.indexOf('--reel'), reel = iReel > 0 ? process.argv[iReel + 1] : 'v1'
const ler = f => readFileSync(join(aqui, f), 'utf8')
const logos = Object.fromEntries(Object.keys(brandSvg).map(k => [k, brandSvg[k]()]))
// mapa do Oeste igual ao do site (tirado do site gerado: rode node build.mjs antes)
const home = readFileSync(join(aqui, '../site/index.html'), 'utf8')
const iMapa = home.indexOf('<svg viewBox="0 0 800 640"'), mapa = iMapa < 0 ? '' : home.slice(iMapa, home.indexOf('</svg>', iMapa) + 6)

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><title>Reels Viva</title>
<style>
@font-face { font-family: Archivo; src: url(../public/assets/fonts/archivo.woff2) format('woff2'); font-weight: 100 900; font-stretch: 62% 125%; }
@font-face { font-family: 'Instrument Serif'; src: url(../public/assets/fonts/instrument-serif-italic.woff2) format('woff2'); font-style: italic; }
@font-face { font-family: Caveat; src: url(../public/assets/fonts/caveat.woff2) format('woff2'); font-weight: 400 700; }
${ler('reel.css')}
</style></head>
<body>
${brandDefs}
<div id="stage"></div>
<script src="../public/assets/vendor/gsap.min.js"></script>
<script>window.LOGOS = ${JSON.stringify(logos)}; window.CIDADES = ${JSON.stringify(cities.map(c => c.name))}; window.MAPA = ${JSON.stringify(mapa)};</script>
<script>${ler('kit.js')}</script>
<script>${ler(`reels/${reel}.js`)}</script>
</body></html>`
writeFileSync(join(aqui, 'reel.html'), html)
console.log(`✓ reel.html (${reel})`)
