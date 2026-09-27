// Gera o site estático da Agência Viva em ./site
// Uso: node build.mjs   (sem dependências)
import { mkdirSync, writeFileSync, cpSync, rmSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { site, wa, services, cities, testimonials, homeFaq } from './src/data.mjs'
import BP from './src/brand-paths.mjs'
import { landings, cityCopy } from './src/pages.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const out = join(root, 'site')
const today = new Date().toISOString().slice(0, 10)

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const abs = p => site.url + p
const cityPath = c => `/agencia-de-marketing-em-${c.slug}/`
const svcPath = s => `/servicos/${s.slug}/`
const A = site.address
const addrLine = `${A.street} - ${A.district}, ${A.city} - ${A.state}, ${A.zip}`
// H1 com o final em itálico serifado: 'Agência de marketing em' + 'Barreiras'
const accentH1 = (h1, accent) => accent && h1.endsWith(accent) ? `${esc(h1.slice(0, -accent.length))}<span class="s">${esc(accent)}</span>` : esc(h1)
const landingPath = l => `/${l.slug}/`
// tempo de mercado calculado a partir da abertura do CNPJ: vira "10 anos" sozinho
// no primeiro build depois de 09/11/2026 (o site é estático, precisa republicar)
const foundedYear = site.founded.slice(0, 4)
const years = Math.floor((Date.now() - new Date(site.founded + 'T12:00:00-03:00')) / (365.2425 * 864e5))
const tenure = years >= 10 ? `${years} anos de mercado` : `No mercado desde ${foundedYear}`
const listPt = arr => arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} e ${arr[arr.length - 1]}`

// ─── Ícones e traços feitos à mão ───────────────────────────
const ic = {
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  window: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
}
const icon = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic[n]}</svg>`
const waIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>'
const hand = {
  circle: (delay = 0.3) => `<svg data-draw="${delay}" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true"><path d="M152 11C112 1 42 3 17 25-3 45 30 75 100 74c70-1 99-22 91-43-7-18-50-26-94-22"/></svg>`,
  under: (delay = 0.3) => `<svg data-draw="${delay}" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path d="M4 14C50 5 120 4 196 11"/></svg>`,
  arrow: () => '<svg viewBox="0 0 70 50" aria-hidden="true"><path d="M6 6c20-4 42 8 50 36"/><path d="M45 34l11 9 5-13"/></svg>',
}
const pinPath = 'M0 0C-11-17-16-25-16-33a16 16 0 1 1 32 0C16-25 11-17 0 0Z'

// ─── Logos das plataformas (cores originais) ────────────────
let gid = 0
const brandSvg = {
  instagram: () => { const id = `ig${++gid}`; return `<svg viewBox="0 0 24 24"><defs><radialGradient id="${id}" cx="28%" cy="108%" r="140%"><stop offset="0" stop-color="#fdf497"/><stop offset=".08" stop-color="#fdf497"/><stop offset=".45" stop-color="#fd5949"/><stop offset=".62" stop-color="#d6249f"/><stop offset=".92" stop-color="#285aeb"/></radialGradient></defs><rect width="24" height="24" rx="6" fill="url(#${id})"/><path transform="translate(4.6 4.6) scale(.617)" fill="#fff" d="${BP.instagram}"/></svg>` },
  facebook: () => `<svg viewBox="-1 -1 26 26"><path fill="#0866ff" d="${BP.facebook}"/></svg>`,
  tiktok: () => `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000"/><g transform="translate(5 4.6) scale(.6)"><path fill="#25f4ee" transform="translate(-1 -1)" d="${BP.tiktok}"/><path fill="#fe2c55" transform="translate(1 1)" d="${BP.tiktok}"/><path fill="#fff" d="${BP.tiktok}"/></g></svg>`,
  meta: () => { const id = `mt${++gid}`; return `<svg viewBox="-1.5 -1.5 27 27"><defs><linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#0064e1"/><stop offset=".6" stop-color="#0082fb"/><stop offset="1" stop-color="#0082fb"/></linearGradient></defs><path fill="url(#${id})" d="${BP.meta}"/></svg>` },
  googleads: () => '<svg viewBox="0 0 24 24"><path d="M4.4 18.6L11 6" stroke="#fbbc04" stroke-width="6.4" stroke-linecap="round"/><path d="M11 6l7.4 12.6" stroke="#4285f4" stroke-width="6.4" stroke-linecap="round"/><circle cx="4.4" cy="18.6" r="3.3" fill="#34a853"/></svg>',
  google: () => '<svg viewBox="0 0 24 24"><path fill="#4285f4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#34a853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#fbbc05" d="M6.4 14a6 6 0 0 1 0-4V7.4H3.1a10 10 0 0 0 0 9.2z"/><path fill="#ea4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6z"/></svg>',
  googlemaps: () => {
    const segs = BP.googlemaps.split(/(?=M)/)
    const col = ['#34a853', '#fbbc04', '#ea4335', '#4285f4', '#ea4335']
    return `<svg viewBox="-2 -1 28 26">${segs.map((d, i) => `<path fill="${col[i] || '#4285f4'}" d="${d}"/>`).join('')}</svg>`
  },
  whatsapp: () => `<svg viewBox="-1 -1 26 26"><path fill="#25d366" d="${BP.whatsapp}"/></svg>`,
  youtube: () => `<svg viewBox="-1 -1 26 26"><path fill="#ff0000" d="${BP.youtube}"/></svg>`,
}
const brandName = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', meta: 'Meta Ads', googleads: 'Google Ads', google: 'Google', googlemaps: 'Google Maps', whatsapp: 'WhatsApp', youtube: 'YouTube' }
const pad = new Set(['googleads', 'google', 'googlemaps', 'whatsapp', 'youtube', 'meta', 'facebook'])
const logoIc = n => `<span class="logo-ic${pad.has(n) ? ' logo-ic--pad' : ''}" title="${brandName[n]}">${brandSvg[n]()}</span>`
const logos = names => `<span class="logos" aria-label="${names.map(n => brandName[n]).join(', ')}" role="img">${names.map(logoIc).join('')}</span>`

// logos e arte de cada serviço, fiéis ao trabalho
const svcLogos = {
  'gestao-de-trafego-pago': ['meta', 'googleads', 'tiktok'],
  'social-media': ['instagram', 'facebook', 'tiktok'],
  'google-meu-negocio-seo-local': ['googlemaps', 'google'],
  'producao-de-conteudo-audiovisual': ['instagram', 'youtube', 'tiktok'],
}
const svcArt = {
  'gestao-de-trafego-pago': () => `<span class="art art--chart" aria-hidden="true"><b>Contatos ↑</b>${[22, 30, 26, 42, 38, 58, 66, 84].map(h => `<i style="--h:${h}%"></i>`).join('')}</span>`,
  'social-media': () => `<span class="art art--posts" aria-hidden="true">${['Reels ▶', 'Post', 'Story', 'Promo'].map(t => `<span>${t}</span>`).join('')}</span>`,
  'criacao-de-sites': () => '<span class="art art--browser" aria-hidden="true"><span class="bar"><i></i><i></i><i></i><span class="url"><span>suaempresa.com.br</span></span></span><span class="body"><span style="flex:1"><i style="width:90%"></i><i style="width:70%"></i><i style="width:80%"></i></span><span class="fb">WhatsApp</span></span></span>',
  'google-meu-negocio-seo-local': () => `<span class="art art--search" aria-hidden="true"><span class="q"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>dentista perto de mim</span><span class="res">${logoIc('googlemaps')}<span><b>Sua Clínica</b><span class="stars">★★★★★</span> · aberto agora</span></span></span>`,
  'identidade-visual': () => '<span class="art art--pen" aria-hidden="true"><svg viewBox="0 0 300 92"><path class="handle" d="M40 70L90 12M170 18L230 78"/><path class="curve" d="M40 70C90 12 150 10 170 18S220 88 260 60"/><rect class="anchor" x="34" y="64" width="12" height="12"/><rect class="anchor" x="164" y="12" width="12" height="12"/><circle class="anchor" cx="90" cy="12" r="5"/><circle class="anchor" cx="230" cy="78" r="5"/><rect class="sw" x="268" y="8" width="26" height="26" rx="6" fill="#0b0b0b"/><rect class="sw" x="268" y="40" width="26" height="26" rx="6" fill="#fff"/><path d="M252 70l14-14 6 6-14 14-8 2z" fill="#0b0b0b"/></svg></span>',
  'producao-de-conteudo-audiovisual': () => '<span class="art art--timeline" aria-hidden="true"><span class="cam"><svg viewBox="0 0 24 24"><rect x="2.5" y="6.5" width="13" height="11" rx="2.5"/><path d="M15.5 10.5l6-3.5v10l-6-3.5z"/></svg></span><span class="tracks"><span class="tr"><i style="flex:3"></i><i style="flex:2"></i><i style="flex:4"></i></span><span class="tr"><i style="flex:2"></i><i style="flex:5"></i><i style="flex:1"></i></span><span class="tr"><i style="flex:6"></i><i style="flex:3"></i></span><span class="head"></span></span></span>',
}
// rótulo manuscrito de cada cartão (categoria, não sequência)
const svcTag = {
  'gestao-de-trafego-pago': 'anúncios', 'social-media': 'conteúdo', 'criacao-de-sites': 'site',
  'google-meu-negocio-seo-local': 'Google', 'identidade-visual': 'marca', 'producao-de-conteudo-audiovisual': 'vídeo',
}
const svcStamp = {
  'criacao-de-sites': '<path d="M4 5h16v14H4z"/><path d="M4 9h16M8 13l-2 2 2 2M16 13l2 2-2 2M13 12l-2 6"/>',
  'identidade-visual': '<path d="M12 3l7 7-7 11-7-11z"/><circle cx="12" cy="11" r="2"/><path d="M12 3v6"/>',
}

