// Auditoria técnica de SEO do site gerado (www/). Sem dependências.
// Uso: node tools/audit-seo.mjs     (rode depois do build)
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import site from '../site.config.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WWW = join(ROOT, 'www')
const errs = [], warns = []
const E = (p, m) => errs.push(`${p}: ${m}`)
const W = (p, m) => warns.push(`${p}: ${m}`)

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
const htmlFiles = walk(WWW).filter((f) => f.endsWith('.html'))
const pathOf = (f) => '/' + f.slice(WWW.length + 1).replace(/index\.html$/, '')
const pages = new Map(htmlFiles.map((f) => [pathOf(f), readFileSync(f, 'utf8')]))
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const attr = (tag, name) => { const m = tag.match(new RegExp(`${name}="([^"]*)"`)); return m ? decode(m[1]) : null }

const titles = new Map(), descs = new Map()
const idsByPage = new Map()
for (const [p, html] of pages) idsByPage.set(p, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])))

for (const [p, html] of pages) {
  const is404 = p === '/404.html'
  const title = decode((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '')
  const desc = attr((html.match(/<meta name="description"[^>]*>/) || [''])[0], 'content') || ''
  if (!title) E(p, 'sem <title>')
  if (title.length > 65) W(p, `title com ${title.length} caracteres: "${title}"`)
  if (!is404) {
    if (desc.length < 110 || desc.length > 165) W(p, `description com ${desc.length} caracteres`)
    if (titles.has(title)) E(p, `title duplicado com ${titles.get(title)}`)
    if (descs.has(desc)) E(p, `description duplicada com ${descs.get(desc)}`)
    titles.set(title, p); descs.set(desc, p)
    const canon = attr((html.match(/<link rel="canonical"[^>]*>/) || [''])[0], 'href')
    if (canon !== site.url + p) E(p, `canonical incorreto: ${canon}`)
  }
  const h1 = (html.match(/<h1[\s>]/g) || []).length
  if (h1 !== 1) E(p, `${h1} <h1> na página`)
  // hierarquia de headings no <main>
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'))
  let prev = 1
  for (const m of main.matchAll(/<h([1-6])[\s>]/g)) {
    const l = +m[1]
    if (l > prev + 1) { W(p, `heading pula de h${prev} para h${l}`); break }
    prev = l
  }
  // og:image existe
  const og = attr((html.match(/<meta property="og:image" [^>]*>/) || [''])[0], 'content')
  if (og && !existsSync(join(WWW, og.replace(site.url, '')))) E(p, `og:image não existe: ${og}`)
  // imagens
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const t = m[0]
    if (attr(t, 'alt') === null) E(p, `<img> sem alt: ${t.slice(0, 80)}`)
    if (!attr(t, 'width') || !attr(t, 'height')) W(p, `<img> sem width/height: ${attr(t, 'src')}`)
    const src = attr(t, 'src')
    if (src && src.startsWith('/') && !existsSync(join(WWW, src.split('?')[0]))) E(p, `imagem inexistente ${src}`)
  }
  // links internos e âncoras
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const href = decode(m[1])
    if (/^(https?:|tel:|mailto:)/.test(href)) continue
    const [path, hash] = href.split('#')
    const target = path === '' ? p : path
    if (!target.startsWith('/')) { W(p, `link relativo ${href}`); continue }
    const ok = pages.has(target) || existsSync(join(WWW, target))
    if (!ok) { E(p, `link quebrado ${href}`); continue }
    if (!target.endsWith('/') && !/\.\w+$/.test(target)) W(p, `link sem barra final ${href}`)
    if (hash && pages.has(target) && !idsByPage.get(target).has(hash)) E(p, `âncora inexistente ${href}`)
  }
  // JSON-LD
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  if (!is404 && !blocks.length) E(p, 'sem JSON-LD')
  for (const b of blocks) {
    let data
    try { data = JSON.parse(b[1]) } catch (e) { E(p, `JSON-LD inválido: ${e.message}`); continue }
    const nodes = data['@graph'] || [data]
    const ids = new Set(nodes.map((n) => n['@id']).filter(Boolean))
    const refs = JSON.stringify(data).match(/"@id":"[^"]+"/g) || []
    for (const r of refs) {
      const id = r.slice(7, -1)
      if (!ids.has(id) && !id.endsWith('#logo') && !id.endsWith('#loja') && !id.endsWith('#website')) W(p, `@id referenciado mas não definido nesta página: ${id}`)
    }
    for (const n of nodes) {
      const t = [].concat(n['@type'])
      if (t.includes('FAQPage') && !n.mainEntity?.length) E(p, 'FAQPage vazio')
      if (t.includes('BreadcrumbList')) for (const it of n.itemListElement) if (!pages.has(it.item.replace(site.url, '').split('#')[0]) && !it.item.includes('#')) E(p, `breadcrumb aponta para página inexistente ${it.item}`)
      if (t.includes('Article') && (!n.headline || !n.datePublished || !n.author)) E(p, 'Article incompleto')
    }
  }
  // texto visível mínimo
  const text = main.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const wc = text.split(' ').length
  if (!is404 && wc < 250) W(p, `pouco texto (${wc} palavras)`)
  // NAP consistente
  if (!html.includes(site.address.street) || !html.includes(site.phoneDisplay)) E(p, 'NAP (endereço/telefone) ausente no HTML')
}

// sitemap ↔ páginas
const sm = readFileSync(join(WWW, 'sitemap.xml'), 'utf8')
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(site.url, ''))
for (const l of locs) if (!pages.has(l)) E('sitemap', `URL sem página: ${l}`)
for (const p of pages.keys()) if (p !== '/404.html' && !locs.includes(p)) E('sitemap', `página fora do sitemap: ${p}`)
// llms.txt links
const llms = readFileSync(join(WWW, 'llms.txt'), 'utf8')
for (const m of llms.matchAll(/\]\(([^)]+)\)/g)) { const u = m[1].replace(site.url, ''); if (!pages.has(u) && !existsSync(join(WWW, u))) E('llms.txt', `link quebrado ${m[1]}`) }

console.log(`Páginas: ${pages.size} · sitemap: ${locs.length} URLs`)
for (const e of errs) console.log('✗ ' + e)
for (const w of warns) console.log('! ' + w)
console.log(errs.length ? `\n${errs.length} erro(s), ${warns.length} aviso(s)` : `\nSem erros. ${warns.length} aviso(s).`)
process.exit(errs.length ? 1 : 0)
