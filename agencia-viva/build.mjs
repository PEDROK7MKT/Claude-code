// Gera o site estático da Agência Viva em ./site
// Uso: node build.mjs   (sem dependências)
import { mkdirSync, writeFileSync, cpSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { site, wa, services, cities, testimonials, homeFaq } from './src/data.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const out = join(root, 'site')
const today = new Date().toISOString().slice(0, 10)

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const abs = p => site.url + p
const cityPath = c => `/agencia-de-marketing-em-${c.slug}/`
const svcPath = s => `/servicos/${s.slug}/`
const A = site.address
const addrLine = `${A.street} - ${A.district}, ${A.city} - ${A.state}, ${A.zip}`

// ─── Ícones ──────────────────────────────────────────────────
const ic = {
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  window: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
}
const icon = (n, cls = '') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic[n]}</svg>`
const waIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>'

// ─── Schema.org ──────────────────────────────────────────────
const bizId = site.url + '/#agencia'
const business = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  '@id': bizId,
  name: site.name,
  legalName: site.legalName,
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
  sameAs: [site.instagram],
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

// ─── Blocos reutilizáveis ────────────────────────────────────
const crumbsHtml = items => `<nav aria-label="Você está em"><ol class="crumbs">${items
  .map(([n, p], i) => (i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${p}">${esc(n)}</a></li>`)).join('')}</ol></nav>`

const faqHtml = faq => `<div class="faq">${faq.map(([q, a], i) => `
  <details class="rv" style="--d:${i * 0.05}s"${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><div class="ans"><p>${esc(a)}</p></div></details>`).join('')}
</div>`

const serviceCards = (list = services) => `<div class="cards">${list.map((s, i) => `
  <a class="card rv" style="--d:${(i % 3) * 0.08}s" href="${svcPath(s)}">
    <span class="ico">${icon(s.icon)}</span>
    <h3>${esc(s.short)}</h3>
    <p>${esc(s.desc.split('. ')[0])}.</p>
    <span class="more">Saiba mais ${icon('arrow')}</span>
  </a>`).join('')}
</div>`

const finalCta = (title = 'Bora deixar a sua marca viva?', text = 'Conte pra gente sobre a sua empresa. Em poucos minutos a gente mostra onde está o dinheiro que você está deixando na mesa.') => `
<section class="sec" aria-labelledby="cta-final">
  <div class="wrap">
    <div class="final rv">
      <h2 id="cta-final">${title}</h2>
      <p>${text}</p>
      <div class="cta-row">
        <a class="btn btn--lg" href="${wa()}" target="_blank" rel="noopener">${waIcon} Chamar no WhatsApp</a>
        <a class="btn btn--ghost btn--lg" href="${site.instagram}" target="_blank" rel="noopener">Ver o Instagram</a>
      </div>
    </div>
  </div>
</section>`

// Mapa estilizado do Oeste baiano com as cidades atendidas
const bounds = { w: -46.0, e: -43.2, n: -10.9, s: -13.5 }
// posição do rótulo de cada cidade no mapa, para não encavalar
const labelPos = { 'luis-eduardo-magalhaes': ['middle', 0, -20], correntina: ['end', -14, 6], 'bom-jesus-da-lapa': ['end', 8, -18] }
const W = 800, H = 640
const proj = ({ lat, lng }) => [
  Math.round(((lng - bounds.w) / (bounds.e - bounds.w)) * (W - 120) + 60),
  Math.round(((bounds.n - lat) / (bounds.n - bounds.s)) * (H - 100) + 50),
]
const mapSvg = () => {
  const main = cities.find(c => c.main)
  const [mx, my] = proj(main.geo)
  const links = cities.filter(c => !c.main).map(c => { const [x, y] = proj(c.geo); return `<line class="link" x1="${mx}" y1="${my}" x2="${x}" y2="${y}"/>` }).join('')
  const dots = cities.map(c => {
    const [x, y] = proj(c.geo)
    const [anchor, dx, dy] = labelPos[c.slug] || ['start', 14, 6]
    return `<a href="${cityPath(c)}" aria-label="Marketing digital em ${esc(c.name)}">
      ${c.main ? `<circle class="pulse" cx="${x}" cy="${y}" r="10"/>` : ''}
      <circle class="dot${c.main ? ' dot--main' : ''}" cx="${x}" cy="${y}" r="${c.main ? 11 : 7}"/>
      <text x="${x + dx}" y="${y + dy}" text-anchor="${anchor}"${c.main ? ' class="main"' : ''}>${esc(c.name)}</text></a>`
  }).join('')
  return `<div class="map-wrap rv"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa do Oeste da Bahia com as cidades atendidas pela Agência Viva">
    <path class="river" d="M30 ${my + 14} C 150 ${my - 30}, 230 ${my + 20}, ${mx} ${my} S 520 ${my - 110}, 700 ${my - 150}"/>
    <path class="river" d="M740 20 C 700 180, 730 360, 690 ${H - 90} S 700 ${H - 20}, 710 ${H}"/>
    ${links}${dots}
  </svg></div>`
}

// ─── Layout ──────────────────────────────────────────────────
const nav = [['Serviços', '/servicos/'], ['Cidades', '/#cidades'], ['Sobre', '/sobre/'], ['Contato', '/contato/']]
const layout = ({ path, title, desc, body, ld = [], active = '' }) => `<!doctype html>
<html lang="pt-BR" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(path)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#0d0a12">
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
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/logo-viva.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="/assets/viva.css">
${[business, website, ...ld].map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>
<body>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<header class="hdr">
  <div class="wrap">
    <a class="logo" href="/" aria-label="${esc(site.name)} — página inicial"><img src="/assets/logo-viva.png" alt="Agência Viva — Agência de Marketing em Barreiras" width="934" height="432"></a>
    <button class="burger" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu"><span></span><span></span><span></span></button>
    <nav class="nav" id="menu" aria-label="Principal">
      ${nav.map(([n, p]) => `<a href="${p}"${active === p ? ' aria-current="page"' : ''}>${n}</a>`).join('')}
      <a class="btn" href="${wa()}" target="_blank" rel="noopener">${waIcon} Orçamento</a>
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
        <img src="/assets/logo-viva.png" alt="Agência Viva" width="934" height="432" loading="lazy">
        <p style="color:var(--muted);max-width:34ch">Agência de marketing digital em Barreiras - BA, atendendo todo o Oeste da Bahia.</p>
      </div>
      <div>
        <h4>Serviços</h4>
        <ul>${services.map(s => `<li><a href="${svcPath(s)}">${esc(s.short)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>Cidades</h4>
        <ul>${cities.map(c => `<li><a href="${cityPath(c)}">${esc(c.name)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>Fale com a gente</h4>
        <address>
          <strong style="color:var(--text)">${esc(site.name)}</strong><br>
          ${esc(A.street)} - ${esc(A.district)}<br>
          ${esc(A.city)} - ${esc(A.state)}, ${esc(A.zip)}<br><br>
          <a href="${wa()}" target="_blank" rel="noopener">${esc(site.phoneDisplay)}</a><br>
          <a href="mailto:${esc(site.email)}">${esc(site.email)}</a><br>
          <a href="${site.instagram}" target="_blank" rel="noopener">${esc(site.instagramHandle)}</a><br>
          ${esc(site.hoursDisplay)}<br>
          <a href="${site.mapsUrl}" target="_blank" rel="noopener">Ver no Google Maps →</a>
        </address>
      </div>
    </div>
    <p class="giant" aria-hidden="true">VIVA!</p>
    <div class="ftr-bottom">
      <span>© ${new Date().getFullYear()} ${esc(site.name)} · Agência de Marketing em Barreiras - BA</span>
      <span>Feito com energia no Oeste da Bahia</span>
    </div>
  </div>
</footer>
<a class="wa-float" href="${wa()}" target="_blank" rel="noopener" aria-label="Falar com a Agência Viva no WhatsApp">${waIcon}</a>
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
  title: 'Agência de Marketing em Barreiras - BA | Agência Viva — Oeste da Bahia',
  desc: 'Agência Viva: agência de marketing digital em Barreiras - BA. Tráfego pago, social media, sites e Google Meu Negócio para empresas de Barreiras, LEM e todo o Oeste da Bahia.',
  ld: [faqLd(homeFaq)],
  body: `
<section class="hero">
  <div class="blobs" aria-hidden="true"><span class="blob blob--1"></span><span class="blob blob--2"></span><span class="blob blob--3"></span></div>
  <div class="wrap">
    <span class="eyebrow rv">Agência de marketing · Barreiras - BA</span>
    <h1 class="rv" style="--d:.08s">Agência de marketing em Barreiras que deixa sua marca <em class="grad">viva.</em></h1>
    <p class="sub rv" style="--d:.16s">Sua empresa aparecendo e vendendo
      <span class="rotator" aria-hidden="true"><span class="on">no Google.</span><span>no Instagram.</span><span>no WhatsApp.</span><span>no Maps.</span></span>
      <span class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">no Google, no Instagram, no WhatsApp e no Maps.</span>
      <strong>Estratégia, conteúdo e anúncios</strong> para quem empreende no Oeste da Bahia.</p>
    <div class="cta-row rv" style="--d:.24s">
      <a class="btn btn--lg" href="${wa()}" target="_blank" rel="noopener">${waIcon} Quero crescer agora</a>
      <a class="btn btn--ghost btn--lg" href="/servicos/">Ver serviços</a>
    </div>
    <div class="hero-meta rv" style="--d:.32s">
      <div><b data-count="${cities.length}">${cities.length}</b><span>cidades do Oeste atendidas</span></div>
      <div><b data-count="300" data-suf="mil+">300mil+</b><span>seguidores na rede da nossa fundadora</span></div>
      <div><b data-count="${services.length}">${services.length}</b><span>frentes de serviço integradas</span></div>
    </div>
  </div>
  <span class="scroll-cue" aria-hidden="true"></span>
</section>

<div class="marquee" aria-hidden="true"><div class="marquee__track">${[0, 1].map(() => `<span>${['Tráfego Pago', 'Social Media', 'Google Maps', 'Sites', 'Branding', 'Reels', 'Influência'].map(t => `${t} <i>✦</i>`).join(' ')}</span>`).join('')}</div></div>

<section class="sec" aria-label="Manifesto">
  <div class="wrap">
    <span class="eyebrow rv">Por que existimos</span>
    <p class="manifesto" style="margin-top:28px">Tem empresa boa demais em Barreiras que o cliente simplesmente não encontra. A gente existe para mudar isso: marca viva, perfil vivo, telefone tocando.</p>
  </div>
</section>

<section class="sec" id="servicos" aria-labelledby="h-serv" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head">
      <div><span class="eyebrow rv">O que fazemos</span><h2 id="h-serv" class="rv">Marketing completo, <span class="grad">do post à venda.</span></h2></div>
      <p class="rv">Tudo que uma empresa do Oeste baiano precisa para ser encontrada, lembrada e escolhida — num só lugar, com uma equipe que conhece a cidade.</p>
    </div>
    ${serviceCards()}
  </div>
</section>

<section class="sec" aria-labelledby="h-met" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head">
      <div><span class="eyebrow rv">Como trabalhamos</span><h2 id="h-met" class="rv">Um método simples. <span class="grad">Resultado medido.</span></h2></div>
      <p class="rv">Nada de "postar por postar". Cada ação tem objetivo, número e dono.</p>
    </div>
    <div class="steps">
      ${[
        ['Diagnóstico', 'Olhamos o seu negócio, o seu Instagram, o seu Google e os seus concorrentes em Barreiras.'],
        ['Estratégia', 'Definimos metas, público, oferta e os canais que dão mais retorno para você.'],
        ['Execução', 'Conteúdo, anúncios, site e Google Maps rodando no ritmo certo, todo mês.'],
        ['Resultado', 'Relatório claro de contatos, vendas e custo. Ajustamos o que precisa.'],
      ].map(([t, d], i) => `<div class="step rv" style="--d:${i * 0.08}s"><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>

<section class="sec" aria-labelledby="h-why" style="padding-top:0">
  <div class="wrap split">
    <div>
      <span class="eyebrow rv">Por que a Viva</span>
      <h2 id="h-why" class="rv">Força comercial <span class="grad">+</span> operação afiada.</h2>
      <p class="lede rv">A Agência Viva une quem entende de gente e influência no Oeste da Bahia com uma operação de marketing técnica, organizada e obcecada por resultado.</p>
      <ul class="ticks rv">
        <li>Equipe local: conhecemos Barreiras, o comércio e o agro da região</li>
        <li>Rede de influência com centenas de milhares de seguidores</li>
        <li>Operação de tráfego, sites e SEO com processo e relatório</li>
        <li>Atendimento direto no WhatsApp, sem burocracia</li>
      </ul>
    </div>
    <div class="stack">
      <div class="pill-card rv"><b>01</b><span><strong style="color:var(--text)">Local de verdade.</strong> Sabemos o que o cliente de Barreiras pesquisa, onde ele está e como ele compra.</span></div>
      <div class="pill-card rv" style="--d:.08s"><b>02</b><span><strong style="color:var(--text)">Influência que vende.</strong> Conteúdo com rosto e voz de quem o Oeste já acompanha.</span></div>
      <div class="pill-card rv" style="--d:.16s"><b>03</b><span><strong style="color:var(--text)">Dados no centro.</strong> Cada real investido tem retorno acompanhado.</span></div>
    </div>
  </div>
</section>

<section class="sec" id="cidades" aria-labelledby="h-cid" style="padding-top:0">
  <div class="wrap split">
    <div>
      <span class="eyebrow rv">Onde atuamos</span>
      <h2 id="h-cid" class="rv">De Barreiras para <span class="grad">todo o Oeste baiano.</span></h2>
      <p class="lede rv">Nossa base é Barreiras, e a nossa área é o Oeste da Bahia inteiro: do agro de Luís Eduardo Magalhães e Formosa do Rio Preto ao comércio de Correntina e Santa Maria da Vitória.</p>
      <div class="city-list rv">${cities.map(c => `<a href="${cityPath(c)}">${esc(c.name)}</a>`).join('')}</div>
    </div>
    ${mapSvg()}
  </div>
</section>

${testimonials.length ? `<section class="sec" aria-labelledby="h-dep" style="padding-top:0"><div class="wrap">
  <div class="sec-head"><div><span class="eyebrow rv">Quem já está vivo</span><h2 id="h-dep" class="rv">O que dizem nossos clientes</h2></div></div>
  <div class="quotes">${testimonials.map(t => `<figure class="quote rv"><blockquote><p>“${esc(t.text)}”</p></blockquote><figcaption><cite>${esc(t.name)} — ${esc(t.company)}</cite></figcaption></figure>`).join('')}</div>
</div></section>` : ''}

<section class="sec" aria-labelledby="h-faq" style="padding-top:0">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow rv">Perguntas frequentes</span><h2 id="h-faq" class="rv">Dúvidas sobre marketing em Barreiras</h2></div></div>
    ${faqHtml(homeFaq)}
  </div>
</section>
${finalCta()}`,
})

// Índice de serviços
page({
  path: '/servicos/',
  active: '/servicos/',
  title: 'Serviços de Marketing Digital em Barreiras - BA | Agência Viva',
  desc: 'Tráfego pago, social media, criação de sites, SEO local, identidade visual e produção de vídeo para empresas de Barreiras e do Oeste da Bahia.',
  ld: [crumbsLd([['Início', '/'], ['Serviços', '/servicos/']])],
  body: `
<section class="hero hero--inner">
  <div class="blobs" aria-hidden="true"><span class="blob blob--1"></span><span class="blob blob--3"></span></div>
  <div class="wrap">
    ${crumbsHtml([['Início', '/'], ['Serviços', '/servicos/']])}
    <h1 class="rv">Serviços de marketing digital em <span class="grad">Barreiras - BA</span></h1>
    <p class="sub rv" style="--d:.1s">Escolha uma frente ou deixe a gente cuidar de tudo. Os serviços conversam entre si — e é aí que o resultado aparece.</p>
  </div>
</section>
<section class="sec" style="padding-top:0"><div class="wrap">${serviceCards()}</div></section>
${finalCta()}`,
})

// Páginas de serviço
for (const s of services) {
  const others = services.filter(o => o !== s).slice(0, 3)
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
        '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: s.name, description: s.desc, url: abs(svcPath(s)),
        provider: { '@id': bizId },
        areaServed: cities.map(c => ({ '@type': 'City', name: `${c.name}, Bahia` })),
      },
    ],
    body: `
<section class="hero hero--inner">
  <div class="blobs" aria-hidden="true"><span class="blob blob--1"></span><span class="blob blob--2"></span></div>
  <div class="wrap">
    ${crumbsHtml(crumbs)}
    <h1 class="rv">${esc(s.name)} em <span class="grad">Barreiras - BA</span></h1>
    <p class="sub rv" style="--d:.1s">${esc(s.lead)}</p>
    <div class="cta-row rv" style="--d:.2s"><a class="btn btn--lg" href="${wa(`Olá, Agência Viva! Quero saber mais sobre ${s.name}.`)}" target="_blank" rel="noopener">${waIcon} Pedir orçamento</a></div>
  </div>
</section>
<section class="sec" style="padding-top:0">
  <div class="wrap two">
    <div class="prose">
      <h2 class="rv" style="margin-top:0">O que está incluso</h2>
      <ul class="ticks rv">${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      <h2 class="rv">Por que investir em ${esc(s.short.toLowerCase())} no Oeste da Bahia</h2>
      <p class="rv">Barreiras, Luís Eduardo Magalhães e as cidades vizinhas vivem um crescimento puxado pelo agronegócio, e o comércio e os serviços crescem junto. Com mais concorrência, quem se posiciona primeiro no digital fica com a atenção do cliente. É por isso que o trabalho de ${esc(s.kw)} precisa conhecer a região: o horário em que as pessoas compram, os bairros, a linguagem e o calendário local — da safra às festas da cidade.</p>
      <p class="rv">A Agência Viva atende empresas de ${cities.map(c => esc(c.name)).join(', ').replace(/, ([^,]*)$/, ' e $1')}, com a mesma dedicação.</p>
    </div>
    <aside class="aside rv">
      <h3>Vamos conversar?</h3>
      <p>Diagnóstico gratuito do seu ${s.slug.includes('site') ? 'site' : 'digital'} em até 24 horas úteis.</p>
      <a class="btn" href="${wa(`Olá, Agência Viva! Quero um diagnóstico de ${s.short}.`)}" target="_blank" rel="noopener">${waIcon} Falar no WhatsApp</a>
    </aside>
  </div>
</section>
<section class="sec" style="padding-top:0" aria-labelledby="h-etapas">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow rv">Etapas</span><h2 id="h-etapas" class="rv">Como funciona</h2></div></div>
    <div class="steps">${s.steps.map((t, i) => `<div class="step rv" style="--d:${i * 0.08}s"><h3>${esc(t)}</h3></div>`).join('')}</div>
  </div>
</section>
<section class="sec" style="padding-top:0" aria-labelledby="h-faq">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow rv">Perguntas frequentes</span><h2 id="h-faq" class="rv">Dúvidas sobre ${esc(s.short.toLowerCase())}</h2></div></div>
    ${faqHtml(s.faq)}
  </div>
</section>
<section class="sec" style="padding-top:0" aria-labelledby="h-mais">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow rv">Combine com</span><h2 id="h-mais" class="rv">Outros serviços</h2></div></div>
    ${serviceCards(others)}
  </div>
</section>
${finalCta()}`,
  })
}

// Páginas de cidade (SEO local)
for (const c of cities) {
  const crumbs = [['Início', '/'], [`Marketing em ${c.name}`, cityPath(c)]]
  const faq = [
    [`Vocês atendem empresas em ${c.name}?`, c.main
      ? 'Sim, Barreiras é a nossa base. Atendemos presencialmente e pelo WhatsApp, com reuniões na sua empresa quando precisar.'
      : `Sim. ${c.name} fica ${c.dist}, e atendemos empresas da cidade com gestão remota e visitas presenciais para reuniões e produção de conteúdo.`],
    [`Quanto custa marketing digital em ${c.name}?`, 'Os planos variam conforme o escopo: social media, tráfego pago, site ou um pacote completo. Montamos uma proposta que cabe na realidade da sua empresa. Chame no WhatsApp para um diagnóstico gratuito.'],
    [`Como aparecer no Google Maps em ${c.name}?`, `Com um Perfil da Empresa no Google completo e otimizado para ${c.name}: categoria certa, fotos reais, avaliações de clientes, posts frequentes e dados consistentes em todos os canais. É o nosso serviço de SEO Local.`],
  ]
  const others = cities.filter(o => o !== c)
  page({
    path: cityPath(c),
    title: c.main
      ? 'Agência de Marketing Digital em Barreiras - BA | Agência Viva'
      : `Agência de Marketing em ${c.name} - BA | Agência Viva`,
    desc: `Marketing digital em ${c.name} - BA: tráfego pago, Instagram, sites e Google Meu Negócio para empresas${c.main ? ' de Barreiras' : ` de ${c.name}`}. Agência Viva, do Oeste da Bahia.`,
    ld: [crumbsLd(crumbs), faqLd(faq)],
    body: `
<section class="hero hero--inner">
  <div class="blobs" aria-hidden="true"><span class="blob blob--1"></span><span class="blob blob--2"></span><span class="blob blob--3"></span></div>
  <div class="wrap">
    ${crumbsHtml(crumbs)}
    <span class="eyebrow rv">${c.main ? 'Nossa casa' : `Oeste da Bahia · ${esc(c.dist)}`}</span>
    <h1 class="rv" style="--d:.05s">Agência de marketing em <span class="grad">${esc(c.name)}</span></h1>
    <p class="sub rv" style="--d:.1s">${esc(c.intro)}</p>
    <div class="cta-row rv" style="--d:.2s"><a class="btn btn--lg" href="${wa(`Olá, Agência Viva! Tenho uma empresa em ${c.name} e quero crescer no digital.`)}" target="_blank" rel="noopener">${waIcon} Falar com a Viva</a></div>
  </div>
</section>
<section class="sec" style="padding-top:0">
  <div class="wrap two">
    <div class="prose">
      <h2 class="rv" style="margin-top:0">Marketing digital pensado para ${esc(c.name)}</h2>
      <p class="rv">${esc(c.angle)}</p>
      <p class="rv">A Agência Viva cuida das três frentes que mais trazem cliente para empresas locais: <a href="${svcPath(services[3])}">aparecer no Google Maps</a>, ter um <a href="${svcPath(services[1])}">Instagram profissional</a> e rodar <a href="${svcPath(services[0])}">anúncios que chamam no WhatsApp</a>. Quando faz sentido, completamos com <a href="${svcPath(services[2])}">site próprio</a>, <a href="${svcPath(services[4])}">identidade visual</a> e <a href="${svcPath(services[5])}">produção de vídeo</a>.</p>
      <h2 class="rv">Segmentos que atendemos em ${esc(c.name)}</h2>
      <ul class="tags rv">${c.niches.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
    </div>
    <aside class="aside rv">
      <h3>Diagnóstico gratuito</h3>
      <p>Analisamos o Google, o Instagram e os concorrentes da sua empresa em ${esc(c.name)} e mostramos onde estão as oportunidades.</p>
      <a class="btn" href="${wa(`Olá! Quero o diagnóstico gratuito para minha empresa em ${c.name}.`)}" target="_blank" rel="noopener">${waIcon} Quero meu diagnóstico</a>
    </aside>
  </div>
</section>
<section class="sec" style="padding-top:0" aria-labelledby="h-serv">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow rv">Serviços</span><h2 id="h-serv" class="rv">O que fazemos em ${esc(c.name)}</h2></div></div>
    ${serviceCards()}
  </div>
</section>
<section class="sec" style="padding-top:0" aria-labelledby="h-faq">
  <div class="wrap">
    <div class="sec-head"><div><span class="eyebrow rv">Perguntas frequentes</span><h2 id="h-faq" class="rv">Marketing em ${esc(c.name)}: dúvidas</h2></div></div>
    ${faqHtml(faq)}
    <h2 class="rv" style="font-size:28px;margin:70px 0 0">Também atendemos</h2>
    <div class="city-list rv">${others.map(o => `<a href="${cityPath(o)}">${esc(o.name)}</a>`).join('')}</div>
  </div>
</section>
${finalCta(`Sua empresa viva em ${esc(c.name)}.`)}`,
  })
}

// Sobre
page({
  path: '/sobre/',
  active: '/sobre/',
  title: 'Sobre a Agência Viva | Agência de Marketing do Oeste da Bahia',
  desc: 'Conheça a Agência Viva, agência de marketing de Barreiras - BA que une influência, estratégia e operação para fazer empresas do Oeste da Bahia crescerem.',
  ld: [crumbsLd([['Início', '/'], ['Sobre', '/sobre/']])],
  body: `
<section class="hero hero--inner">
  <div class="blobs" aria-hidden="true"><span class="blob blob--1"></span><span class="blob blob--3"></span></div>
  <div class="wrap">
    ${crumbsHtml([['Início', '/'], ['Sobre', '/sobre/']])}
    <h1 class="rv">Nascemos no Oeste. <span class="grad">Pensamos grande.</span></h1>
    <p class="sub rv" style="--d:.1s">A Agência Viva é uma agência de marketing de Barreiras - BA criada para dar às empresas da região a mesma força digital das grandes marcas.</p>
  </div>
</section>
<section class="sec" style="padding-top:0">
  <div class="wrap two">
    <div class="prose">
      <h2 class="rv" style="margin-top:0">Quem somos</h2>
      <p class="rv">A Viva nasceu da vivência de quem cria conteúdo no Oeste da Bahia e reúne uma comunidade de centenas de milhares de seguidores. Sabemos, na prática, o que prende a atenção das pessoas da região — e o que faz elas comprarem.</p>
      <p class="rv">Para transformar atenção em venda, juntamos essa força comercial e de influência a uma operação técnica de marketing: gestão de tráfego, sites, SEO local e processos de acompanhamento com metas e relatórios.</p>
      <h2 class="rv">No que acreditamos</h2>
      <ul class="ticks rv">
        <li>Marketing bom é o que aparece no caixa, não só nas curtidas</li>
        <li>Empresa do interior merece estratégia de capital</li>
        <li>Transparência: você sabe o que foi feito e quanto rendeu</li>
        <li>Proximidade: atendimento humano, direto e rápido</li>
      </ul>
    </div>
    <aside class="aside rv">
      <h3>Base em Barreiras</h3>
      <p>${esc(addrLine)}<br>${esc(site.hoursDisplay)}</p>
      <a class="btn" href="${wa()}" target="_blank" rel="noopener">${waIcon} Falar com a gente</a>
    </aside>
  </div>
</section>
${finalCta()}`,
})

// Contato
page({
  path: '/contato/',
  active: '/contato/',
  title: 'Contato | Agência Viva — Marketing em Barreiras - BA',
  desc: `Fale com a Agência Viva pelo WhatsApp ${site.phoneDisplay}. Agência de marketing em Barreiras - BA atendendo todo o Oeste da Bahia.`,
  ld: [crumbsLd([['Início', '/'], ['Contato', '/contato/']])],
  body: `
<section class="hero hero--inner">
  <div class="blobs" aria-hidden="true"><span class="blob blob--1"></span><span class="blob blob--2"></span></div>
  <div class="wrap">
    ${crumbsHtml([['Início', '/'], ['Contato', '/contato/']])}
    <h1 class="rv">Bora <span class="grad">conversar?</span></h1>
    <p class="sub rv" style="--d:.1s">O caminho mais rápido é o WhatsApp. Respondemos em horário comercial, normalmente em poucos minutos.</p>
    <div class="cta-row rv" style="--d:.2s">
      <a class="btn btn--lg" href="${wa()}" target="_blank" rel="noopener">${waIcon} ${esc(site.phoneDisplay)}</a>
      <a class="btn btn--ghost btn--lg" href="${site.instagram}" target="_blank" rel="noopener">${esc(site.instagramHandle)}</a>
    </div>
  </div>
</section>
<section class="sec" style="padding-top:0">
  <div class="wrap split">
    <div class="prose">
      <h2 class="rv" style="margin-top:0">Onde estamos</h2>
      <address class="rv" style="font-style:normal;color:#d9d0dd">
        <strong>${esc(site.name)}</strong><br>${esc(addrLine)}<br><br>
        ${esc(site.hoursDisplay)}<br>
        <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>
      </address>
      <p class="rv" style="margin-top:24px"><a class="btn btn--ghost" href="${site.mapsUrl}" target="_blank" rel="noopener">Abrir no Google Maps</a></p>
    </div>
    ${mapSvg()}
  </div>
</section>`,
})

// 404
const notFound = layout({
  path: '/404.html',
  title: 'Página não encontrada | Agência Viva',
  desc: 'Esta página não existe.',
  body: `<section class="hero"><div class="blobs" aria-hidden="true"><span class="blob blob--1"></span><span class="blob blob--2"></span></div>
  <div class="wrap"><span class="eyebrow">Erro 404</span><h1>Essa página <span class="grad">sumiu do mapa.</span></h1>
  <p class="sub">Mas a sua empresa não precisa sumir. Volte para o início ou chame a gente.</p>
  <div class="cta-row"><a class="btn btn--lg" href="/">Voltar ao início</a><a class="btn btn--ghost btn--lg" href="${wa()}" target="_blank" rel="noopener">WhatsApp</a></div></div></section>`,
}).replace('index, follow, max-image-preview:large', 'noindex')

// ─── Escrita ─────────────────────────────────────────────────
rmSync(out, { recursive: true, force: true })
cpSync(join(root, 'public'), out, { recursive: true })
const write = (p, s) => { const f = join(out, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s) }

for (const p of pages) write(p.path.endsWith('/') ? p.path + 'index.html' : p.path, layout(p))
write('404.html', notFound)

write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${abs(p.path)}</loc><lastmod>${today}</lastmod><priority>${p.path === '/' ? '1.0' : p.path.includes('barreiras') ? '0.9' : '0.7'}</priority></url>`).join('\n')}
</urlset>
`)
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs('/sitemap.xml')}\n`)

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
  name: site.name, short_name: 'Viva', start_url: '/', display: 'standalone', background_color: '#0d0a12', theme_color: '#0d0a12',
  icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }],
}, null, 2))

console.log(`✓ ${pages.length + 1} páginas geradas em ${out}`)