// ─── Schema.org ──────────────────────────────────────────────
const bizId = site.url + '/#agencia'
const business = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': bizId,
  name: site.name,
  ...(site.legalName ? { legalName: site.legalName } : {}),
  alternateName: site.alternateName,
  description: 'Agência de marketing digital em Barreiras - BA: tráfego pago, social media, criação de sites, SEO local e Google Meu Negócio para empresas do Oeste da Bahia.',
  slogan: site.slogan,
  url: site.url + '/',
  logo: abs('/assets/logo-viva.png'),
  image: abs('/assets/og-viva.png'),
  telephone: '+' + site.whatsapp,
  email: site.email,
  foundingDate: site.founded,
  priceRange: '$$',
  address: { '@type': 'PostalAddress', streetAddress: A.street, addressLocality: A.city, addressRegion: A.state, postalCode: A.zip, addressCountry: A.country },
  geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
  hasMap: site.mapsUrl,
  openingHoursSpecification: site.hours.map(h => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days, opens: h.opens, closes: h.closes })),
  areaServed: [
    ...cities.map(c => ({ '@type': 'City', name: `${c.name}, Bahia` })),
    { '@type': 'AdministrativeArea', name: 'Oeste da Bahia' },
  ],
  knowsAbout: ['Marketing digital', 'Gestão de tráfego pago', 'Meta Ads', 'Google Ads', 'Social media', 'SEO local', 'Google Meu Negócio', 'Criação de sites', 'Identidade visual', 'Marketing para o agronegócio'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Serviços de marketing digital',
    itemListElement: services.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: abs(svcPath(s)) } })),
  },
  sameAs: site.sameAs,
  ...(site.cnpj ? { taxID: site.cnpj } : {}),
  ...(site.founder ? { founder: { '@type': 'Person', name: site.founder.name, url: abs(site.founder.url || '/sobre/'), sameAs: site.founder.sameAs || [] } } : {}),
}
const website = { '@context': 'https://schema.org', '@type': 'WebSite', '@id': site.url + '/#site', url: site.url + '/', name: site.name, inLanguage: 'pt-BR', publisher: { '@id': bizId } }
const crumbsLd = items => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
})
const faqLd = faq => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
})

