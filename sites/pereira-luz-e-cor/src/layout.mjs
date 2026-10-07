// Casca HTML de todas as páginas: <head> com SEO, topo, menu, rodapé,
// gaveta da lista de orçamento, busca e botão flutuante de WhatsApp.
import { site, esc, abs, wa, addressLine, hoursRows, directionsUrl, cx } from './lib.mjs'
import { icon } from './icons.mjs'

const year = new Date(site.contentDate).getFullYear()

const head = ({ path, title, description, ogImage, ogType, noindex, jsonld, assets, extraHead = '' }) => `
<meta charset="utf-8">
<script>document.documentElement.classList.replace('no-js','js')</script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${abs(path)}">
<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}">
<meta name="theme-color" content="#0b0b0b">
<meta name="color-scheme" content="dark light">
<meta name="format-detection" content="telephone=no">
<meta property="og:locale" content="pt_BR">
<meta property="og:type" content="${ogType || 'website'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${abs(path)}">
<meta property="og:image" content="${abs(ogImage)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${abs(ogImage)}">
<meta name="geo.region" content="BR-BA">
<meta name="geo.placename" content="${esc(site.address.city)}">
<meta name="geo.position" content="${site.geo.lat};${site.geo.lng}">
<meta name="ICBM" content="${site.geo.lat}, ${site.geo.lng}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/montserrat-latin-var-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${assets.css}">
${extraHead}
${jsonld}`

const megaMenu = (cats) => `
<div class="mega" id="mega-produtos" role="region" aria-label="Categorias de produtos">
  <div class="mega__grid">
    ${cats
      .map(
        (c) => `<a class="mega__item" href="/${c.slug}/">
      <span class="mega__icon">${icon(c.icon, { size: 22 })}</span>
      <span><strong>${esc(c.name)}</strong><small>${esc(c.groups.slice(0, 3).map((g) => g.name).join(' · '))}</small></span>
    </a>`,
      )
      .join('')}
  </div>
  <div class="mega__foot">
    <span>${icon('list', { size: 18 })} Monte sua lista e receba o orçamento no WhatsApp</span>
    <a href="/calculadora-de-tinta/" class="link-arrow">Calculadora de tinta ${icon('arrow', { size: 16 })}</a>
  </div>
</div>`

const header = (path, cats) => {
  const is = (p) => (path === p ? ' aria-current="page"' : p !== '/' && path.startsWith(p) ? ' aria-current="true"' : '')
  const inCats = cats.some((c) => path.startsWith(`/${c.slug}/`))
  return `
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
<div class="topbar" role="region" aria-label="Informações da loja">
  <div class="wrap topbar__in">
    <a class="topbar__addr" href="${directionsUrl()}" target="_blank" rel="noopener">${icon('pin', { size: 15 })}<span class="topbar__long">Loja nova · ${esc(site.address.street)} – ${esc(site.address.neighborhood)}, ${esc(site.address.city)}-${esc(site.address.state)}</span><span class="topbar__short">${esc(site.address.street.replace('Rua ', 'R. '))} · ${esc(site.address.neighborhood.replace('Jardim ', 'Jd. '))}</span></a>
    <span class="open-badge" data-open-badge>${icon('clock', { size: 15 })}<span>${esc(hoursRows()[0].label)}: ${esc(hoursRows()[0].value)}</span></span>
    <a class="topbar__wa" href="${wa()}" target="_blank" rel="noopener" data-track="wa-topbar">${icon('whatsapp', { size: 15 })}<span><span class="nw">${esc(site.phoneDisplay)}</span></span></a>
  </div>
</div>
<header class="hdr" data-hdr>
  <div class="wrap hdr__in">
    <a class="brand" href="/" aria-label="${esc(site.name)} — página inicial">
      <img src="/assets/img/logo-pereira-360.webp" alt="${esc(site.name)}" width="172" height="60">
      <span class="brand__sub">Luz <b>&amp;</b> Cor</span>
    </a>
    <nav class="nav" aria-label="Principal">
      <ul class="nav__list">
        <li class="nav__has-mega">
          <button class="nav__link${inCats ? ' is-active' : ''}" aria-expanded="false" aria-controls="mega-produtos" data-mega-toggle>Produtos ${icon('chevron', { size: 16 })}</button>
          ${megaMenu(cats)}
        </li>
        <li><a class="nav__link" href="/guias/"${is('/guias/')}>Guias</a></li>
        <li><a class="nav__link" href="/calculadora-de-tinta/"${is('/calculadora-de-tinta/')}>Calculadora de tinta</a></li>
        <li><a class="nav__link" href="/sobre/"${is('/sobre/')}>A loja</a></li>
        <li><a class="nav__link" href="/contato/"${is('/contato/')}>Contato</a></li>
      </ul>
    </nav>
    <div class="hdr__actions">
      <button class="icon-btn" data-search-open aria-label="Buscar produtos">${icon('search', { size: 21 })}</button>
      <button class="icon-btn icon-btn--list" data-list-open aria-label="Minha lista de orçamento">${icon('list', { size: 21 })}<span class="badge" data-list-count hidden>0</span></button>
      <a class="btn btn--wa btn--sm hdr__cta" href="${wa()}" target="_blank" rel="noopener" data-track="wa-header" aria-label="Orçamento pelo WhatsApp">${icon('whatsapp', { size: 18 })}<span>Orçamento</span></a>
      <button class="icon-btn hdr__burger" data-menu-open aria-label="Abrir menu" aria-expanded="false" aria-controls="menu-mobile">${icon('menu', { size: 24 })}</button>
    </div>
  </div>
</header>
<div class="mnav" id="menu-mobile" data-menu hidden>
  <div class="mnav__panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="mnav__top">
      <img src="/assets/img/logo-pereira-360.webp" alt="" width="140" height="49">
      <button class="icon-btn" data-menu-close aria-label="Fechar menu">${icon('x', { size: 24 })}</button>
    </div>
    <p class="mnav__label">Produtos</p>
    <div class="mnav__cats">
      ${cats.map((c) => `<a href="/${c.slug}/">${icon(c.icon, { size: 20 })}<span>${esc(c.shortName)}</span></a>`).join('')}
    </div>
    <ul class="mnav__links">
      <li><a href="/guias/">${icon('book', { size: 20 })}Guias e dicas</a></li>
      <li><a href="/calculadora-de-tinta/">${icon('calc', { size: 20 })}Calculadora de tinta</a></li>
      <li><a href="/perguntas-frequentes/">${icon('info', { size: 20 })}Perguntas frequentes</a></li>
      <li><a href="/sobre/">${icon('store', { size: 20 })}A loja</a></li>
      <li><a href="/contato/">${icon('pin', { size: 20 })}Contato e como chegar</a></li>
    </ul>
    <a class="btn btn--wa btn--block" href="${wa()}" target="_blank" rel="noopener" data-track="wa-menu">${icon('whatsapp', { size: 20 })}Chamar no WhatsApp</a>
  </div>
</div>`
}

