// Empacota o site gerado (./site) num único HTML navegável, para aprovação
// antes de publicar. Não sobe nada para a internet.
// Uso: node build.mjs && node preview.mjs  →  preview/previa-agencia-viva.html
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const siteDir = join(root, 'site')
const outFile = join(root, 'preview', 'previa-agencia-viva.html')

const read = p => readFileSync(join(siteDir, p), 'utf8')
const b64 = p => readFileSync(join(siteDir, p)).toString('base64')
// fontes viram data URI dentro do CSS; scripts entram inline
const css = read('assets/viva.css').replace(/url\(\/assets\/fonts\/([\w-]+\.woff2)\)/g, (_, f) => `url(data:font/woff2;base64,${b64('assets/fonts/' + f)})`)
const files = {}
const logo = 'data:image/png;base64,' + b64('assets/logo-viva.png')
const favicon = 'data:image/svg+xml;base64,' + b64('favicon.svg')

// dentro de cada página: links internos viram navegação da prévia
const router = `<script>
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a'); if (!a) return
  var h = a.getAttribute('href') || ''
  if (e.defaultPrevented) return
  if (h.charAt(0) === '#') { e.preventDefault(); var t = document.getElementById(h.slice(1)); if (t) t.scrollIntoView({ behavior: 'smooth' }); return }
  if (h.charAt(0) === '/') { e.preventDefault(); parent.postMessage({ vivaGo: h }, '*') }
})
</script>`
const ribbon = `<div style="position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99;background:#ffc83d;color:#1a0710;font:700 12px/1 Inter,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:9px 14px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.4);pointer-events:none;white-space:nowrap">Prévia · contatos provisórios</div>`

const pages = {}
const walk = d => {
  for (const f of readdirSync(d)) {
    const p = join(d, f)
    if (statSync(p).isDirectory()) { if (f !== 'crm') walk(p) }
    else if (f.endsWith('.html')) {
      const rel = '/' + relative(siteDir, p).split(sep).join('/')
      const path = rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel
      pages[path] = readFileSync(p, 'utf8')
        .replace('<link rel="stylesheet" href="/assets/viva.css">', '<style>%%CSS%%</style>')
        .replace(/<script src="\/assets\/([\w./-]+\.js)" defer><\/script>/g, (_, f) => { files[f] = files[f] || read('assets/' + f); return `<script>%%F:${f}%%</script>` })
        .replace('</body>', router + '</body>')
        .replace(/<link rel="preload"[^>]*>\n?/, '')
        .replace(/src="\/assets\/logo-viva\.png"/g, 'src="%%LOGO%%"')
        .replace('href="/favicon.svg"', `href="${favicon}"`)
        .replace(/<link rel="manifest"[^>]*>\n?/, '')
        .replace(/<link rel="apple-touch-icon"[^>]*>\n?/, '')
        .replace('<body>', '<body>' + ribbon)
    }
  }
}
walk(siteDir)

// Enxuga a prévia (painéis de visualização costumam travar acima de ~1 MB):
// 1) tira o JSON-LD (só serve pro Google); 2) guarda cada SVG/caminho repetido uma vez só.
// rodapé é igual em todas as páginas: guarda uma vez
let footer = ''
for (const k in pages) {
  const m = pages[k].match(/<footer class="ftr">[\s\S]*?<\/footer>/)
  if (!m) continue
  if (!footer) footer = m[0]
  if (m[0] === footer) pages[k] = pages[k].replace(m[0], '%%FOOTER%%')
}
// blocos de cartões de serviço repetidos entre páginas: guarda uma vez
const blocks = [], bcount = {}
for (const k in pages) for (const m of pages[k].match(/<div class="minis">[\s\S]*?<\/a>\s*<\/div>/g) || []) bcount[m] = (bcount[m] || 0) + 1
for (const k in pages) pages[k] = pages[k].replace(/<div class="minis">[\s\S]*?<\/a>\s*<\/div>/g, m => { if (bcount[m] < 2) return m; let i = blocks.indexOf(m); if (i < 0) { blocks.push(m); i = blocks.length - 1 } return `%%B${i}%%` })
const svgs = [], paths = []
const idx = (arr, v) => { let i = arr.indexOf(v); if (i < 0) { arr.push(v); i = arr.length - 1 } return i }
const counts = {}
for (const k in pages) {
  pages[k] = pages[k].replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/g, '')
  for (const m of pages[k].match(/<svg[\s\S]*?<\/svg>/g) || []) if (m.length > 300) counts[m] = (counts[m] || 0) + 1
}
for (const k in pages) {
  pages[k] = pages[k]
    .replace(/<svg[\s\S]*?<\/svg>/g, m => (counts[m] > 1 ? `%%S${idx(svgs, m)}%%` : m))
    .replace(/ d="([^"]{160,})"/g, (_, d) => ` d="%%P${idx(paths, d)}%%"`)
}
for (let i = 0; i < svgs.length; i++) svgs[i] = svgs[i].replace(/ d="([^"]{160,})"/g, (_, d) => ` d="%%P${idx(paths, d)}%%"`)

const label = p => {
  if (p === '/') return 'Início'
  if (p === '/404.html') return 'Página 404'
  const html = pages[p]
  return html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}