// ─── Mapa do Oeste (projeção simples lat/lng → SVG) ─────────
const W = 800, H = 640
const bounds = { w: -46.1, e: -43.1, n: -10.85, s: -13.75 }
const proj = ([lat, lng]) => [
  +(((lng - bounds.w) / (bounds.e - bounds.w)) * (W - 100) + 50).toFixed(1),
  +(((bounds.n - lat) / (bounds.n - bounds.s)) * (H - 80) + 50).toFixed(1),
]
const geoOf = c => [c.geo.lat, c.geo.lng]
const curve = pts => {
  const p = pts.map(proj)
  let d = `M${p[0][0]},${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`
  }
  return d
}
// traçado aproximado, só para dar leitura de lugar
const rivers = [
  ['river', [[-12.3, -46.2], [-12.22, -45.6], [-12.15, -44.99], [-11.95, -44.5], [-11.6, -43.9], [-11.15, -43.2]]], // Rio Grande
  ['river', [[-13.9, -43.3], [-13.26, -43.4], [-12.6, -43.3], [-11.9, -43.25], [-11.1, -43.15], [-10.7, -43.3]]], // São Francisco
  ['river river--thin', [[-13.55, -45.5], [-13.34, -44.64], [-13.4, -44.19], [-13.22, -43.55]]], // Rio Corrente
]
const roads = [
  [[-12.1, -45.79], [-12.15, -44.99], [-12.35, -44.3], [-12.55, -43.6]], // BR-242
  [[-12.15, -44.99], [-11.75, -44.91], [-11.05, -45.19]], // rumo a Riachão e Formosa
  [[-12.15, -44.99], [-12.36, -44.97], [-13.34, -44.64], [-13.4, -44.19]], // rumo ao sul
]
const labelPos = { 'luis-eduardo-magalhaes': ['middle', 0, -48], correntina: ['end', -22, 2], 'bom-jesus-da-lapa': ['end', -22, -10], 'sao-desiderio': ['start', 22, 18] }
const pinSvg = (c, big) => {
  const [x, y] = proj(geoOf(c))
  const [anchor, dx, dy] = labelPos[c.slug] || ['start', 22, -10]
  return `<a href="${cityPath(c)}" data-city="${c.slug}" data-name="${esc(c.name)}" data-dist="${esc(c.main ? 'nossa base' : c.dist)}" data-niches="${esc(c.niches.slice(0, 3).join(' · '))}" data-xy="${x},${y}"><title>Marketing digital em ${esc(c.name)}</title>
    ${c.main ? `<circle class="pulse" cx="${x}" cy="${y - 33 * 1.35}" r="12"/>` : ''}
    <g class="pin${c.main ? ' pin--main' : ''}" transform="translate(${x} ${y}) scale(${c.main ? 1.35 : big ? 1 : 0.9})"><path d="${pinPath}"/><circle cy="-33" r="5"/></g>
    <text x="${x + dx}" y="${y + dy}" text-anchor="${anchor}"${c.main ? ' class="main"' : ''}>${esc(c.name)}</text></a>`
}
const mapSvg = () => {
  const [bx, by] = proj(geoOf(cities.find(c => c.main)))
  return `<div class="map" data-rise><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa do Oeste da Bahia com as cidades atendidas pela Agência Viva">
    <g class="grid">${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 100},0V${H}"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<path d="M0,${i * 100}H${W}"/>`).join('')}</g>
    ${rivers.map(([cls, pts]) => `<path class="${cls}" d="${curve(pts)}"/>`).join('')}
    <path class="route" data-from="${bx},${by}" d=""/>
    ${roads.map(pts => `<path class="road" d="${curve(pts)}"/>`).join('')}
    ${cities.filter(c => !c.main).map(c => pinSvg(c, true)).join('')}
    ${pinSvg(cities.find(c => c.main), true)}
    <text class="hand-t" x="${bx - 34}" y="${by + 58}" text-anchor="end" fill="#f3f2ee">a gente tá aqui!</text>
    <text class="compass" x="${W - 60}" y="46">N ↑</text>
  </svg></div>`
}
// mapinho recortado entre Barreiras e a cidade da página
const miniMap = c => {
  const main = cities.find(x => x.main)
  const pts = c.main ? cities.filter(x => ['barreiras', 'sao-desiderio', 'riachao-das-neves', 'luis-eduardo-magalhaes'].includes(x.slug)) : [main, c]
  const xy = pts.map(p => proj(geoOf(p)))
  const xs = xy.map(p => p[0]), ys = xy.map(p => p[1])
  const pad = 130
  let x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad, y0 = Math.min(...ys) - pad - 30, y1 = Math.max(...ys) + pad
  const w = Math.max(x1 - x0, 420), h = Math.max(y1 - y0, 320)
  x0 -= (w - (x1 - x0)) / 2; y0 -= (h - (y1 - y0)) / 2
  const [bx, by] = proj(geoOf(main)), [cx, cy] = proj(geoOf(c))
  const trip = c.main ? '' : `<path class="trip" d="M${bx},${by - 20} Q${(bx + cx) / 2 + 40},${Math.min(by, cy) - 70} ${cx},${cy - 20}"/>
    <text class="dist" x="${(bx + cx) / 2 + 40}" y="${Math.min(by, cy) - 58}" text-anchor="middle">${esc(c.dist.replace('a cerca de ', '~'))}</text>`
  const pinsHtml = pts.map(p => {
    const [x, y] = proj(geoOf(p))
    const here = p === c
    return `<g class="pin${here ? ' pin--here' : ''}" transform="translate(${x} ${y}) scale(${here ? 1.3 : 1})"><path d="${pinPath}"/></g><text x="${x}" y="${y + 30}" text-anchor="middle">${esc(p.name)}</text>`
  }).join('')
  return `<figure class="minimap paper prop"><svg viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}" role="img" aria-label="Mapa de ${esc(c.name)}${c.main ? '' : ' em relação a Barreiras'}">
    ${rivers.map(([cls, p]) => `<path class="${cls}" d="${curve(p)}"/>`).join('')}${trip}${pinsHtml}</svg>
    <figcaption>${c.main ? 'Nossa base, no coração do Oeste baiano.' : `${esc(c.name)} fica ${esc(c.dist)}.`}</figcaption></figure>`
}

// ─── Adereços (um objeto de verdade por serviço) ────────────
const props = {
  'gestao-de-trafego-pago': () => `<div class="prop">${logos(['meta', 'googleads', 'tiktok'])}<div class="ad paper">
    <div class="ad__top"><i></i><div><b>Sua empresa</b><small>Patrocinado · Barreiras</small></div></div>
    <div class="ad__img">Sábado tem <span class="s">novidade</span></div>
    <div class="ad__cta"><span>Enviar mensagem</span><span>›</span></div>
    <svg class="cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#0b0b0b" stroke-width="1.6" stroke-linejoin="round"/></svg>
  </div></div>`,
  'social-media': () => `<div class="prop">${logos(['instagram', 'facebook', 'tiktok'])}<div class="feed paper">
    <div class="feed__head"><i></i><div><b>@suaempresa</b><br><small>Barreiras - BA · perfil comercial</small></div></div>
    <div class="feed__grid">${['Chegou <em>novidade</em>', 'Bastidores', 'Reels ▶', 'Antes e depois', 'Dica da <em>semana</em>', 'Equipe', 'Promo', 'Cliente feliz', 'Sábado aberto'].map(t => `<span>${t}</span>`).join('')}</div>
  </div></div>`,
  'criacao-de-sites': () => `<div class="prop"><div class="browser paper">
    <div class="browser__bar"><i></i><i></i><i></i><span>suaempresa.com.br</span></div>
    <div class="browser__body"><b>A melhor opção de Barreiras, a um clique.</b><div class="ln"></div><div class="ln"></div><span class="fake-btn">${waIcon.replace('<svg', '<svg width="16" height="16"')} Chamar no WhatsApp</span>
    <div class="browser__cols"><span></span><span></span><span></span></div></div>
  </div></div>`,
  'google-meu-negocio-seo-local': () => `<div class="prop">${logos(['google'])}<div class="gmb paper">
    <div class="gmb__map">${logoIc('googlemaps')}</div>
    <div class="gmb__body"><b>Sua Empresa</b><span class="stars" aria-hidden="true">★★★★★</span><small><em>Aberto agora</em> · Centro, Barreiras - BA</small>
    <div class="gmb__btns"><span>Rotas</span><span>Ligar</span><span>Site</span></div></div>
  </div></div>`,
  'identidade-visual': () => `<div class="prop"><div class="brand paper">
    <div class="brand__row"><span>Preto</span><span>Branco</span><span>Cinza</span><span>Papel</span></div>
    <div class="brand__type"><b>Aa</b><em>Aa</em><small>título forte<br>+ assinatura</small></div>
    <div class="brand__logo"><span>SUA</span><span>MARCA</span></div>
  </div></div>`,
  'producao-de-conteudo-audiovisual': () => `<div class="prop" style="width:auto">${logos(['instagram', 'youtube', 'tiktok'])}<div class="rec paper">
    <div class="rec__frame"></div>
    <div class="rec__top"><b>REC</b><span>00:14</span></div>
    <div class="rec__mid"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4l14 8-14 8z"/></svg></div>
    <div class="rec__cap">Bastidores da <span class="s">sua</span> loja</div>
  </div></div>`,
}

// ─── Blocos reutilizáveis ────────────────────────────────────
const crumbsHtml = items => `<nav aria-label="Você está em"><ol class="crumbs">${items
  .map(([n, p], i) => (i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${p}">${esc(n)}</a></li>`)).join('')}</ol></nav>`

const faqBlock = (title, faq, note = 'Não achou sua dúvida? Manda no WhatsApp.') => `
<section class="sec" aria-labelledby="h-faq">
  <div class="wrap faq-grid">
    <div>
      <span class="label" data-rise>Perguntas frequentes</span>
      <h2 id="h-faq" class="h2" data-split style="margin-top:18px">${title}</h2>
      <p class="hand" style="font-size:28px;margin-top:26px;rotate:-2deg" data-rise>${note}</p>
    </div>
    <div class="faq">${faq.map(([q, a], i) => `
      <details${i === 0 ? ' open' : ''}><summary>${esc(q)}<i aria-hidden="true"></i></summary><div class="ans"><p>${esc(a)}</p></div></details>`).join('')}
    </div>
  </div>
</section>`

const ticket = (s, i, tag = 'h3') => `<a class="ticket" href="${svcPath(s)}">
    <span class="tape" aria-hidden="true"></span>
    ${svcLogos[s.slug] ? logos(svcLogos[s.slug]) : `<span class="stampic" aria-hidden="true"><svg viewBox="0 0 24 24">${svcStamp[s.slug] || ic[s.icon]}</svg></span>`}
    <span class="tnum" aria-hidden="true">${svcTag[s.slug] || ''}</span>
    <${tag}>${esc(s.short)}</${tag}>
    <p>${esc(s.pitch)}</p>
    ${svcArt[s.slug] ? svcArt[s.slug]() : ''}
    <span class="go">Ver como funciona ${icon('arrow')}</span>
  </a>`

// nomes iguais aos do CRM (crm/src/config.js SERVICOS), pra marcar o serviço certo no lead
const crmServico = { 'gestao-de-trafego-pago': 'Tráfego pago', 'social-media': 'Social media', 'criacao-de-sites': 'Site', 'google-meu-negocio-seo-local': 'SEO local / Google', 'identidade-visual': 'Identidade visual', 'producao-de-conteudo-audiovisual': 'Audiovisual' }
// formulário "Quero um orçamento": grava direto no funil do CRM (função lead_do_site no Supabase)
const leadForm = ({ servico = '', cidade = '' } = {}) => `<form class="lead-form paper" data-lead-form data-endpoint="${site.leads.url}/rest/v1/rpc/lead_do_site" data-key="${site.leads.key}" data-wa="${site.whatsapp}" novalidate>
  <h3>Quero um <span class="s">orçamento</span></h3>
  <p class="lf-sub">Deixa seu contato que a gente te chama no WhatsApp.</p>
  <label class="lf-field"><span>Seu nome</span><input name="nome" required autocomplete="name" maxlength="120"></label>
  <label class="lf-field"><span>WhatsApp</span><input name="telefone" type="tel" required inputmode="tel" autocomplete="tel" placeholder="(77) 9 9999-9999" maxlength="20"></label>
  <div class="lf-row">
    <label class="lf-field"><span>Cidade</span><select name="cidade">${cities.map(c => `<option${c.name === (cidade || 'Barreiras') ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}<option>Outra cidade</option></select></label>
    <label class="lf-field"><span>Precisa de</span><select name="servico"><option value="">Ainda não sei</option>${services.map(v => `<option value="${esc(crmServico[v.slug])}"${v.short === servico ? ' selected' : ''}>${esc(v.short)}</option>`).join('')}</select></label>
  </div>
  <label class="lf-field"><span>Quer contar mais? <small>(opcional)</small></span><textarea name="mensagem" rows="3" maxlength="1000" placeholder="O que a sua empresa faz, o que você quer melhorar…"></textarea></label>
  <label class="lf-hp" aria-hidden="true">Não preencha<input name="site_empresa" tabindex="-1" autocomplete="off"></label>
  <button class="btn btn--main" type="submit">Enviar pedido</button>
  <p class="lf-legal">Ao enviar, você autoriza a Agência Viva a falar com você pelo WhatsApp sobre este pedido. <a href="/privacidade/">Como usamos seus dados</a>.</p>
  <div class="lf-status" role="status" aria-live="polite"></div>
</form>`

const cta = (title = 'Sua empresa merece ser <span class="s">encontrada.</span>', text = 'Chama no WhatsApp e conta o que você vende. A gente olha seu Instagram, seu Google e seus anúncios e te diz por onde começar.', form = {}) => `
<section class="cta dark" id="orcamento" aria-labelledby="h-cta">
  <span class="bang" aria-hidden="true">!</span>
  <div class="wrap cta-grid">
    <div>
      <h2 id="h-cta" data-split>${title}</h2>
      <p data-rise>${text}</p>
      <div class="hero-cta" data-rise>
        <a class="btn btn--main btn--lg" href="${wa()}" target="_blank" rel="noopener">${waIcon} Chamar no WhatsApp</a>
        <a class="go" href="${site.instagram}" target="_blank" rel="noopener">${logoIc('instagram')} Espiar o Instagram ${icon('arrow')}</a>
      </div>
    </div>
    ${leadForm(form)}
  </div>
</section>`

const phoneChat = (msgs, seq = false, who = ['C', 'Cliente novo', 'via anúncio · online']) => `<div class="phone" aria-hidden="true"><div class="phone__screen">
  <div class="wa-top"><span class="av">${who[0]}</span><div><b>${who[1]}</b><small>${who[2]}</small></div></div>
  <div class="wa-body">${msgs.map(([dir, text, time]) => dir === 'typing'
    ? `<div class="msg msg--in msg--typing"${seq ? ' data-seq' : ''}><i></i><i></i><i></i></div>`
    : `<div class="msg msg--${dir}"${seq ? ' data-seq' : ''}>${text}<small>${time}${dir === 'out' ? ' ✓✓' : ''}</small></div>`).join('')}</div>
  <div class="wa-input"><span>Mensagem</span><i></i></div>
</div></div>`

// ─── Layout ──────────────────────────────────────────────────
const nav = [['Serviços', '/servicos/'], ['Cidades', '/#cidades'], ['Sobre', '/sobre/'], ['Contato', '/contato/']]
const layout = ({ path, title, desc, body, ld = [], active = '', robots = 'index, follow, max-image-preview:large' }) => `<!doctype html>
<html lang="pt-BR" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(path)}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="#f3f2ee">
<meta name="geo.region" content="BR-BA">
<meta name="geo.placename" content="Barreiras">
<meta name="geo.position" content="${site.geo.lat};${site.geo.lng}">
<meta name="ICBM" content="${site.geo.lat}, ${site.geo.lng}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${abs(path)}">
<meta property="og:image" content="${abs('/assets/og-viva.png')}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/logo-viva.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/viva.css">
${[business, website, ...ld].map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<header class="hdr">
  <div class="wrap">
    <a class="logo" href="/" aria-label="${esc(site.name)}, página inicial"><img src="/assets/logo-viva.png" alt="Agência Viva, agência de marketing em Barreiras" width="934" height="432"></a>
    <button class="burger" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
    <nav class="nav" id="menu" aria-label="Principal">
      ${nav.map(([n, p]) => `<a href="${p}"${active === p ? ' aria-current="page"' : ''}>${n}</a>`).join('')}
      <a class="btn btn--main" href="${wa()}" target="_blank" rel="noopener">${waIcon} Chamar no WhatsApp</a>
    </nav>
  </div>
</header>
<main id="conteudo">
${body}
</main>
<footer class="ftr">
  <div class="wrap">
    <div class="ftr-grid">
      <div>
        <a class="logo" href="/"><img src="/assets/logo-viva.png" alt="Agência Viva" width="934" height="432" loading="lazy"></a>
        <p style="max-width:30ch">Agência de marketing digital em Barreiras - BA, feita por gente do Oeste da Bahia.</p>
      </div>
      <div>
        <h2>Serviços</h2>
        <ul>${services.map(s => `<li><a href="${svcPath(s)}">${esc(s.short)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h2>Cidades</h2>
        <ul>${cities.map(c => `<li><a href="${cityPath(c)}">Marketing em ${esc(c.name)}</a></li>`).join('')}${landings.filter(l => !l.service).map(l => `<li><a href="${landingPath(l)}">${esc(l.nav || l.h1)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h2>Fale com a gente</h2>
        <address>
          <strong style="color:var(--black)">${esc(site.name)}</strong><br>
          ${esc(A.street)} - ${esc(A.district)}<br>
          ${esc(A.city)} - ${esc(A.state)}, ${esc(A.zip)}<br><br>
          <a href="${wa()}" target="_blank" rel="noopener">WhatsApp ${esc(site.phoneDisplay)}</a><br>
          <a href="mailto:${esc(site.email)}">${esc(site.email)}</a><br>
          <a href="${site.instagram}" target="_blank" rel="noopener">Instagram ${esc(site.instagramHandle)}</a><br>
          ${esc(site.hoursDisplay)}<br>
          <a href="${site.mapsUrl}" target="_blank" rel="noopener">Ver no Google Maps</a>
        </address>
      </div>
    </div>
    <p class="giant" aria-hidden="true"><span>V</span><span>I</span><span>V</span><span>A</span><span>!</span></p>
    <div class="ftr-bottom">
      <span>© ${new Date().getFullYear()} ${esc(site.name)}${site.cnpj ? ` · CNPJ ${esc(site.cnpj)}` : ''} · Agência de marketing em Barreiras - BA</span>
      <span>Barreiras · LEM · Oeste da Bahia · <a href="/privacidade/">Privacidade</a> · <a href="/crm/" rel="nofollow">Área da equipe</a></span>
    </div>
  </div>
</footer>
<a class="wa-float" href="${wa()}" target="_blank" rel="noopener" aria-label="Falar com a Agência Viva no WhatsApp">${waIcon}</a>
<script src="/assets/vendor/gsap.min.js" defer></script>
<script src="/assets/vendor/ScrollTrigger.min.js" defer></script>
<script src="/assets/vendor/SplitText.min.js" defer></script>
<script src="/assets/vendor/lenis.min.js" defer></script>
<script src="/assets/viva.js" defer></script>
</body>
</html>
`

// ─── Páginas ─────────────────────────────────────────────────
const pages = []
const page = p => pages.push(p)

// Home
page({
  path: '/',
  title: 'Agência de Marketing em Barreiras - BA | Agência Viva',
  desc: 'Agência de marketing em Barreiras - BA: tráfego pago, Instagram, sites e Google Maps pra empresas de Barreiras, Luís Eduardo Magalhães (LEM) e do Oeste.',
  ld: [faqLd(homeFaq)],
  body: `
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <h1 class="intro"><span class="kicker">Agência de marketing em Barreiras&nbsp;-&nbsp;BA</span>Sua empresa <span class="circled"><span class="s">viva</span>${hand.circle(1)}</span> no celular de quem compra.</h1>
      <p class="lede intro" style="animation-delay:.12s">Instagram que dá vontade de seguir, anúncio que faz o WhatsApp tocar e perfil no Google em dia pra quando alguém de Barreiras procurar o que você vende.</p>
      <div class="hero-cta intro" style="animation-delay:.22s">
        <a class="btn btn--main btn--lg" href="${wa()}" target="_blank" rel="noopener">${waIcon} Chamar no WhatsApp</a>
        <a class="go" href="#servicos">Ver o que a gente faz ${icon('arrow')}</a>
      </div>
      <p class="proof intro" style="animation-delay:.32s">${logos(['instagram', 'googlemaps', 'whatsapp'])}<span><b>${tenure}</b> no Oeste da Bahia e a força de uma criadora com <b>300 mil seguidores</b>.</span></p>
    </div>
    <div class="hero-art">
      <p class="note note--a" aria-hidden="true">é o seu cliente chegando${hand.arrow()}</p>
      ${phoneChat([
        ['in', 'Oi! Vi o anúncio de vocês no Instagram 😍', '09:12'],
        ['in', 'Ainda tem horário pra sábado de manhã?', '09:12'],
        ['out', 'Tem sim! Fica melhor 9h ou 10h30?', '09:14'],
        ['in', '9h! Me manda a localização?', '09:15'],
        ['typing'],
      ], true)}
      <div class="chip chip--maps" aria-hidden="true">${logoIc('googlemaps')}<span><b>Apareceu no Maps</b>a 650 m de você</span></div>
      <div class="chip chip--ig" aria-hidden="true">${logoIc('instagram')}<span><b>+128 curtidas</b>no post de hoje</span></div>
      <div class="seal" aria-hidden="true"><svg viewBox="0 0 120 120"><defs><path id="ring" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0"/></defs><g class="ring"><text><textPath href="#ring" textLength="279" lengthAdjust="spacing">FEITO NO OESTE DA BAHIA · DESDE ${foundedYear} ·</textPath></text></g></svg><img src="/assets/logo-viva.png" alt="" width="934" height="432"></div>
    </div>
  </div>
</section>

<div class="bands" aria-hidden="true">
  <div class="band band--b"><div class="band__track">${[0, 1].map(() => `<span>${cities.map(c => `${esc(c.name)} <i>·</i>`).join(' ')}</span>`).join('')}</div></div>
  <div class="band band--a"><div class="band__track">${[0, 1].map(() => `<span>${[['Tráfego pago', 'meta'], ['Instagram', 'instagram'], ['Google Maps', 'googlemaps'], ['TikTok', 'tiktok'], ['Google Ads', 'googleads'], ['YouTube', 'youtube'], ['WhatsApp', 'whatsapp']].map(([t, l]) => `${t} ${logoIc(l)}`).join(' ')}</span>`).join('')}</div></div>
</div>

<section class="manifesto dark" aria-label="Por que a Viva existe">
  <div class="wrap manifesto-grid">
    <div>
    <span class="label" data-rise>Por que a gente existe</span>
    <p>Tem empresa boa demais em Barreiras que ninguém encontra no Google. Tem loja linda postando foto torta. Tem clínica cheia de indicação sumida do Instagram. A gente existe pra <span class="s">resolver isso.</span></p>
    <span class="sign" data-rise>— equipe Viva</span>
    </div>
    <ul class="searches" aria-label="Exemplos de buscas feitas por clientes da região">
      ${['pizzaria em Barreiras', 'dentista perto de mim', 'loja de roupa LEM', 'revenda agrícola Barreiras', 'salão de beleza aberto agora', 'academia São Desidério'].map((q, i) => `<li data-rise="${(i * 0.08).toFixed(2)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg><span>${q}</span><em>sua empresa aparece?</em></li>`).join('')}
    </ul>
  </div>
</section>

<section class="svc" id="servicos" aria-labelledby="h-serv">
  <div class="wrap">
    <div class="svc__grid">
      <div class="svc__intro">
        <span class="label" data-rise>O que a gente faz</span>
        <h2 id="h-serv" class="h2" data-split style="margin-top:18px">Do anúncio ao <span class="s">vídeo.</span></h2>
        <p class="lede" data-rise style="margin-top:24px">São seis serviços. Dá pra começar por um e ir somando os outros, ou deixar tudo com a gente.</p>
        <div class="svc__count" aria-hidden="true"><b>01</b><span>de ${String(services.length).padStart(2, '0')} · role pra girar</span></div>
        <div class="dots" role="group" aria-label="Ir para o serviço">${services.map((s, i) => `<button type="button" aria-label="${esc(s.short)}" aria-current="${i === 0}"></button>`).join('')}</div>
      </div>
      <div class="wheel">
        <svg class="rio__svg" aria-hidden="true"><path/></svg>
        ${services.map((s, i) => ticket(s, i)).join('')}
      </div>
    </div>
  </div>
</section>

<section class="notif dark" aria-labelledby="h-notif">
  <div class="wrap notif-grid">
    <div>
      <span class="label" data-rise>O que muda</span>
      <h2 id="h-notif" class="h2" data-split style="margin-top:18px">O tipo de notificação que a gente quer ver no <span class="s">seu</span> celular.</h2>
      <p class="lede" data-rise>Mensagem de cliente novo no WhatsApp, ligação que veio do Google, gente pedindo rota até a sua porta. Marketing bem feito, no dia a dia, tem essa cara.</p>
      <p class="fine" data-rise>*Ilustração. Os números reais são os da sua empresa, e eles vão no relatório de cada mês.</p>
    </div>
    <div class="lock" aria-hidden="true"><div class="lock__screen">
      <div class="lock__time">08:12</div>
      <div class="lock__date">terça-feira · Barreiras</div>
      <ul class="lock__list">
        <li class="n">${logoIc('whatsapp')}<span class="n__head"><b>Cliente novo</b>agora</span><span>Oi! Vim pelo anúncio, queria um orçamento 🙏</span></li>
        <li class="n">${logoIc('google')}<span class="n__head"><b>Perfil da Empresa</b>2 min</span><span>Alguém ligou pra você pelo Google Maps.</span></li>
        <li class="n">${logoIc('instagram')}<span class="n__head"><b>Instagram</b>9 min</span><span>Seu Reels chegou em 12 mil contas. Tá bombando!</span></li>
        <li class="n">${logoIc('googlemaps')}<span class="n__head"><b>Google Maps</b>1 h</span><span>14 pessoas pediram rota até a sua loja esta semana.</span></li>
        <li class="n">${logoIc('whatsapp')}<span class="n__head"><b>Dona Marta</b>1 h</span><span>Vocês entregam em Luís Eduardo? 😊</span></li>
      </ul>
    </div></div>
  </div>
</section>

<section class="sec" aria-labelledby="h-why">
  <div class="wrap">
    <div class="sec-head">
      <h2 id="h-why" class="h2" data-split>Por que <span class="s">a Viva.</span></h2>
      <p class="lede" data-rise>Conteúdo com a cara do Oeste e a parte técnica bem feita: anúncio, site, Google e relatório.</p>
    </div>
    <div class="stack">
      <article class="scard scard--black" style="--i:0"><div><h3>A gente é daqui.</h3><p>Conhece a rua, o bairro, a safra e o calendário da cidade. Post de sábado de manhã em Barreiras não é igual a post de terça em São Paulo.</p><span class="hand">sem sotaque de agência de capital</span></div><span class="big" aria-hidden="true">Oeste</span></article>
      <article class="scard scard--white" style="--i:1"><div><h3>${years >= 10 ? 'Dez anos de estrada.' : 'Quase dez anos de estrada.'}</h3><p>A Viva está no mercado desde novembro de ${foundedYear}. Já viu muita moda de rede social ir e vir, e sabe o que continua vendendo pra empresa do interior.</p><span class="hand">experiência não se improvisa</span></div><span class="big" aria-hidden="true">${foundedYear}</span></article>
      <article class="scard scard--black" style="--i:2"><div><h3>Feita por quem cria.</h3><p>A Viva nasceu da rede de uma criadora de conteúdo que o Oeste já acompanha. Foi ali que a gente aprendeu o que o público daqui assiste até o fim.</p><span class="hand">300 mil pessoas não seguem qualquer um</span></div><span class="big" aria-hidden="true">300 mil</span></article>
      <article class="scard scard--gray" style="--i:3"><div><h3>Operação que não some.</h3><p>Tráfego, site e Google numa rotina que você acompanha: dá pra ver o que foi feito e quanto custou.</p><span class="hand">nada de sumir depois do contrato</span></div><span class="big" aria-hidden="true">todo mês</span></article>
    </div>
  </div>
</section>

<section class="method sec sec--paper2" aria-labelledby="h-met">
  <div class="wrap sec-head" style="margin-bottom:50px">
    <h2 id="h-met" class="h2" data-split>Como a gente <span class="s">trabalha.</span></h2>
    <p class="lede" data-rise>Quatro passos, sem mistério. Você acompanha tudo.</p>
  </div>
  <div class="method__track">
    ${[
      ['A gente escuta.', 'Uma conversa sem pressa pra entender o que você vende, pra quem e o que já tentou.', 'pode ser no zap ou pessoalmente'],
      ['Raio-x.', 'Um pente-fino no seu Instagram, no seu Google, no seu site e nos concorrentes da sua cidade.', 'tudo explicado sem jargão'],
      ['Mão na massa.', 'Conteúdo, anúncios, site e Google Maps rodando no ritmo certo, todo mês.', 'e você aprova antes de ir pro ar'],
      ['Número na mesa.', 'Relatório claro: quantos contatos vieram, quanto custou cada um e o que ajustar.', 'o que não funciona, a gente troca'],
    ].map(([t, d, h], i) => `<article class="mpanel"><span class="num" aria-hidden="true">${i + 1}.</span><h3>${t}</h3><p>${d}</p><span class="hand">${h}</span></article>`).join('')}
  </div>
  <div class="wrap"><div class="method__bar" aria-hidden="true"><i></i></div></div>
</section>

<section class="sec dark" id="cidades" aria-labelledby="h-cid">
  <div class="wrap map-grid" data-map>
    <div>
      <span class="label" data-rise>Onde a gente atua</span>
      <h2 id="h-cid" class="h2" data-split style="margin-top:18px">De Barreiras pra todo o <span class="s">Oeste.</span></h2>
      <p class="lede" data-rise style="margin-top:26px">Do agro de Luís Eduardo Magalhães e Formosa do Rio Preto ao comércio de Correntina e Santa Maria da Vitória. Passa o mouse no mapa ou toca na sua cidade:</p>
      <div class="chips" data-rise>${cities.map(c => `<a href="${cityPath(c)}" data-city="${c.slug}">${esc(c.name)}</a>`).join('')}</div>
    </div>
    <div style="position:relative">
      ${mapSvg()}
      <div class="map-info" aria-live="polite"><span class="hand"></span><b></b><span></span><br><a href="#"></a></div>
    </div>
  </div>
</section>

${testimonials.length ? `<section class="sec" aria-labelledby="h-dep"><div class="wrap">
  <h2 id="h-dep" class="h2" data-split>Quem já está <span class="s">vivo.</span></h2>
  <div class="minis" style="margin-top:60px">${testimonials.map(t => `<figure class="paper" style="padding:30px;margin:0"><blockquote style="margin:0"><p>“${esc(t.text)}”</p></blockquote><figcaption>${esc(t.name)}, ${esc(t.company)}</figcaption></figure>`).join('')}</div>
</div></section>` : ''}

${faqBlock('Dúvidas de quem está <span class="s">chegando.</span>', homeFaq)}
${cta()}`,
})

// Índice de serviços
page({
  path: '/servicos/',
  active: '/servicos/',
  title: 'Serviços de Marketing em Barreiras - BA | Agência Viva',
  desc: 'Tráfego pago, social media, criação de sites, SEO local, identidade visual e produção de vídeo para empresas de Barreiras e do Oeste da Bahia.',
  ld: [crumbsLd([['Início', '/'], ['Serviços', '/servicos/']])],
  body: `
<section class="phero">
  <div class="wrap phero-grid">
    <div>
      ${crumbsHtml([['Início', '/'], ['Serviços', '/servicos/']])}
      <h1 data-split>Serviços de marketing em <span class="s">Barreiras.</span></h1>
      <p class="lede" data-rise=".1">Escolhe um serviço ou deixa tudo com a gente. Um puxa o outro: quem vê o anúncio confere o Instagram antes de chamar no WhatsApp, e o Google traz quem já está procurando.</p>
      <a class="btn btn--main btn--lg" data-rise=".2" href="${wa('Olá, Agência Viva! Quero entender qual serviço faz sentido pra minha empresa.')}" target="_blank" rel="noopener">${waIcon} Me ajuda a escolher</a>
    </div>
    ${props['social-media']()}
  </div>
</section>
<section class="sec" style="padding-top:20px" aria-label="Lista de serviços">
  <div class="wrap">
    <div class="minis">${services.map((s, i) => ticket(s, i, 'h2')).join('')}</div>
  </div>
</section>
${cta()}`,
})

// Páginas de serviço
for (const s of services) {
  const idx = services.indexOf(s)
  const others = [1, 2, 3].map(k => services[(idx + k) % services.length])
  const crumbs = [['Início', '/'], ['Serviços', '/servicos/'], [s.short, svcPath(s)]]
  page({
    path: svcPath(s),
    active: '/servicos/',
    title: s.title,
    desc: s.desc,
    ld: [
      crumbsLd(crumbs),
      faqLd(s.faq),
      {
        '@context': 'https://schema.org', '@type': 'Service', '@id': abs(svcPath(s)) + '#servico', name: s.name, serviceType: s.name, description: s.desc, url: abs(svcPath(s)),
        provider: { '@id': bizId },
        areaServed: cities.map(c => ({ '@type': 'City', name: `${c.name}, Bahia` })),
      },
    ],
    body: `
<section class="phero">
  <div class="wrap phero-grid">
    <div>
      ${crumbsHtml(crumbs)}
      <h1 data-split>${esc(s.h1 || s.name + ' em')} <span class="s">Barreiras</span></h1>
      <p class="lede" data-rise=".1">${esc(s.lead)}</p>
      <a class="btn btn--main btn--lg" data-rise=".2" href="${wa(`Olá, Agência Viva! Quero saber mais sobre ${s.name}.`)}" target="_blank" rel="noopener">${waIcon} Quero saber mais</a>
    </div>
    ${props[s.slug]()}
  </div>
</section>
<section class="sec" style="padding-top:30px">
  <div class="wrap two">
    <div class="prose">
      <h2 data-split>O que está <span class="s">incluso.</span></h2>
      <ul class="checklist paper" data-rise>${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      <h2 data-split>Por que isso importa no <span class="s">Oeste.</span></h2>
      <p data-rise>${esc(s.why)}</p>
      <p data-rise>A gente atende empresas de ${listPt(cities.map(c => `<a href="${cityPath(c)}">${esc(c.name)}</a>`))}.</p>
    </div>
    <aside class="aside paper" data-rise>
      <span class="hand" aria-hidden="true">manda um oi!</span>
      <h2>Vamos conversar?</h2>
      <p>Conta rapidinho como está a sua empresa hoje. A gente te diz se esse serviço é o melhor começo ou se tem algo que vem antes.</p>
      <a class="btn btn--main" href="${wa(`Olá, Agência Viva! Quero conversar sobre ${s.short}.`)}" target="_blank" rel="noopener">${waIcon} Chamar no WhatsApp</a>
    </aside>
  </div>
</section>
<section class="sec sec--paper2" aria-labelledby="h-etapas">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-etapas" class="h2" data-split>Como <span class="s">funciona.</span></h2></div>
    <div class="steps">${s.steps.map(t => `<div class="step paper" data-rise><h3>${esc(t)}</h3></div>`).join('')}</div>
  </div>
</section>
${faqBlock(`Dúvidas sobre <span class="s">${esc(s.short)}.</span>`, s.faq)}
<section class="sec" style="padding-top:0" aria-labelledby="h-mais">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-mais" class="h2" data-split>Combina <span class="s">com:</span></h2></div>
    <div class="minis">${others.map(o => ticket(o, services.indexOf(o), 'h3')).join('')}</div>
  </div>
</section>
${cta(undefined, undefined, { servico: s.short })}`,
  })
}

// Páginas de cidade (SEO local)
for (const c of cities) {
  const cc = cityCopy[c.slug] || {}
  const crumbs = [['Início', '/'], [`Marketing em ${c.name}`, cityPath(c)]]
  const faq = cc.faq && cc.faq.length ? cc.faq.map(f => [f.q, f.a]) : [
    [`Vocês atendem empresas em ${c.name}?`, c.main
      ? 'Sim, Barreiras é a nossa base. Dá pra conversar pelo WhatsApp ou marcar uma reunião aqui na cidade.'
      : `Sim. ${c.name} fica ${c.dist}. O trabalho do dia a dia é feito a distância, pelo WhatsApp, e visita pra reunião ou gravação a gente combina com você quando faz sentido.`],
    [`Quanto custa marketing digital em ${c.name}?`, 'Os planos variam conforme o escopo: social media, tráfego pago, site ou um pacote completo. A gente monta uma proposta do tamanho da sua empresa. Chama no WhatsApp pra conversar.'],
    [`Como aparecer no Google Maps em ${c.name}?`, `Com um Perfil da Empresa no Google completo e otimizado para ${c.name}: categoria certa, fotos reais, avaliações de clientes, posts frequentes e dados consistentes em todos os canais. É o que a gente faz no serviço de SEO local.`],
  ]
  const others = cities.filter(o => o !== c)
  const children = landings.filter(l => l.city === c.slug)
  // Barreiras: a home disputa "agência de marketing em Barreiras"; a página da cidade fica com "marketing digital e publicidade"
  const h1 = cc.h1 || (c.main ? 'Marketing digital e publicidade em Barreiras - BA' : `Agência de marketing em ${c.name} - BA`)
  const h1Accent = cc.h1 ? cc.h1_accent : c.main ? 'Barreiras - BA' : `${c.name} - BA`
  page({
    path: cityPath(c),
    title: cc.title || (c.main ? 'Marketing Digital e Publicidade em Barreiras - BA' : `Agência de Marketing em ${c.name} - BA | Agência Viva`),
    desc: cc.description || `Marketing digital em ${c.name} - BA: tráfego pago, Instagram, sites e Google Meu Negócio para empresas${c.main ? ' de Barreiras' : ` de ${c.name}`}. Agência Viva, do Oeste da Bahia.`,
    ld: [crumbsLd(crumbs), faqLd(faq), {
      '@context': 'https://schema.org', '@type': 'Service', '@id': abs(cityPath(c)) + '#servico', name: `Marketing digital em ${c.name}`, serviceType: 'Marketing digital',
      provider: { '@id': bizId }, url: abs(cityPath(c)),
      areaServed: { '@type': 'City', name: `${c.name}, Bahia`, ...(cc.wiki ? { sameAs: cc.wiki } : {}) },
    }],
    body: `
<section class="phero">
  <div class="wrap phero-grid">
    <div>
      ${crumbsHtml(crumbs)}
      <h1 data-split>${accentH1(h1, h1Accent)}</h1>
      <p class="lede" data-rise=".1">${esc(c.intro)}</p>
      <a class="btn btn--main btn--lg" data-rise=".2" href="${wa(`Olá, Agência Viva! Tenho uma empresa em ${c.name} e quero crescer no digital.`)}" target="_blank" rel="noopener">${waIcon} Falar com a Viva</a>
    </div>
    ${miniMap(c)}
  </div>
</section>
<section class="sec" style="padding-top:30px">
  <div class="wrap two">
    <div class="prose">
      <h2 data-split>Marketing pensado pra <span class="s">${esc(c.name)}.</span></h2>
      <p data-rise>${esc(c.angle)}</p>
      ${(cc.local || []).map(t => `<p data-rise>${esc(t)}</p>`).join('')}
      <p data-rise>A Agência Viva cuida das três frentes que mais trazem cliente pra empresa local: <a href="${svcPath(services[3])}">aparecer no Google Maps</a>, ter um <a href="${svcPath(services[1])}">Instagram profissional</a> e rodar <a href="${svcPath(services[0])}">anúncios que chamam no WhatsApp</a>. Quando faz sentido, a gente completa com <a href="${svcPath(services[2])}">site próprio</a>, <a href="${svcPath(services[4])}">identidade visual</a> e <a href="${svcPath(services[5])}">produção de vídeo</a>.${c.main ? ' Quer entender o trabalho completo? Veja a nossa <a href="/">agência de marketing em Barreiras</a>.' : ''}</p>
      ${children.length ? `<p data-rise>Em ${esc(c.name)}, a gente tem páginas com mais detalhes: ${listPt(children.map(l => `<a href="${landingPath(l)}">${esc(l.nav || l.h1)}</a>`))}.</p>` : ''}
      <h2 data-split>Quem a gente atende <span class="s">aqui.</span></h2>
      <ul class="tags" data-rise>${c.niches.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
    </div>
    <aside class="aside paper" data-rise>
      <span class="hand" aria-hidden="true">${c.main ? 'pertinho de você' : 'direto de Barreiras'}</span>
      <h2>Bora conversar?</h2>
      <p>Conta o que a sua empresa faz em ${esc(c.name)}. A gente sugere o primeiro passo.</p>
      <a class="btn btn--main" href="${wa(`Olá! Tenho uma empresa em ${c.name} e quero conversar.`)}" target="_blank" rel="noopener">${waIcon} Chamar no WhatsApp</a>
    </aside>
  </div>
</section>
<section class="sec sec--paper2" aria-labelledby="h-serv">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-serv" class="h2" data-split>O que a gente faz em <span class="s">${esc(c.name)}.</span></h2></div>
    <div class="minis">${services.map((s, i) => ticket(s, i, 'h3')).join('')}</div>
  </div>
</section>
${faqBlock(`Marketing em <span class="s">${esc(c.name)}.</span>`, faq)}
<section class="sec" style="padding-top:0" aria-labelledby="h-outras">
  <div class="wrap">
    <h2 id="h-outras" class="h3" data-split>A gente também atende:</h2>
    <div class="chips" data-rise>${others.map(o => `<a href="${cityPath(o)}">${esc(o.name)}</a>`).join('')}${landings.filter(l => !l.service).map(l => `<a href="${landingPath(l)}">${esc(l.nav || l.h1)}</a>`).join('')}</div>
  </div>
</section>
${cta(`Sua empresa viva em <span class="s">${esc(c.name)}.</span>`, undefined, { cidade: c.name })}`,
  })
}

// Páginas novas do plano de SEO (hub do Oeste, serviço × LEM)
for (const l of landings) {
  const city = l.city && cities.find(c => c.slug === l.city)
  const svc = l.service && services.find(s => s.slug === l.service)
  const crumbs = [['Início', '/'], ...(city ? [[`Marketing em ${city.name}`, cityPath(city)]] : []), [l.nav || l.h1, landingPath(l)]]
  const faq = (l.faq || []).map(f => [f.q, f.a])
  const art = l.slug.includes('oeste') ? `<div class="prop" style="width:min(100%,560px)">${mapSvg()}</div>` : svc && props[svc.slug] ? props[svc.slug]() : city ? miniMap(city) : ''
  page({
    path: landingPath(l),
    title: l.title,
    desc: l.description,
    ld: [crumbsLd(crumbs), ...(faq.length ? [faqLd(faq)] : []), {
      '@context': 'https://schema.org', '@type': 'Service', '@id': abs(landingPath(l)) + '#servico', name: l.h1, serviceType: svc ? svc.name : 'Marketing digital',
      provider: { '@id': bizId }, url: abs(landingPath(l)),
      areaServed: city ? { '@type': 'City', name: `${city.name}, Bahia`, ...(cityCopy[city.slug] && cityCopy[city.slug].wiki ? { sameAs: cityCopy[city.slug].wiki } : {}) } : cities.map(c => ({ '@type': 'City', name: `${c.name}, Bahia` })),
    }],
    body: `
<section class="phero">
  <div class="wrap phero-grid">
    <div>
      ${crumbsHtml(crumbs)}
      <h1 data-split>${accentH1(l.h1, l.h1_accent)}</h1>
      <p class="lede" data-rise=".1">${esc(l.lead)}</p>
      <a class="btn btn--main btn--lg" data-rise=".2" href="${wa(`Olá, Agência Viva! Vi a página "${l.nav || l.h1}" e quero conversar.`)}" target="_blank" rel="noopener">${waIcon} Chamar no WhatsApp</a>
    </div>
    ${art}
  </div>
</section>
<section class="sec" style="padding-top:30px">
  <div class="wrap two">
    <div class="prose">
      ${l.sections.map(sec => `<h2 data-split>${esc(sec.h2)}</h2>
      ${sec.paragraphs.map(t => `<p data-rise>${esc(t)}</p>`).join('')}
      ${sec.bullets && sec.bullets.length ? `<ul class="checklist paper" data-rise>${sec.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}`).join('')}
      <p data-rise>${svc ? `Veja também o serviço completo de <a href="${svcPath(svc)}">${esc(svc.name)} em Barreiras</a>` : 'Veja também os <a href="/servicos/">serviços da Viva</a>'}${city ? ` e a página de <a href="${cityPath(city)}">marketing em ${esc(city.name)}</a>` : ''}.</p>
    </div>
    <aside class="aside paper" data-rise>
      <span class="hand" aria-hidden="true">manda um oi</span>
      <h2>Vamos conversar?</h2>
      <p>Conta rapidinho o que a sua empresa faz${city ? ` em ${esc(city.name)}` : ''}. A gente sugere o primeiro passo.</p>
      <a class="btn btn--main" href="${wa(`Olá! Vi a página "${l.nav || l.h1}" e quero conversar.`)}" target="_blank" rel="noopener">${waIcon} Chamar no WhatsApp</a>
    </aside>
  </div>
</section>
${faq.length ? faqBlock('Perguntas <span class="s">frequentes.</span>', faq) : ''}
<section class="sec sec--paper2" aria-labelledby="h-mais">
  <div class="wrap">
    <div class="sec-head"><h2 id="h-mais" class="h2" data-split>O que a gente <span class="s">faz.</span></h2></div>
    <div class="minis">${services.map((s, i) => ticket(s, i, 'h3')).join('')}</div>
  </div>
</section>
${cta(undefined, undefined, { servico: svc ? svc.short : '', cidade: city ? city.name : '' })}`,
  })
}

// Sobre
page({
  path: '/sobre/',
  active: '/sobre/',
  title: `Sobre a Agência Viva: Marketing em Barreiras desde ${foundedYear}`,
  desc: 'Conheça a Agência Viva, agência de marketing de Barreiras - BA que une influência, estratégia e operação para fazer empresas do Oeste da Bahia crescerem.',
  ld: [crumbsLd([['Início', '/'], ['Sobre', '/sobre/']])],
  body: `
<section class="phero">
  <div class="wrap phero-grid">
    <div>
      ${crumbsHtml([['Início', '/'], ['Sobre', '/sobre/']])}
      <h1 data-split>${years >= 10 ? 'Dez anos' : `Desde ${foundedYear}`} no Oeste. <span class="s">Pensando grande.</span></h1>
      <p class="lede" data-rise=".1">A Agência Viva é uma agência de marketing de Barreiras - BA criada pra dar às empresas da região a mesma força digital das grandes marcas.</p>
    </div>
    <div class="prop"><div class="polaroid"><div class="polaroid__img"><img src="/assets/logo-viva.png" alt="" width="934" height="432"></div><span class="hand">Barreiras - BA</span><span class="tape" aria-hidden="true"></span></div></div>
  </div>
</section>
<section class="sec" style="padding-top:30px">
  <div class="wrap two">
    <div class="prose">
      <h2 data-split>Quem <span class="s">somos.</span></h2>
      <p data-rise>A Viva está no mercado desde ${foundedYear} (CNPJ ${esc(site.cnpj)}) e nasceu da vivência de quem cria conteúdo no Oeste da Bahia e reúne uma comunidade de centenas de milhares de seguidores. A gente sabe, na prática, o que prende a atenção das pessoas daqui, e o que faz elas comprarem.</p>
      <p data-rise>Pra transformar atenção em venda, a gente juntou essa força comercial e de influência a uma operação técnica de marketing: gestão de tráfego, sites, SEO local e acompanhamento com metas e relatório.</p>
      <h2 data-split>No que a gente <span class="s">acredita.</span></h2>
      <ul class="checklist paper" data-rise>
        <li>Marketing bom é o que aparece no caixa, não só nas curtidas.</li>
        <li>Marketing do interior tem que falar do jeito daqui.</li>
        <li>Transparência: você sabe o que foi feito e quanto custou cada contato.</li>
        <li>Atendimento de gente pra gente, com conversa direta.</li>
      </ul>
    </div>
    <aside class="aside paper" data-rise>
      <span class="hand" aria-hidden="true">daqui pro Oeste todo</span>
      <h2>Base em Barreiras</h2>
      <p>${esc(addrLine)}<br>${esc(site.hoursDisplay)}</p>
      <a class="btn btn--main" href="${wa()}" target="_blank" rel="noopener">${waIcon} Falar com a gente</a>
    </aside>
  </div>
</section>
${cta()}`,
})

// Contato
page({
  path: '/contato/',
  active: '/contato/',
  title: 'Contato | Agência Viva, Marketing em Barreiras - BA',
  desc: `Fale com a Agência Viva pelo WhatsApp ${site.phoneDisplay}. Agência de marketing em Barreiras - BA atendendo todo o Oeste da Bahia.`,
  ld: [crumbsLd([['Início', '/'], ['Contato', '/contato/']])],
  body: `
<section class="phero">
  <div class="wrap phero-grid">
    <div>
      ${crumbsHtml([['Início', '/'], ['Contato', '/contato/']])}
      <h1 data-split>Bora <span class="s">conversar?</span></h1>
      <p class="lede" data-rise=".1">O caminho mais rápido é o WhatsApp. É só mandar um oi contando o que a sua empresa faz.</p>
      <div class="hero-cta" data-rise=".2">
        <a class="btn btn--main btn--lg" href="${wa()}" target="_blank" rel="noopener">${waIcon} ${esc(site.phoneDisplay)}</a>
        <a class="go" href="${site.instagram}" target="_blank" rel="noopener">${esc(site.instagramHandle)} ${icon('arrow')}</a>
      </div>
    </div>
    <div class="prop" style="display:flex;justify-content:center">${phoneChat([
      ['out', 'Oi, Agência Viva! Tenho uma loja em Barreiras e quero crescer no Instagram.', '10:02'],
      ['in', 'Oi! Que bom te ver por aqui 😊 Me conta: o que você vende e há quanto tempo?', '10:05'],
      ['typing'],
    ], false, ['V', 'Agência Viva', 'online'])}</div>
  </div>
</section>
<section class="sec" style="padding-top:30px">
  <div class="wrap map-grid">
    <div class="prose">
      <h2 data-split>Onde a gente <span class="s">está.</span></h2>
      <address data-rise style="font-style:normal;color:var(--ink-2)">
        <strong style="color:var(--black)">${esc(site.name)}</strong><br>${esc(addrLine)}<br><br>
        ${esc(site.hoursDisplay)}<br>
        <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>
      </address>
      <p data-rise style="margin-top:28px"><a class="btn btn--ghost" href="${site.mapsUrl}" target="_blank" rel="noopener">Abrir no Google Maps</a></p>
    </div>
    ${mapSvg()}
  </div>
</section>`,
})

// Privacidade (LGPD) — formulário de orçamento
page({
  path: '/privacidade/',
  title: 'Política de Privacidade | Agência Viva',
  desc: 'Como a Agência Viva trata os dados enviados pelo formulário de orçamento e pelo WhatsApp: o que coletamos, para quê, onde guardamos e como pedir exclusão.',
  ld: [crumbsLd([['Início', '/'], ['Privacidade', '/privacidade/']])],
  updated: '2026-09-27',
  body: `
<section class="phero">
  <div class="wrap">
    ${crumbsHtml([['Início', '/'], ['Privacidade', '/privacidade/']])}
    <h1 data-split>Seus dados, <span class="s">sem mistério.</span></h1>
    <p class="lede" data-rise=".1">Resumo de como a Agência Viva trata as informações que você envia pelo formulário de orçamento ou pelo WhatsApp.</p>
  </div>
</section>
<section class="sec" style="padding-top:0">
  <div class="wrap prose">
    <h2>Quem somos</h2>
    <p>${esc(site.name)} (${esc(site.alternateName)}), CNPJ ${esc(site.cnpj)}, Barreiras - BA. Somos os responsáveis pelos dados enviados por este site.</p>
    <h2>O que coletamos</h2>
    <p>No formulário de orçamento: nome, WhatsApp, cidade, o serviço de interesse e a mensagem que você escrever. Nada é coletado sem você enviar. O site não usa cookies de rastreamento nem ferramentas de publicidade.</p>
    <h2>Para que usamos</h2>
    <p>Só para responder o seu pedido e conversar sobre o orçamento (Lei 13.709/2018, art. 7º, V: procedimentos preliminares a um contrato, a seu pedido). Não vendemos nem repassamos seus dados.</p>
    <h2>Onde ficam guardados</h2>
    <p>No nosso sistema de atendimento, hospedado no Supabase em servidores de São Paulo, com acesso restrito à equipe da Viva. Se não virar contrato, apagamos os dados quando não forem mais necessários para o atendimento.</p>
    <h2>Seus direitos</h2>
    <p>Você pode pedir a qualquer momento para ver, corrigir ou apagar seus dados. É só mandar uma mensagem no <a href="${wa('Olá! Quero ver/apagar os dados que enviei no site.')}" target="_blank" rel="noopener">WhatsApp</a> ou para <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>.</p>
  </div>
</section>`,
})

// 404
const notFound = layout({
  path: '/404.html',
  title: 'Página não encontrada | Agência Viva',
  desc: 'Esta página não existe.',
  robots: 'noindex',
  body: `<section class="phero" style="min-height:80svh;display:flex;align-items:center"><div class="wrap">
  <span class="label">Erro 404</span>
  <h1 style="margin-top:20px" data-split>Essa página <span class="s">sumiu do mapa.</span></h1>
  <p class="lede" data-rise=".1">Mas a sua empresa não precisa sumir. Volta pro início ou chama a gente.</p>
  <div class="hero-cta" data-rise=".2"><a class="btn btn--main btn--lg" href="/">Voltar ao início</a><a class="go" href="${wa()}" target="_blank" rel="noopener">Chamar no WhatsApp ${icon('arrow')}</a></div>
</div></section>`,
})

// ─── Escrita ─────────────────────────────────────────────────
rmSync(out, { recursive: true, force: true })
cpSync(join(root, 'public'), out, { recursive: true })
const write = (p, s) => { const f = join(out, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s) }

for (const p of pages) write(p.path.endsWith('/') ? p.path + 'index.html' : p.path, layout(p))
write('404.html', notFound)

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${abs(p.path)}</loc>${p.updated ? `<lastmod>${p.updated}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`)
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /crm/\n\nSitemap: ${abs('/sitemap.xml')}\n`)

// CRM (app React em ./crm, build próprio) servido em /crm/
if (existsSync(join(root, 'crm', 'dist', 'index.html'))) cpSync(join(root, 'crm', 'dist'), join(out, 'crm'), { recursive: true })
else console.warn('! CRM não compilado (rode: cd crm && npm install && npm run build)')

// llms.txt — resumo para buscadores de IA (GEO)
write('llms.txt', `# ${site.name}

> ${site.name} é uma agência de marketing digital sediada em Barreiras, Bahia, Brasil, que atende empresas de todo o Oeste da Bahia.

- Endereço: ${addrLine}
- WhatsApp: ${site.phoneDisplay}
- Instagram: ${site.instagram}
- Horário: ${site.hoursDisplay}

## Serviços
${services.map(s => `- [${s.name}](${abs(svcPath(s))}): ${s.desc}`).join('\n')}

## Cidades atendidas
${cities.map(c => `- [${c.name}, BA](${abs(cityPath(c))})`).join('\n')}

## Perguntas frequentes
${homeFaq.map(([q, a]) => `### ${q}\n${a}`).join('\n\n')}
`)

write('site.webmanifest', JSON.stringify({
  name: site.name, short_name: 'Viva', start_url: '/', display: 'standalone', background_color: '#f3f2ee', theme_color: '#0b0b0b',
  icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
}, null, 2))

console.log(`✓ ${pages.length + 1} páginas geradas em ${out}`)
