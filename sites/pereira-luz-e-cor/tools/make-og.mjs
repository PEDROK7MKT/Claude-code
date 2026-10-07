// Gera as imagens de compartilhamento (Open Graph 1200×630) de cada página.
// Requer Playwright (já instalado globalmente neste ambiente):
//   node tools/make-og.mjs
import { readdirSync, mkdirSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import site from '../site.config.mjs'
import { icon } from '../src/icons.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
let chromium
try { ({ chromium } = require('playwright')) } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')) }

const A = (p) => pathToFileURL(join(ROOT, p)).href
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

const load = async (d) => {
  const dir = join(ROOT, 'src/content', d)
  const out = []
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.mjs'))) out.push((await import(pathToFileURL(join(dir, f)).href)).default)
  return out
}
const cats = await load('categories')
const guides = await load('guides')
const catMap = Object.fromEntries(cats.map((c) => [c.slug, c]))

const cards = [
  { out: 'og-pereira.jpg', kicker: `Loja nova · ${site.address.neighborhood}`, title: 'Material elétrico, tintas e ferragens em Barreiras', photo: true },
  ...cats.map((c) => ({ out: `og/${c.slug}.jpg`, kicker: 'Produtos', title: `${c.name} em Barreiras`, ico: c.icon })),
  ...guides.map((g) => ({ out: `og/guia-${g.slug}.jpg`, kicker: `Guia · ${catMap[g.category]?.shortName || ''}`, title: g.title, ico: catMap[g.category]?.icon || 'book' })),
  { out: 'og/guias.jpg', kicker: 'Dicas do balcão', title: 'Guias para comprar certo e fazer bem feito', ico: 'book' },
  { out: 'og/calculadora-de-tinta.jpg', kicker: 'Ferramenta grátis', title: 'Calculadora de tinta: quantas latas comprar?', ico: 'calc' },
  { out: 'og/perguntas-frequentes.jpg', kicker: 'Central de dúvidas', title: 'Perguntas frequentes', ico: 'info' },
  { out: 'og/sobre.jpg', kicker: 'A loja', title: 'Uma loja de bairro com energia nova', photo: true },
  { out: 'og/contato.jpg', kicker: 'Contato', title: 'Contato e como chegar', ico: 'pin' },
]

const html = (c) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:M;src:url('${A('assets/fonts/montserrat-latin-var-italic.woff2')}');font-weight:100 900;font-style:italic}
@font-face{font-family:I;src:url('${A('assets/fonts/inter-latin-var.woff2')}');font-weight:100 900}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#0b0b0b;color:#fff;font-family:I;position:relative;overflow:hidden}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:48px 48px}
.glow{position:absolute;inset:0;background:radial-gradient(600px circle at 85% 30%,rgba(255,209,0,.22),transparent 60%)}
.l{position:absolute;left:64px;top:56px;width:${c.photo ? 600 : 760}px}
.logo{width:250px}
.k{margin-top:40px;display:inline-block;background:#ffd100;color:#0b0b0b;font:italic 900 22px M;text-transform:uppercase;padding:6px 14px;transform:skewX(-8deg)}
h1{margin-top:22px;font:italic 900 ${c.title.length > 48 ? 54 : 64}px/1.02 M;text-transform:uppercase;letter-spacing:-1.5px}
.ico{position:absolute;right:70px;top:110px;width:330px;height:330px;color:#ffd100;filter:drop-shadow(0 0 40px rgba(255,209,0,.45))}
.ico svg{width:100%;height:100%}
.ph{position:absolute;right:48px;top:48px;width:470px;height:430px;border-radius:24px;overflow:hidden;box-shadow:0 0 0 6px #ffd100,0 30px 60px rgba(0,0,0,.6)}
.ph img{width:100%;height:100%;object-fit:cover;object-position:40% 50%}
.bar{position:absolute;left:0;right:0;bottom:0;height:86px;background:#ffd100;color:#0b0b0b;display:flex;align-items:center;gap:28px;padding:0 64px;font:700 23px I;white-space:nowrap}
.bar b{font:italic 900 26px M}
.hz{position:absolute;left:0;right:0;bottom:86px;height:12px;background:repeating-linear-gradient(-45deg,#ffd100 0 16px,#0b0b0b 16px 32px)}
</style></head><body><div class="grid"></div><div class="glow"></div>
<div class="l"><img class="logo" src="${A('assets/img/logo-pereira.svg')}"><br><span class="k">${esc(c.kicker)}</span><h1>${esc(c.title)}</h1></div>
${c.photo ? `<div class="ph"><img src="${A('assets/img/loja-pereira-fachada-1280.jpg')}"></div>` : `<div class="ico">${icon(c.ico, { size: 330, sw: 1.3 })}</div>`}
<div class="hz"></div><div class="bar"><span>${esc(site.address.street)} · ${esc(site.address.neighborhood)} · ${esc(site.address.city)}-${site.address.state}</span><span style="margin-left:auto">WhatsApp ${esc(site.phoneDisplay)}</span></div>
</body></html>`

mkdirSync(join(ROOT, 'assets/img/og'), { recursive: true })
const TMP = mkdtempSync(join(tmpdir(), 'og-'))
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1200, height: 630 } })
for (const c of cards) {
  const tmp = join(TMP, 'og.html')
  writeFileSync(tmp, html(c))
  await p.goto(pathToFileURL(tmp).href, { waitUntil: 'load' })
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(120)
  await p.screenshot({ path: join(ROOT, 'assets/img', c.out), type: 'jpeg', quality: 82 })
}
await b.close()
rmSync(TMP, { recursive: true, force: true })
console.log(`✔ ${cards.length} imagens OG geradas em assets/img/`)