const footer = (cats, guides) => `
<footer class="ftr">
  <div class="hazard hazard--thin" aria-hidden="true"></div>
  <div class="wrap ftr__grid">
    <div class="ftr__brand">
      <img src="/assets/img/logo-pereira-360.webp" alt="${esc(site.name)}" width="200" height="70" loading="lazy">
      <p>${esc(site.name)} — ${esc(site.tagline.toLowerCase())}, hidráulica e ferragens no bairro ${esc(site.address.neighborhood)}, em ${esc(site.address.city)}-${esc(site.address.state)}.</p>
      <div class="ftr__social">
        ${site.social.instagram ? `<a href="${site.social.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a>` : ''}
        ${site.social.facebook ? `<a href="${site.social.facebook}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a>` : ''}
        <a href="${wa()}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>
      </div>
    </div>
    <div>
      <p class="ftr__title">Produtos</p>
      <ul class="ftr__list">${cats.map((c) => `<li><a href="/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul>
    </div>
    <div>
      <p class="ftr__title">Guias populares</p>
      <ul class="ftr__list">${guides.slice(0, 6).map((g) => `<li><a href="/guias/${g.slug}/">${esc(g.navTitle || g.title)}</a></li>`).join('')}
        <li><a href="/calculadora-de-tinta/">Calculadora de tinta</a></li>
        <li><a href="/perguntas-frequentes/">Perguntas frequentes</a></li>
      </ul>
    </div>
    <div class="ftr__nap">
      <p class="ftr__title">Visite a loja</p>
      <p class="ftr__line">${icon('pin', { size: 18 })}<span>${esc(addressLine())}</span></p>
      <p class="ftr__line">${icon('whatsapp', { size: 18 })}<a href="${wa()}" target="_blank" rel="noopener"><span class="nw">${esc(site.phoneDisplay)}</span></a></p>
      <div class="ftr__line">${icon('clock', { size: 18 })}<ul class="ftr__hours">${hoursRows().map((r) => `<li><span>${esc(r.label)}</span><span>${esc(r.value)}</span></li>`).join('')}</ul></div>
      <a class="btn btn--ghost btn--sm" href="${directionsUrl()}" target="_blank" rel="noopener">${icon('route', { size: 16 })}Como chegar</a>
    </div>
  </div>
  <div class="wrap ftr__area">
    <p><strong>Atendemos ${esc(site.address.city)} e região:</strong> ${esc(site.areaServed.slice(1).join(', '))}.</p>
  </div>
  <div class="wrap ftr__bottom">
    <p>© ${year} ${esc(site.name)}${site.cnpj ? ` · CNPJ ${esc(site.cnpj)}` : ''}. Todos os direitos reservados.</p>
    <p><button type="button" class="motion-btn" data-motion-toggle aria-pressed="false">Pausar animações</button> · <a href="/sobre/">A loja</a> · <a href="/contato/">Contato</a> · <a href="/perguntas-frequentes/">Dúvidas</a>${site.agency.name ? ` · Site por <a href="${site.agency.url}" target="_blank" rel="noopener">${esc(site.agency.name)}</a>` : ''}</p>
  </div>
</footer>`

const overlays = () => `
<a class="fab-wa" href="${wa()}" target="_blank" rel="noopener" aria-label="Falar no WhatsApp" data-track="wa-fab">${icon('whatsapp', { size: 30 })}<span class="fab-wa__tip">Fale com a gente</span></a>
<button class="fab-list" data-list-open hidden>${icon('list', { size: 22 })}<span>Minha lista</span><b data-list-count>0</b><span class="sr-only"> itens</span></button>

<div class="drawer" data-list hidden>
  <div class="drawer__scrim" data-list-close></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="lista-titulo">
    <div class="drawer__head">
      <div>
        <p class="eyebrow">${icon('list', { size: 16 })} Orçamento pelo WhatsApp</p>
        <h2 id="lista-titulo">Minha lista de material</h2>
      </div>
      <button class="icon-btn" data-list-close aria-label="Fechar lista">${icon('x', { size: 24 })}</button>
    </div>
    <div class="drawer__body">
      <ul class="qlist" data-list-items></ul>
      <div class="qlist__empty" data-list-empty>
        ${icon('list', { size: 40 })}
        <p><strong>Sua lista está vazia.</strong><br>Toque no <b>+</b> dos produtos ou busque o que precisa. Depois é só mandar tudo de uma vez no WhatsApp.</p>
        <button class="btn btn--yellow btn--sm" data-search-open>${icon('search', { size: 16 })}Buscar produto</button>
      </div>
      <form class="qadd" data-list-addform>
        <label for="qadd-input" class="sr-only">Adicionar item à lista</label>
        <input id="qadd-input" name="item" placeholder="Adicionar outro item (ex.: fio 4 mm, 50 m)" autocomplete="off">
        <button class="icon-btn" aria-label="Adicionar">${icon('plus', { size: 20 })}</button>
      </form>
      <label class="qnote">
        <span>Observações (marca, cor, medida, voltagem…)</span>
        <textarea data-list-note rows="2" placeholder="Ex.: tinta branco neve, chuveiro 220 V"></textarea>
      </label>
    </div>
    <div class="drawer__foot">
      <button class="btn btn--wa btn--block btn--lg" data-list-send>${icon('whatsapp', { size: 22 })}Enviar lista no WhatsApp</button>
      <button class="link-btn" data-list-clear>${icon('trash', { size: 15 })}Limpar lista</button>
      <button class="link-btn" data-list-undo hidden>Desfazer limpeza</button>
    </div>
  </div>
</div>

<div class="search" data-search hidden>
  <div class="search__scrim" data-search-close></div>
  <div class="search__panel" role="dialog" aria-modal="true" aria-label="Buscar produtos">
    <div class="search__bar">
      ${icon('search', { size: 22 })}
      <input type="search" data-search-input placeholder="O que você precisa? Ex.: disjuntor 40 A" aria-label="Buscar produtos" autocomplete="off" enterkeyhint="search">
      <button class="icon-btn" data-search-close aria-label="Fechar busca">${icon('x', { size: 22 })}</button>
    </div>
    <div class="search__results" data-search-results></div>
    <p class="sr-only" role="status" data-search-status></p>
  </div>
</div>
<div class="toast" data-toast role="status" aria-live="polite"></div>`

export const siteData = (ctx = {}) =>
  JSON.stringify({
    name: site.name,
    wa: site.whatsapp,
    tz: site.timezone,
    hours: site.hours,
    phone: site.phoneDisplay,
    searchV: ctx.searchV,
  })

/**
 * Página completa.
 */
export const layout = (o) => {
  const { path, body, ctx, bodyClass = '' } = o
  return `<!doctype html>
<html lang="pt-BR" class="no-js">
<head>${head({ ...o, assets: ctx.assets })}
</head>
<body class="${cx(bodyClass)}">
${header(path, ctx.categories)}
<main id="conteudo">
${body}
</main>
${footer(ctx.categories, ctx.guides)}
${overlays()}
<script type="application/json" id="site-data">${siteData(ctx)}</script>
<script src="${ctx.assets.js}" defer></script>
</body>
</html>
`
}