const groups = [
  ['Principais', Object.keys(pages).filter(p => ['/', '/servicos/', '/sobre/', '/contato/', '/privacidade/'].includes(p))],
  ['Oeste e LEM', Object.keys(pages).filter(p => /oeste-da-bahia|-em-luis-eduardo-magalhaes\/$/.test(p) && !p.startsWith('/agencia-de-marketing-em-')).sort()],
  ['Serviços', Object.keys(pages).filter(p => p.startsWith('/servicos/') && p !== '/servicos/').sort()],
  ['Cidades', Object.keys(pages).filter(p => p.startsWith('/agencia-de-marketing-em-')).sort((a, b) => (a.includes('barreiras') ? -1 : b.includes('barreiras') ? 1 : a.localeCompare(b)))],
  ['Outras', ['/404.html']],
]
const options = groups.map(([g, ps]) => `<optgroup label="${g}">${ps.map(p => `<option value="${p}">${label(p).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</option>`).join('')}</optgroup>`).join('')

// JSON dentro de <script>: escapar "</" para não fechar a tag
const data = JSON.stringify({ pages, css, files, logo, svgs, paths, footer, blocks }).replace(/<\//g, '<\\/')

const shell = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Prévia — Agência Viva</title>
<link rel="icon" href="${favicon}">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; background: #07050a; color: #f6f1f7; font: 500 14px/1.4 Inter, system-ui, -apple-system, 'Segoe UI', sans-serif; }
  .bar { position: sticky; top: 0; z-index: 2; display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 10px 14px; background: #120e18; border-bottom: 1px solid rgba(255,255,255,.1); }
  .bar b { font-weight: 700; letter-spacing: .02em; }
  .bar b span { color: #ffc83d; }
  select { flex: 1 1 220px; min-width: 0; max-width: 460px; padding: 9px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,.18); background: #1c1624; color: inherit; font: inherit; }
  .seg { display: inline-flex; border: 1px solid rgba(255,255,255,.18); border-radius: 999px; overflow: hidden; }
  .seg button { border: 0; background: transparent; color: #b3a9bb; padding: 8px 14px; font: inherit; cursor: pointer; }
  .seg button[aria-pressed="true"] { background: #ff3e6c; color: #fff; }
  .nav button { border: 1px solid rgba(255,255,255,.18); background: transparent; color: inherit; border-radius: 999px; width: 34px; height: 34px; cursor: pointer; font: inherit; }
  .stage { height: calc(100% - 56px); display: flex; justify-content: center; align-items: flex-start; }
  iframe { display: block; border: 0; width: 100%; height: 100%; background: #0d0a12; }
  .mobile .stage { padding: 18px 0; overflow: auto; }
  .mobile iframe { width: 390px; height: 800px; max-height: calc(100vh - 100px); border-radius: 28px; box-shadow: 0 0 0 10px #1c1624, 0 30px 80px rgba(0,0,0,.6); }
  @media (max-width: 520px) { .seg, .hint { display: none; } }
  .hint { color: #b3a9bb; font-size: 13px; }
</style>
</head>
<body>
<div class="bar">
  <b>Agência Viva <span>· prévia</span></b>
  <span class="nav"><button id="back" title="Voltar" aria-label="Voltar">←</button></span>
  <select id="page" aria-label="Escolher página">${options}</select>
  <span class="seg" role="group" aria-label="Tamanho da tela">
    <button id="desk" aria-pressed="true">Computador</button><button id="mob" aria-pressed="false">Celular</button>
  </span>
  <span class="hint">Os links do site também navegam aqui dentro.</span>
</div>
<div class="stage"><iframe id="f" title="Prévia do site"></iframe></div>
<script>
var D = ${data}
var f = document.getElementById('f'), sel = document.getElementById('page'), hist = []
function fill(html) { html = html.split('%%FOOTER%%').join(D.footer).replace(/%%B(\\d+)%%/g, function (_, i) { return D.blocks[i] }).replace(/%%S(\\d+)%%/g, function (_, i) { return D.svgs[i] }).replace(/%%P(\\d+)%%/g, function (_, i) { return D.paths[i] }); html = html.split('%%CSS%%').join(D.css).split('%%LOGO%%').join(D.logo); return html.replace(/%%F:([\\w.\\/-]+)%%/g, function (_, f) { return D.files[f] || '' }) }
function go(target, push) {
  var parts = target.split('#'), p = parts[0] || '/', hash = parts[1]
  if (!D.pages[p]) p = '/404.html'
  if (push !== false && sel.value && sel.value !== p) hist.push(sel.value)
  sel.value = p
  f.onload = function () {
    if (!hash) return
    var t = f.contentDocument && f.contentDocument.getElementById(hash)
    if (t) setTimeout(function () { t.scrollIntoView() }, 60)
  }
  f.srcdoc = fill(D.pages[p])
  try { history.replaceState(null, '', '#!' + target) } catch (e) {}
}
addEventListener('message', function (e) { if (e.data && e.data.vivaGo) go(e.data.vivaGo) })
sel.addEventListener('change', function () { go(sel.value) })
document.getElementById('back').addEventListener('click', function () { if (hist.length) go(hist.pop(), false) })
function mode(m) {
  document.body.classList.toggle('mobile', m)
  document.getElementById('mob').setAttribute('aria-pressed', m)
  document.getElementById('desk').setAttribute('aria-pressed', !m)
}
document.getElementById('desk').addEventListener('click', function () { mode(false) })
document.getElementById('mob').addEventListener('click', function () { mode(true) })
var start = location.hash.indexOf('#!') === 0 ? location.hash.slice(2) : '/'
sel.value = ''
go(start, false)
</script>
</body>
</html>
`

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, shell)
console.log(`✓ prévia com ${Object.keys(pages).length} páginas: ${outFile} (${Math.round(shell.length / 1024)} KB)`)
