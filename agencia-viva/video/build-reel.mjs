// Gera video/reel.html: palco 1080x1920 com a animação (GSAP, pausada) que o render.mjs percorre quadro a quadro.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brandSvg, brandDefs } from '../src/brand.mjs'
import { cities } from '../src/data.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const ler = f => readFileSync(join(aqui, f), 'utf8')
const logos = Object.fromEntries(Object.keys(brandSvg).map(k => [k, brandSvg[k]()]))

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
<script>window.LOGOS = ${JSON.stringify(logos)}; window.CIDADES = ${JSON.stringify(cities.map(c => c.name))};</script>
<script>${ler('kit.js')}</script>
<script>${ler('reel.js')}</script>
</body></html>`
writeFileSync(join(aqui, 'reel.html'), html)
console.log('✓ reel.html')
