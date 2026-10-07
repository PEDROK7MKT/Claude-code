// Valida módulos de conteúdo contra o SPEC.
// Uso: node tools/check-content.mjs [arquivo.mjs ...]   (sem args = todos)
import { readdirSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CATS = ['materiais-eletricos', 'iluminacao-e-led', 'tintas-e-pintura', 'ferramentas', 'hidraulica', 'equipamentos-para-obra', 'fixacao-e-lubrificantes', 'utilidades-e-epi']
const GUIDES = ['quantas-latas-de-tinta-preciso', 'tinta-acrilica-ou-latex-pva', 'massa-corrida-ou-massa-acrilica', 'como-pintar-parede-passo-a-passo', 'qual-fio-usar-no-chuveiro-eletrico', 'como-escolher-disjuntor', 'como-escolher-lampada-led', 'fita-de-led-como-escolher-e-instalar', 'furadeira-parafusadeira-ou-martelete', 'qual-disco-usar-na-esmerilhadeira', 'qual-tamanho-de-caixa-d-agua', 'wd-40-para-que-serve']
const ICONS = ['bolt', 'bulb', 'roller', 'drill', 'drop', 'ladder', 'nut', 'helmet']
const ALLOWED_TAGS = new Set(['p', 'ul', 'ol', 'li', 'strong', 'em', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a', 'br'])
const BANNED = [/solu[cç][õo]es completas/i, /excel[êe]ncia/i, /qualidade incompar/i, /\bR\$\s?\d/, /\+\s?\d[\d.]*\s*(itens|produtos|clientes|anos)/i, /entregamos/i, /frete gr[aá]tis/i]

const words = (s) => String(s).replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length

function checkHtml(where, html, errs) {
  for (const m of String(html).matchAll(/<\/?([a-z0-9]+)([^>]*)>/gi)) {
    const tag = m[1].toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) errs.push(`${where}: tag não permitida <${tag}>`)
    if (/\b(class|style|on\w+)=/i.test(m[2])) errs.push(`${where}: atributo não permitido em <${tag}>`)
    if (tag === 'a' && m[0].startsWith('<a')) {
      const href = (m[2].match(/href="([^"]+)"/) || [])[1]
      if (!href) errs.push(`${where}: <a> sem href`)
      else if (href.startsWith('/')) {
        const slug = href.replace(/^\/|\/$/g, '')
        const ok = slug === '' || CATS.includes(slug) || ['contato', 'sobre', 'perguntas-frequentes', 'guias', 'calculadora-de-tinta'].includes(slug) || (slug.startsWith('guias/') && GUIDES.includes(slug.slice(6)))
        if (!ok) errs.push(`${where}: link interno inexistente ${href}`)
        if (!href.endsWith('/') && !href.includes('#')) errs.push(`${where}: link interno sem barra final ${href}`)
      }
    }
  }
}

function checkBanned(where, text, errs) {
  for (const re of BANNED) if (re.test(text)) errs.push(`${where}: termo/claim proibido (${re})`)
}

function checkSeo(seo, errs, warns) {
  if (!seo?.title) errs.push('seo.title ausente')
  else if (seo.title.length > 62) errs.push(`seo.title com ${seo.title.length} chars (máx 60)`)
  if (!seo?.description) errs.push('seo.description ausente')
  else if (seo.description.length < 120 || seo.description.length > 160) warns.push(`seo.description com ${seo.description.length} chars (ideal 140–158)`)
}

function checkFaq(faq, errs, warns, min) {
  if (!Array.isArray(faq) || faq.length < min) errs.push(`faq precisa de ≥ ${min} perguntas`)
  for (const [i, f] of (faq || []).entries()) {
    if (!f.q?.trim().endsWith('?')) warns.push(`faq[${i}].q deveria terminar com "?"`)
    const w = words(f.a)
    if (w < 25 || w > 130) warns.push(`faq[${i}].a com ${w} palavras (ideal 40–90)`)
    checkHtml(`faq[${i}].a`, f.a, errs)
  }
}

export async function check(file) {
  const errs = [], warns = []
  let m
  try {
    m = (await import(pathToFileURL(resolve(file)).href + `?t=${Date.now()}`)).default
  } catch (e) {
    return { file, errs: [`não carrega: ${e.message}`], warns }
  }
  if (!m || typeof m !== 'object') return { file, errs: ['export default ausente'], warns }
  const all = JSON.stringify(m)
  checkBanned('conteúdo', all, errs)
  if (file.includes('/categories/')) {
    if (!CATS.includes(m.slug)) errs.push(`slug inválido ${m.slug}`)
    if (!ICONS.includes(m.icon)) errs.push(`icon inválido ${m.icon}`)
    for (const k of ['name', 'shortName', 'h1', 'kicker', 'intro', 'cardBlurb']) if (!m[k]) errs.push(`${k} ausente`)
    if (m.kicker?.length > 80) warns.push(`kicker com ${m.kicker.length} chars`)
    if (m.cardBlurb?.length > 100) warns.push(`cardBlurb com ${m.cardBlurb.length} chars`)
    const wi = words(m.intro || '')
    if (wi < 40 || wi > 100) warns.push(`intro com ${wi} palavras (ideal 50–80)`)
    checkSeo(m.seo, errs, warns)
    if (!Array.isArray(m.highlights) || m.highlights.length !== 3) errs.push('highlights precisa ter 3 itens')
    if (!Array.isArray(m.groups) || m.groups.length < 4) errs.push('groups precisa ter ≥ 4')
    for (const [i, g] of (m.groups || []).entries()) {
      if (!g.name || !g.description) errs.push(`groups[${i}] sem name/description`)
      if (!Array.isArray(g.items) || g.items.length < 4) errs.push(`groups[${i}] precisa de ≥ 4 items`)
    }
    if (!Array.isArray(m.tips) || m.tips.length < 2) errs.push('tips precisa de ≥ 2')
    checkFaq(m.faq, errs, warns, 5)
    for (const s of m.relatedGuides || []) if (!GUIDES.includes(s)) errs.push(`relatedGuides inválido ${s}`)
    for (const s of m.relatedCategories || []) if (!CATS.includes(s)) errs.push(`relatedCategories inválido ${s}`)
  } else if (file.includes('/guides/')) {
    if (!GUIDES.includes(m.slug)) errs.push(`slug inválido ${m.slug}`)
    if (!CATS.includes(m.category)) errs.push(`category inválida ${m.category}`)
    for (const k of ['title', 'kicker', 'summary']) if (!m[k]) errs.push(`${k} ausente`)
    checkSeo(m.seo, errs, warns)
    const ws = words(m.summary || '')
    if (ws < 30 || ws > 85) warns.push(`summary com ${ws} palavras (ideal 40–70)`)
    if (!Array.isArray(m.keyTakeaways) || m.keyTakeaways.length < 3) errs.push('keyTakeaways precisa de ≥ 3')
    if (!Array.isArray(m.sections) || m.sections.length < 4) errs.push('sections precisa de ≥ 4')
    let total = 0
    for (const [i, s] of (m.sections || []).entries()) {
      if (!s.h2 || !s.html) errs.push(`sections[${i}] sem h2/html`)
      checkHtml(`sections[${i}]`, s.html, errs)
      total += words(s.html)
    }
    if (total < 600 || total > 1600) warns.push(`corpo com ${total} palavras (ideal 700–1300)`)
    checkFaq(m.faq, errs, warns, 4)
    if (m.howTo) {
      if (!m.howTo.name || !Array.isArray(m.howTo.steps) || m.howTo.steps.length < 3) errs.push('howTo inválido')
    }
    if (!m.cta?.title || !m.cta?.text || !Array.isArray(m.cta?.items) || m.cta.items.length < 2) errs.push('cta inválido')
    for (const s of m.relatedGuides || []) if (!GUIDES.includes(s)) errs.push(`relatedGuides inválido ${s}`)
    if (m.widget && m.widget !== 'paint-calculator') errs.push('widget inválido')
  }
  return { file, errs, warns }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  let files = process.argv.slice(2)
  if (!files.length) {
    for (const d of ['categories', 'guides']) {
      const dir = join(root, 'src/content', d)
      files.push(...readdirSync(dir).filter((f) => f.endsWith('.mjs')).map((f) => join(dir, f)))
    }
  }
  let bad = 0
  for (const f of files) {
    const r = await check(f)
    const tag = r.errs.length ? 'ERRO' : r.warns.length ? 'AVISO' : 'OK'
    if (r.errs.length) bad++
    console.log(`[${tag}] ${f.replace(root + '/', '')}`)
    for (const e of r.errs) console.log('   ✗ ' + e)
    for (const w of r.warns) console.log('   ! ' + w)
  }
  process.exit(bad ? 1 : 0)
}
