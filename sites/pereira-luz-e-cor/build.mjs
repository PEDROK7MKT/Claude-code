// Gerador estático do site Pereira Luz & Cor — zero dependências.
// Uso: node build.mjs   → gera tudo em ./www (pronto para publicar)
import { readdirSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'

import { site, abs, stripTags, addressLine, hoursText, openingHoursShort, wa, normalize, slugify, directionsUrl } from './src/lib.mjs'
import { layout } from './src/layout.mjs'
import * as pages from './src/pages.mjs'

const ROOT = dirname(fileURLToPath(import.meta.url))
const OUT = join(ROOT, 'www')
const t0 = Date.now()

// ---------------------------------------------------------------- conteúdo
async function loadDir(dir) {
  const d = join(ROOT, 'src/content', dir)
  if (!existsSync(d)) return []
  const files = readdirSync(d).filter((f) => f.endsWith('.mjs')).sort()
  const mods = []
  for (const f of files) mods.push((await import(pathToFileURL(join(d, f)).href)).default)
  return mods
}

const words = (s) => stripTags(s).split(/\s+/).filter(Boolean).length

const categories = (await loadDir('categories')).sort((a, b) => a.order - b.order)
const catMap = Object.fromEntries(categories.map((c) => [c.slug, c]))

const GUIDE_ORDER = [
  'quantas-latas-de-tinta-preciso', 'qual-fio-usar-no-chuveiro-eletrico', 'como-escolher-lampada-led',
  'qual-disco-usar-na-esmerilhadeira', 'tinta-acrilica-ou-latex-pva', 'fita-de-led-como-escolher-e-instalar',
  'como-escolher-disjuntor', 'massa-corrida-ou-massa-acrilica', 'furadeira-parafusadeira-ou-martelete',
  'qual-tamanho-de-caixa-d-agua', 'como-pintar-parede-passo-a-passo', 'wd-40-para-que-serve',
]
const guides = (await loadDir('guides'))
  .map((g) => {
    const c = catMap[g.category]
    const summaryText = stripTags(g.summary)
    return {
      ...g,
      datePublished: g.datePublished || site.contentDate,
      dateModified: g.dateModified || site.contentDate,
      categoryIcon: c?.icon || 'book',
      categoryShort: c?.shortName || 'Guia',
      summaryShort: summaryText.length > 150 ? summaryText.slice(0, summaryText.lastIndexOf(' ', 147)) + '…' : summaryText,
      wordCount: words(g.summary) + g.sections.reduce((n, s) => n + words(s.html), 0),
    }
  })
  .sort((a, b) => {
    const ia = GUIDE_ORDER.indexOf(a.slug), ib = GUIDE_ORDER.indexOf(b.slug)
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
  })
const guideMap = Object.fromEntries(guides.map((g) => [g.slug, g]))

// ---------------------------------------------------------------- assets
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
cpSync(join(ROOT, 'assets'), join(OUT, 'assets'), {
  recursive: true,
  filter: (src) => !src.includes(`${'/assets/'}src`),
})

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 10)
const minCss = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,])\s*/g, '$1')
    .replace(/:\s+/g, ':')
    .replace(/;}/g, '}')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .trim()
const cssSrc = readFileSync(join(ROOT, 'assets/css/site.css'), 'utf8')
const css = minCss(cssSrc)
writeFileSync(join(OUT, 'assets/css/site.css'), css)
const jsSrc = readFileSync(join(ROOT, 'assets/js/site.js'), 'utf8')
const assets = {
  css: `/assets/css/site.css?v=${hash(css)}`,
  js: `/assets/js/site.js?v=${hash(jsSrc)}`,
}

const ctx = { categories, catMap, guides, guideMap, assets }

// ---------------------------------------------------------------- páginas
const built = []
function emit(page, { priority = 0.6, changefreq = 'monthly' } = {}) {
  const html = layout({ ...page, ctx })
  const file = page.path.endsWith('.html') ? join(OUT, page.path) : join(OUT, page.path, 'index.html')
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, html)
  if (!page.noindex) built.push({ path: page.path, priority, changefreq, lastmod: page.lastmod || site.contentDate, title: page.title, description: page.description })
}

emit(pages.home(ctx), { priority: 1.0, changefreq: 'weekly' })
for (const c of categories) emit(pages.category(c, ctx), { priority: 0.9 })
emit(pages.calculator(ctx), { priority: 0.8 })
emit(pages.guidesIndex(ctx), { priority: 0.7, changefreq: 'weekly' })
for (const g of guides) emit({ ...pages.guide(g, ctx), lastmod: g.dateModified }, { priority: 0.7 })
emit(pages.faqHub(ctx), { priority: 0.7 })
emit(pages.contact(ctx), { priority: 0.8 })
emit(pages.about(ctx), { priority: 0.6 })
emit(pages.notFound(ctx))

// ---------------------------------------------------------------- sitemap
writeFileSync(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${built
  .map(
    (b) => `  <url>
    <loc>${abs(b.path)}</loc>
    <lastmod>${b.lastmod}</lastmod>
    <changefreq>${b.changefreq}</changefreq>
    <priority>${b.priority.toFixed(1)}</priority>${
      b.path === '/' || b.path === '/sobre/'
        ? `
    <image:image><image:loc>${abs('/assets/img/loja-pereira-fachada-1280.jpg')}</image:loc></image:image>`
        : ''
    }
  </url>`,
  )
  .join('\n')}
</urlset>
`,
)

// ---------------------------------------------------------------- robots
// Buscadores e assistentes de IA liberados de propósito (GEO): queremos ser
// encontrados e citados. Só bloqueamos o que não é página.
const AI_BOTS = [
  'Googlebot', 'Bingbot', 'Google-Extended', 'GoogleOther', 'Applebot', 'Applebot-Extended',
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot',
  'PerplexityBot', 'Perplexity-User', 'meta-externalagent', 'meta-webindexer', 'meta-externalfetcher', 'facebookexternalhit',
  'Amazonbot', 'Amzn-SearchBot', 'DuckAssistBot', 'MistralAI-User', 'MistralAI-Index', 'cohere-ai', 'CCBot', 'YouBot', 'Bravebot',
]
writeFileSync(
  join(OUT, 'robots.txt'),
  `# ${site.name} — ${abs('/')}
# Buscadores e assistentes de IA são bem-vindos: queremos ser encontrados e citados.

User-agent: *
Allow: /
Disallow: /404.html

${AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /`).join('\n\n')}

Sitemap: ${abs('/sitemap.xml')}
`,
)

// ---------------------------------------------------------------- llms.txt
const catLines = categories.map((c) => `- [${c.name}](${abs(`/${c.slug}/`)}): ${stripTags(c.cardBlurb)} Inclui: ${c.groups.map((g) => g.name.toLowerCase()).join(', ')}.`).join('\n')
const guideLines = guides.map((g) => `- [${g.title}](${abs(`/guias/${g.slug}/`)}): ${stripTags(g.summary)}`).join('\n')
const facts = [
  `Nome: ${site.name} (também conhecida como ${site.alternateNames.join(', ')})`,
  `Tipo: loja de materiais elétricos, tintas, ferramentas, hidráulica e ferragens (ferragista)`,
  `Endereço: ${addressLine()}, Brasil`,
  `WhatsApp e telefone: ${site.phoneDisplay} — ${wa()}`,
  `Horário: ${hoursText()}`,
  `Pagamento: ${site.payment.join(', ')}`,
  `Como comprar: no balcão da loja ou montando uma lista no site e enviando pelo WhatsApp para receber orçamento`,
  `Região atendida: ${site.areaServed.join(', ')} (Bahia)`,
  `Rota no mapa: ${directionsUrl()}`,
]
writeFileSync(
  join(OUT, 'llms.txt'),
  `# ${site.name}

> ${site.name} é uma loja nova de materiais elétricos, tintas, ferramentas, hidráulica e ferragens na ${site.address.street}, bairro ${site.address.neighborhood}, em ${site.address.city}-${site.address.state} (Oeste Baiano). Atende no balcão e faz orçamento pelo WhatsApp ${site.phoneDisplay}.

## Dados da loja

${facts.map((f) => `- ${f}`).join('\n')}

## Produtos

${catLines}

## Guias

${guideLines}

## Páginas

- [Início](${abs('/')})
- [Calculadora de tinta](${abs('/calculadora-de-tinta/')}): calcula litros e latas a partir das medidas do cômodo.
- [Perguntas frequentes](${abs('/perguntas-frequentes/')})
- [Contato e como chegar](${abs('/contato/')})
- [Sobre a loja](${abs('/sobre/')})

## Opcional

- [Conteúdo completo em texto](${abs('/llms-full.txt')})
`,
)

// llms-full.txt: o conteúdo inteiro em texto corrido, para IA ler de uma vez.
const faqTxt = (faq) => faq.map((f) => `### ${f.q}\n\n${stripTags(f.a)}`).join('\n\n')
const full = [
  `# ${site.name} — conteúdo completo\n\nFonte: ${abs('/')} · Atualizado em ${site.contentDate}\n\n## Dados da loja\n\n${facts.map((f) => `- ${f}`).join('\n')}`,
  `## Perguntas frequentes sobre a loja\n\n${faqTxt(pages.storeFaq(categories))}`,
  ...categories.map(
    (c) =>
      `## ${c.name} — ${abs(`/${c.slug}/`)}\n\n${stripTags(c.intro)}\n\n${c.groups.map((g) => `### ${g.name}\n\n${stripTags(g.description)}\n\nItens: ${g.items.join('; ')}.`).join('\n\n')}\n\n${(c.tips || []).map((t) => `### Dica: ${t.title}\n\n${stripTags(t.body)}`).join('\n\n')}\n\n${faqTxt(c.faq)}`,
  ),
  ...guides.map(
    (g) =>
      `## ${g.title} — ${abs(`/guias/${g.slug}/`)}\n\nResposta rápida: ${stripTags(g.summary)}\n\n${g.keyTakeaways.map((k) => `- ${stripTags(k)}`).join('\n')}\n\n${g.sections.map((s) => `### ${s.h2}\n\n${stripTags(s.html)}`).join('\n\n')}${g.howTo ? `\n\n### ${g.howTo.name}\n\n${g.howTo.steps.map((s, i) => `${i + 1}. ${s.name}: ${stripTags(s.text)}`).join('\n')}` : ''}\n\n${faqTxt(g.faq)}`,
  ),
].join('\n\n---\n\n')
writeFileSync(join(OUT, 'llms-full.txt'), full + '\n')

// ---------------------------------------------------------------- busca
const index = []
for (const c of categories)
  for (const g of c.groups)
    for (const it of g.items) index.push({ n: it, g: g.name, c: c.name, u: `/${c.slug}/#${slugify(g.name)}`, k: normalize(`${it} ${g.name} ${c.name}`) })
for (const g of guides) index.push({ n: g.title, g: 'Guia', c: g.categoryShort, u: `/guias/${g.slug}/`, k: normalize(`${g.title} ${g.kicker}`), t: 'guia' })
index.push({ n: 'Calculadora de tinta', g: 'Ferramenta', c: 'Tintas', u: '/calculadora-de-tinta/', k: normalize('calculadora de tinta quantas latas litros'), t: 'guia' })
writeFileSync(join(OUT, 'assets/search-index.json'), JSON.stringify(index))

// ---------------------------------------------------------------- PWA / hosts
writeFileSync(
  join(OUT, 'site.webmanifest'),
  JSON.stringify(
    {
      name: site.name,
      short_name: 'Pereira',
      description: `${site.tagline} em ${site.address.city}-${site.address.state}`,
      lang: 'pt-BR',
      start_url: '/',
      display: 'standalone',
      background_color: '#0b0b0b',
      theme_color: '#0b0b0b',
      icons: [
        { src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/assets/img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    null,
    2,
  ),
)
cpSync(join(ROOT, 'assets/img/favicon.ico'), join(OUT, 'favicon.ico'))

// Vercel: URLs limpas com barra final + cache longo para assets versionados.
writeFileSync(
  join(OUT, 'vercel.json'),
  JSON.stringify(
    {
      cleanUrls: true,
      trailingSlash: true,
      headers: [
        { source: '/assets/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
        { source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }] },
      ],
    },
    null,
    2,
  ),
)
// Netlify / Cloudflare Pages
writeFileSync(join(OUT, '_headers'), `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`)

// ---------------------------------------------------------------- relatório
const size = (p) => statSync(p).size
console.log(`✔ ${built.length} páginas indexáveis + 404 em ${Date.now() - t0} ms → www/`)
console.log(`  categorias: ${categories.length} · guias: ${guides.length} · itens na busca: ${index.length}`)
console.log(`  css ${(size(join(OUT, 'assets/css/site.css')) / 1024).toFixed(1)} KB · js ${(jsSrc.length / 1024).toFixed(1)} KB`)
