// Páginas do site. Cada função devolve { path, title, description, body, jsonld, ... }.
import { site, esc, wa, abs, addressLine, hoursRows, hoursText, directionsUrl, fmtDatePt, slugify, stripTags } from './lib.mjs'
import { icon } from './icons.mjs'
import {
  breadcrumb, sectionHead, addChip, categoryCard, guideCard, faqList, hoursList, mapBlock, ctaBand,
  paintCalculator, toc,
} from './components.mjs'
import { storeEntity, websiteEntity, webPage, breadcrumbList, faqPage, article, howTo, itemList, jsonld } from './schema.mjs'

const HOME = { name: 'Início', path: '/' }

// ---------------------------------------------------------------------------
// FAQ institucional (dados da loja vêm do site.config)
// ---------------------------------------------------------------------------
export const storeFaq = (cats) => [
  {
    q: `Onde fica a ${site.name} em ${site.address.city}?`,
    a: `<p>A ${site.name} fica na <strong>${esc(site.address.street)}, bairro ${esc(site.address.neighborhood)}, em ${esc(site.address.city)}-${site.address.state}</strong>. É uma loja nova de materiais elétricos, tintas e ferramentas. Para traçar a rota, use o botão <a href="/contato/">Como chegar</a> ou chame no WhatsApp ${esc(site.phoneDisplay)}.</p>`,
  },
  {
    q: `Qual o horário de funcionamento da ${site.name}?`,
    a: `<p>O horário de atendimento é: <strong>${esc(hoursText())}</strong>. Fora do horário, você pode deixar sua lista de material no WhatsApp ${esc(site.phoneDisplay)} e a equipe responde assim que a loja abrir.</p>`,
  },
  {
    q: 'Como faço um orçamento pelo WhatsApp?',
    a: `<p>É simples: navegue pelos produtos do site e toque no <strong>+</strong> de cada item para montar sua lista. Depois abra <strong>Minha lista</strong> e toque em <strong>Enviar lista no WhatsApp</strong> — a mensagem vai pronta, com quantidades e observações. Se preferir, mande uma foto da sua lista escrita à mão para ${esc(site.phoneDisplay)}.</p>`,
  },
  {
    q: `O que a ${site.name} vende?`,
    a: `<p>A loja trabalha com ${cats.map((c) => `<a href="/${c.slug}/">${esc(c.name.toLowerCase())}</a>`).join(', ').replace(/, ([^,]*)$/, ' e $1')}. Na prática: fios, disjuntores, chuveiros e resistências, lâmpadas e fita de LED, tintas, massa corrida, spray, ferramentas manuais e elétricas, discos de corte, torneiras, mangueira por metro, caixa d'água, escadas, carrinho de mão, parafusos, WD-40 e muito mais.</p>`,
  },
  {
    q: 'Quais formas de pagamento a loja aceita?',
    a: `<p>A ${site.name} aceita <strong>${esc(site.payment.join(', ').replace(/, ([^,]*)$/, ' e $1'))}</strong>. Para compras maiores ou de obra, fale com a equipe pelo WhatsApp e confirme as condições na hora do orçamento.</p>`,
  },
  {
    q: 'Vocês vendem mangueira por metro?',
    a: `<p>Sim. Na seção de <a href="/hidraulica/">hidráulica</a> você encontra mangueira vendida por metro — assim você leva só o comprimento de que precisa, sem pagar por rolo inteiro. Informe a medida e o uso (jardim, nível, cristal) no WhatsApp para a equipe separar.</p>`,
  },
  {
    q: 'Vocês atendem eletricistas, pintores e pedreiros?',
    a: `<p>Sim. Profissionais podem mandar a lista completa da obra pelo WhatsApp, receber o orçamento e passar só para retirar o material separado. Se tiver dúvida de medida, bitola ou tipo de tinta, a equipe do balcão ajuda a conferir antes da compra.</p>`,
  },
  {
    q: 'Como saber quantas latas de tinta comprar?',
    a: `<p>Use a <a href="/calculadora-de-tinta/">calculadora de tinta</a> do site: informe as medidas do cômodo, portas, janelas e número de demãos, e ela mostra os litros e a combinação de latas e galões. Para entender o cálculo, leia o guia <a href="/guias/quantas-latas-de-tinta-preciso/">quantas latas de tinta eu preciso</a>.</p>`,
  },
]

// ---------------------------------------------------------------------------
// HOME
// ---------------------------------------------------------------------------
const heroArt = () => `
<div class="hero__art" aria-hidden="true">
  <svg class="hero__svg" viewBox="0 0 400 420" role="presentation">
    <defs>
      <linearGradient id="gBolt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FFE14D"/><stop offset=".55" stop-color="#FFD100"/><stop offset="1" stop-color="#FFA800"/>
      </linearGradient>
      <filter id="fGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <path class="hero__splash" d="M200 40C260 38 300 70 330 110c22 30 42 60 32 102-8 36-2 58-12 88v60c0 12-16 12-16 0v-42c-16 18-34 26-52 32v42c0 16-20 16-20 0v-36c-22 4-42 6-62 4-24 0-50-8-72-20v32c0 12-16 12-16 0v-46C80 300 52 268 44 226c-8-44 6-86 36-122 30-34 70-62 120-64z"/>
    <g class="hero__rings"><circle cx="200" cy="200" r="168"/><circle cx="200" cy="200" r="122"/></g>
    <path class="hero__bolt-fill" d="M224 40 80 232h112l-16 128 144-192H208z" filter="url(#fGlow)"/>
    <path class="hero__bolt-line" d="M224 40 80 232h112l-16 128 144-192H208z"/>
    <g class="hero__sparks"><path d="M330 70l22-14M342 110l26 2M86 330l-24 12M70 292l-26-4M300 360l12 22"/></g>
  </svg>
  <button type="button" class="float float--1" data-add="Disjuntor bipolar 40 A" data-cat="Materiais Elétricos" tabindex="-1">${icon('bolt', { size: 18 })}<span>Disjuntor 40 A</span><b>${icon('plus', { size: 14, sw: 2.6 })}</b></button>
  <button type="button" class="float float--2" data-add="Tinta acrílica fosca 18 L" data-cat="Tintas e Pintura" tabindex="-1">${icon('roller', { size: 18 })}<span>Tinta acrílica 18 L</span><b>${icon('plus', { size: 14, sw: 2.6 })}</b></button>
  <button type="button" class="float float--3" data-add="Fita de LED 12 V (rolo 5 m)" data-cat="Iluminação e LED" tabindex="-1">${icon('bulb', { size: 18 })}<span>Fita de LED 5 m</span><b>${icon('plus', { size: 14, sw: 2.6 })}</b></button>
  <button type="button" class="float float--4" data-add="Disco de corte para metal 4 1/2&quot;" data-cat="Ferramentas" tabindex="-1">${icon('drill', { size: 18 })}<span>Disco de corte</span><b>${icon('plus', { size: 14, sw: 2.6 })}</b></button>
</div>`

const TICKER = ['Fios e cabos', 'Disjuntores', 'Chuveiros e resistências', 'Lâmpadas LED', 'Fita de LED', 'Tinta acrílica', 'Massa corrida', 'Tinta spray', 'Furadeiras', 'Disco de corte', 'Colher de pedreiro', 'Torneiras', 'Mangueira por metro', "Caixa d'água", 'Escadas', 'Carrinho de mão', 'Compressores', 'Parafusos', 'WD-40', 'Vassouras', 'EPI']

const ticker = () => {
  const row = TICKER.map((t) => `<span>${esc(t)}</span>${icon('bolt', { size: 18, cls: 'tick__bolt' })}`).join('')
  return `<div class="ticker-wrap"><div class="ticker" role="marquee" aria-label="Alguns produtos da loja"><div class="ticker__track"><div class="ticker__row">${row}</div><div class="ticker__row" aria-hidden="true">${row}</div></div></div></div>`
}

const steps = () => `
<section class="section steps" aria-labelledby="como-funciona">
  <div class="wrap steps__grid">
    <div>
      ${sectionHead({ eyebrow: `${icon('list', { size: 16 })} Orçamento sem fila`, title: 'Monte a lista no site.<br>Receba o orçamento no <span class="hl">WhatsApp</span>.', id: 'como-funciona', text: 'Do jeito que o pessoal da obra já trabalha — só que mais rápido. Nada de cadastro, nada de carrinho complicado.' })}
      <ol class="steps__list">
        <li data-reveal style="--d:0ms"><span class="steps__n">1</span><div><h3>Escolha os produtos</h3><p>Toque no <b>+</b> de cada item ou use a busca. Dá para escrever itens à mão também.</p></div></li>
        <li data-reveal style="--d:80ms"><span class="steps__n">2</span><div><h3>Envie pelo WhatsApp</h3><p>A mensagem vai pronta, com quantidades e observações (cor, medida, voltagem).</p></div></li>
        <li data-reveal style="--d:160ms"><span class="steps__n">3</span><div><h3>Retire na loja</h3><p>A equipe confirma preço e disponibilidade e separa o material para você no ${esc(site.address.neighborhood)}.</p></div></li>
      </ol>
      <div class="steps__ctas" data-reveal>
        <button class="btn btn--yellow btn--lg" data-search-open>${icon('search', { size: 20 })}Começar minha lista</button>
      </div>
    </div>
    <div class="phone" data-reveal aria-hidden="true">
      <div class="phone__frame">
        <div class="phone__top"><span class="phone__avatar"><img src="/assets/img/favicon-32.png" alt="" width="20" height="20"></span><div><b>${esc(site.name)}</b><small>online</small></div></div>
        <div class="phone__chat" data-phone-chat>
          <div class="bubble bubble--out" style="--d:.2s"><p>Olá, ${esc(site.name)}! Vim pelo site e gostaria de um orçamento:</p>
            <ul><li>3x Fio flexível 2,5 mm² (rolo 100 m)</li><li>1x Disjuntor bipolar 40 A</li><li>2x Tinta acrílica fosca 18 L</li><li>1x Rolo de lã 23 cm</li></ul>
            <p><i>Obs.: tinta branco neve</i></p><span class="bubble__time">08:14 ✓✓</span></div>
          <div class="bubble bubble--in" style="--d:1.4s"><p>Bom dia! Já estamos separando seu material. Segue o orçamento 👇</p><span class="bubble__time">08:16</span></div>
          <div class="bubble bubble--typing" style="--d:2.4s"><span></span><span></span><span></span></div>
        </div>
      </div>
    </div>
  </div>
</section>`

const paintSection = () => `
<section class="section paint" aria-labelledby="calc-titulo">
  <svg class="paint__drips" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0h1440v40c-20 0-30 10-30 30v20c0 14-20 14-20 0V60c0-14-14-20-28-20H1180c-16 0-24 8-24 24v38c0 16-22 16-22 0V58c0-12-10-18-22-18H900c-14 0-20 8-20 22v14c0 12-18 12-18 0V60c0-12-8-20-20-20H620c-16 0-22 10-22 26v34c0 18-24 18-24 0V62c0-14-8-22-22-22H330c-14 0-22 8-22 22v12c0 12-18 12-18 0V60c0-12-8-20-20-20H120c-14 0-22 8-22 22v30c0 16-22 16-22 0V58c0-12-8-18-20-18H0z"/></svg>
  <div class="wrap paint__grid">
    <div class="paint__copy">
      ${sectionHead({ eyebrow: `${icon('calc', { size: 16 })} Calculadora de tinta`, title: 'Quantas latas de tinta você precisa?', id: 'calc-titulo', text: 'Coloque as medidas do cômodo e veja na hora os litros e a combinação de latas e galões. Sem desperdício e sem voltar na loja porque faltou.' })}
      <ul class="ticks" data-reveal>
        <li>${icon('check', { size: 18, sw: 2.6 })}Desconta portas e janelas</li>
        <li>${icon('check', { size: 18, sw: 2.6 })}Considera demãos e tipo de parede</li>
        <li>${icon('check', { size: 18, sw: 2.6 })}Manda o resultado direto no WhatsApp</li>
      </ul>
      <a class="link-arrow link-arrow--dark" href="/guias/quantas-latas-de-tinta-preciso/" data-reveal>Entenda o cálculo passo a passo ${icon('arrow', { size: 18 })}</a>
    </div>
    <div data-reveal>${paintCalculator({ compact: true })}</div>
  </div>
</section>`

const storeSection = () => `
<section class="section store" aria-labelledby="loja-titulo">
  <div class="wrap store__grid">
    <figure class="store__photo" data-reveal>
      <picture>
        <source type="image/webp" srcset="/assets/img/loja-pereira-fachada-480.webp 480w, /assets/img/loja-pereira-fachada-800.webp 800w, /assets/img/loja-pereira-fachada-1280.webp 1280w" sizes="(min-width: 960px) 50vw, 100vw">
        <img src="/assets/img/loja-pereira-fachada-1280.jpg" alt="Fachada preta e amarela da loja ${esc(site.name)} na ${esc(site.address.street)}, bairro ${esc(site.address.neighborhood)}, em ${esc(site.address.city)}-BA" width="1280" height="960" loading="lazy" decoding="async">
      </picture>
      <figcaption><span class="tape">Loja nova</span> ${esc(site.address.street)} · ${esc(site.address.neighborhood)}</figcaption>
    </figure>
    <div class="store__info">
      ${sectionHead({ eyebrow: `${icon('store', { size: 16 })} Venha conhecer`, title: `A loja nova do <span class="hl">${esc(site.address.neighborhood)}</span>`, id: 'loja-titulo', text: `Fachada preta e amarela, não tem como errar. Entre e fale com quem entende de elétrica, pintura e ferragens — ou adiante tudo pelo WhatsApp e só passe para retirar.` })}
      <div class="store__cards" data-reveal>
        <div class="infocard">${icon('pin', { size: 22 })}<div><b>Endereço</b><p>${esc(addressLine())}</p></div></div>
        <div class="infocard">${icon('clock', { size: 22 })}<div><b>Horário <span class="open-badge open-badge--inline" data-open-badge></span></b>${hoursList()}</div></div>
        <div class="infocard">${icon('card', { size: 22 })}<div><b>Pagamento</b><p>${esc(site.payment.join(' · '))}</p></div></div>
      </div>
      <div class="store__btns" data-reveal>
        <a class="btn btn--yellow btn--lg" href="${directionsUrl()}" target="_blank" rel="noopener">${icon('route', { size: 20 })}Como chegar</a>
        <a class="btn btn--ghost btn--lg" href="${wa()}" target="_blank" rel="noopener" data-track="wa-store">${icon('whatsapp', { size: 20 })}${esc(site.phoneDisplay)}</a>
      </div>
    </div>
  </div>
  <div class="wrap" data-reveal>${mapBlock()}</div>
</section>`

const PROS = [
  { icon: 'bolt', title: 'Eletricistas', text: 'Fios, cabos, disjuntores, DR, quadros, tomadas e iluminação para a instalação completa.', link: '/materiais-eletricos/' },
  { icon: 'roller', title: 'Pintores', text: 'Tintas, massa corrida, selador, textura, rolos, trinchas, lixas e fita crepe.', link: '/tintas-e-pintura/' },
  { icon: 'hammer', title: 'Pedreiros', text: 'Colher de pedreiro, desempenadeira, nível, discos, carrinho de mão e escadas.', link: '/ferramentas/' },
  { icon: 'drop', title: 'Encanadores', text: 'Tubos e conexões, registros, torneiras, veda-rosca, adesivo e caixa d’água.', link: '/hidraulica/' },
  { icon: 'home', title: 'Para sua casa', text: 'Lâmpada queimada, resistência do chuveiro, torneira pingando? Resolva sem complicação.', link: '/guias/' },
  { icon: 'wrench', title: 'Roça e oficina', text: 'Ferramentas, compressor, lavadora de alta pressão, mangueiras, WD-40 e lubrificantes.', link: '/equipamentos-para-obra/' },
]

const prosSection = () => `
<section class="section pros" aria-labelledby="pros-titulo">
  <div class="wrap">
    ${sectionHead({ eyebrow: `${icon('users', { size: 16 })} Para quem faz a obra acontecer`, title: 'Do profissional ao <span class="hl">faça-você-mesmo</span>', id: 'pros-titulo', center: true, text: 'Atendimento de balcão com orientação técnica: a gente ajuda a escolher o fio certo, a tinta certa e a ferramenta certa antes de você comprar.' })}
    <div class="pros__grid">
      ${PROS.map((p, i) => `<a class="pcard" href="${p.link}" data-reveal style="--d:${i * 60}ms"><span class="pcard__icon">${icon(p.icon, { size: 26 })}</span><h3>${p.title}</h3><p>${p.text}</p><span class="pcard__go">${icon('arrow', { size: 18 })}</span></a>`).join('')}
    </div>
  </div>
</section>`

export function home(ctx) {
  const { categories: cats, guides } = ctx
  const title = `${site.name} | Elétrica, Tintas e Ferragens em Barreiras-BA`
  const description = `Loja de material elétrico, tintas, ferramentas, hidráulica e ferragens no bairro ${site.address.neighborhood}, em Barreiras-BA. Monte sua lista e peça orçamento no WhatsApp.`
  const faq = storeFaq(cats).slice(0, 6)
  const body = `
<section class="hero" data-spot>
  <div class="hero__bg" aria-hidden="true"><div class="hero__grid"></div><div class="hero__glow"></div><div class="hero__noise"></div></div>
  <div class="wrap hero__in">
    <div class="hero__copy">
      <p class="pill" data-hero-in style="--d:0ms"><span class="pill__dot"></span>Loja nova no ${esc(site.address.neighborhood)} · ${esc(site.address.city)}-${site.address.state}</p>
      <h1 class="hero__title">
        <span class="hero__kicker" data-hero-in style="--d:80ms">Loja de material elétrico, tintas e ferragens em ${esc(site.address.city)}-${site.address.state}</span>
        <span class="hero__display" data-hero-in style="--d:160ms">Sua obra com mais <em class="luz">luz</em> e mais <em class="cor">cor<svg viewBox="0 0 200 24" preserveAspectRatio="none" aria-hidden="true"><path d="M3 15c40-9 90-12 194-6" /></svg></em></span>
      </h1>
      <p class="hero__lead" data-hero-in style="--d:240ms">A <strong>${esc(site.name)}</strong> é uma loja de ferragens, materiais elétricos e tintas na ${esc(site.address.street)}, bairro ${esc(site.address.neighborhood)}. Fios, disjuntores, fita de LED, tinta, massa corrida, ferramentas e hidráulica num lugar só — com <strong>orçamento rápido pelo WhatsApp</strong>.</p>
      <form class="hsearch" role="search" data-hero-search data-hero-in style="--d:320ms" action="/guias/">
        ${icon('search', { size: 22 })}
        <label for="hsearch-input" class="sr-only">Buscar produto</label>
        <input id="hsearch-input" type="search" placeholder="Busque: fio 2,5 mm, tinta acrílica, disco de corte…" data-typewriter autocomplete="off" enterkeyhint="search">
        <button class="btn btn--yellow btn--sm" type="submit">Buscar</button>
      </form>
      <div class="hero__ctas" data-hero-in style="--d:400ms">
        <a class="btn btn--wa btn--lg" href="${wa()}" target="_blank" rel="noopener" data-track="wa-hero">${icon('whatsapp', { size: 22 })}Pedir orçamento no WhatsApp</a>
        <a class="btn btn--ghost btn--lg" href="#produtos">Ver produtos ${icon('arrow', { size: 18 })}</a>
      </div>
      <ul class="hero__trust" data-hero-in style="--d:480ms">
        <li>${icon('pin', { size: 18 })}${esc(site.address.street)}</li>
        <li class="open-badge open-badge--hero" data-open-badge>${icon('clock', { size: 18 })}${esc(hoursRows()[0].label)}: ${esc(hoursRows()[0].value)}</li>
        <li>${icon('pix', { size: 18 })}${esc(site.payment.slice(0, 2).join(' e '))}</li>
      </ul>
    </div>
    ${heroArt()}
  </div>
  <a class="hero__scroll" href="#produtos" aria-label="Rolar para os produtos"><span></span></a>
</section>
${ticker()}
<section class="section cats" id="produtos" aria-labelledby="produtos-titulo">
  <div class="wrap">
    ${sectionHead({ eyebrow: `${icon('store', { size: 16 })} Nossos produtos`, title: 'Tudo pra sua obra <span class="hl">num lugar só</span>', id: 'produtos-titulo', text: 'Da resistência do chuveiro à caixa d’água, do disjuntor à lata de tinta. Escolha a categoria, monte sua lista e mande no WhatsApp.' })}
    <div class="cats__grid">${cats.map((c, i) => categoryCard(c, i)).join('')}</div>
  </div>
</section>
${steps()}
${paintSection()}
${prosSection()}
${storeSection()}
<section class="section guides-home" aria-labelledby="guias-titulo">
  <div class="wrap">
    <div class="split-head">
      ${sectionHead({ eyebrow: `${icon('book', { size: 16 })} Dicas do balcão`, title: 'Tire a dúvida <span class="hl">antes de comprar</span>', id: 'guias-titulo', text: 'Guias diretos ao ponto, escritos para quem vai botar a mão na massa.' })}
      <a class="btn btn--ghost" href="/guias/" data-reveal>Ver todos os guias ${icon('arrow', { size: 18 })}</a>
    </div>
    <div class="guides__grid">${guides.slice(0, 6).map((g, i) => guideCard(g, i)).join('')}</div>
  </div>
</section>
<section class="section faq-home" aria-labelledby="faq-titulo">
  <div class="wrap faq-home__grid">
    ${sectionHead({ eyebrow: `${icon('info', { size: 16 })} Perguntas frequentes`, title: 'Dúvidas sobre a loja', id: 'faq-titulo', text: `Não achou a resposta? Chame no WhatsApp <a href="${wa()}" target="_blank" rel="noopener">${esc(site.phoneDisplay)}</a> ou veja <a href="/perguntas-frequentes/">todas as perguntas</a>.` })}
    ${faqList(faq, { id: 'faq-loja' })}
  </div>
</section>
${ctaBand()}`

  const crumbs = [HOME]
  return {
    path: '/',
    title,
    description,
    ogImage: '/assets/img/og-pereira.jpg',
    bodyClass: 'is-home',
    body,
    jsonld: jsonld([
      storeEntity(cats),
      websiteEntity(),
      webPage({ path: '/', title, description, crumbs, image: '/assets/img/og-pereira.jpg', dateModified: site.contentDate }),
      itemList('/', 'Categorias de produtos', cats.map((c) => ({ name: c.name, path: `/${c.slug}/` }))),
    ]),
  }
}

// ---------------------------------------------------------------------------
// CATEGORIA
// ---------------------------------------------------------------------------
export function category(c, ctx) {
  const path = `/${c.slug}/`
  const crumbs = [HOME, { name: 'Produtos', path: '/#produtos' }, { name: c.name, path }]
  const related = (c.relatedGuides || []).map((s) => ctx.guideMap[s]).filter(Boolean)
  const relCats = (c.relatedCategories || []).map((s) => ctx.catMap[s]).filter(Boolean)
  const others = ctx.categories.filter((x) => x.slug !== c.slug)
  const body = `
<section class="phero phero--cat">
  <div class="phero__bg" aria-hidden="true"><div class="hero__grid"></div><span class="phero__icon">${icon(c.icon, { size: 420, sw: 0.6 })}</span></div>
  <div class="wrap">
    ${breadcrumb(crumbs)}
    <div class="phero__in">
      <span class="phero__badge">${icon(c.icon, { size: 30, sw: 1.7 })}</span>
      <p class="eyebrow">${esc(c.kicker)}</p>
      <h1 class="phero__title">${esc(c.h1)}</h1>
      <p class="phero__lead">${c.intro}</p>
      <ul class="phero__chips">${c.highlights.map((h) => `<li>${icon('check', { size: 16, sw: 2.6 })}${esc(h)}</li>`).join('')}</ul>
      <div class="phero__ctas">
        <a class="btn btn--wa btn--lg" href="${wa(`Olá, ${site.name}! Vim pelo site e quero um orçamento de ${c.name.toLowerCase()}.`)}" target="_blank" rel="noopener" data-track="wa-cat">${icon('whatsapp', { size: 22 })}Orçamento de ${esc(c.shortName.toLowerCase())}</a>
        <a class="btn btn--ghost btn--lg" href="#itens">Ver itens ${icon('arrow', { size: 18 })}</a>
      </div>
    </div>
  </div>
</section>
<nav class="subnav" aria-label="Seções de ${esc(c.name)}">
  <div class="wrap subnav__in">${c.groups.map((g) => `<a href="#${slugify(g.name)}">${esc(g.name)}</a>`).join('')}<a href="#duvidas">Dúvidas</a></div>
</nav>
<section class="section groups" id="itens" aria-label="Produtos de ${esc(c.name)}">
  <div class="wrap">
    <div class="groups__hint" data-reveal>${icon('list', { size: 20 })}<p>Toque no <b>+</b> para colocar o item na sua lista. Depois envie tudo de uma vez no WhatsApp — a equipe confirma preço, medida e disponibilidade.</p></div>
    <div class="groups__grid">
      ${c.groups
        .map(
          (g, i) => `<article class="group" id="${slugify(g.name)}" data-reveal style="--d:${(i % 2) * 70}ms">
        <header><span class="group__n">${String(i + 1).padStart(2, '0')}</span><h2 class="group__title">${esc(g.name)}</h2></header>
        <p class="group__desc">${g.description}</p>
        <div class="group__chips">${g.items.map((it) => addChip(it, c.name)).join('')}</div>
        <a class="group__ask" href="${wa(`Olá, ${site.name}! Vocês têm ${g.name.toLowerCase()}? Gostaria de saber medidas e preços.`)}" target="_blank" rel="noopener">${icon('whatsapp', { size: 16 })}Não achou a medida? Pergunte</a>
      </article>`,
        )
        .join('')}
    </div>
  </div>
</section>
${
  c.tips?.length
    ? `<section class="section tips" aria-labelledby="dicas-titulo"><div class="wrap">
    ${sectionHead({ eyebrow: `${icon('sparkle', { size: 16 })} Dica do balcão`, title: 'Antes de comprar, vale saber', id: 'dicas-titulo' })}
    <div class="tips__grid">${c.tips.map((t, i) => `<div class="tip" data-reveal style="--d:${i * 70}ms"><span class="tip__ico">${icon('bolt', { size: 20 })}</span><h3>${esc(t.title)}</h3><p>${t.body}</p></div>`).join('')}</div>
  </div></section>`
    : ''
}
${
  related.length
    ? `<section class="section related" aria-labelledby="rel-titulo"><div class="wrap">
    ${sectionHead({ eyebrow: `${icon('book', { size: 16 })} Guias`, title: 'Guias para escolher certo', id: 'rel-titulo' })}
    <div class="guides__grid">${related.map((g, i) => guideCard(g, i)).join('')}</div>
  </div></section>`
    : ''
}
<section class="section faq-sec" aria-labelledby="faq-cat-titulo">
  <div class="wrap faq-home__grid">
    ${sectionHead({ eyebrow: `${icon('info', { size: 16 })} Perguntas frequentes`, title: `Dúvidas sobre ${esc(c.name.toLowerCase())}`, id: 'faq-cat-titulo', text: `Respostas rápidas da equipe da ${esc(site.name)}, em ${esc(site.address.city)}.` })}
    ${faqList(c.faq)}
  </div>
</section>
<section class="section others" aria-labelledby="outras-titulo">
  <div class="wrap">
    ${sectionHead({ eyebrow: 'Continue comprando', title: relCats.length ? 'Quem leva isso também procura' : 'Outras categorias', id: 'outras-titulo' })}
    <div class="others__row">${[...relCats, ...others.filter((o) => !relCats.includes(o))].map((o) => `<a class="otile" href="/${o.slug}/" data-reveal>${icon(o.icon, { size: 26 })}<span>${esc(o.name)}</span>${icon('arrow', { size: 18 })}</a>`).join('')}</div>
  </div>
</section>
${ctaBand({ title: `Precisa de ${esc(c.shortName.toLowerCase())}? Mande a lista.` })}`

  const title = c.seo.title
  const description = c.seo.description
  return {
    path,
    title,
    description,
    ogImage: `/assets/img/og/${c.slug}.jpg`,
    body,
    jsonld: jsonld([
      storeEntity(),
      websiteEntity(),
      webPage({ path, title, description, type: ['WebPage', 'CollectionPage'], crumbs, image: `/assets/img/og/${c.slug}.jpg`, dateModified: site.contentDate }),
      breadcrumbList(path, crumbs),
      {
        '@type': 'OfferCatalog',
        '@id': abs(path) + '#catalogo',
        name: `${c.name} — ${site.name}`,
        url: abs(path),
        provider: { '@id': abs('/#loja') },
        itemListElement: c.groups.map((g) => ({
          '@type': 'OfferCatalog',
          name: g.name,
          description: `${stripTags(g.description)} Itens: ${g.items.join(', ')}.`,
          url: abs(path) + '#' + slugify(g.name),
        })),
      },
      faqPage(path, c.faq),
    ]),
  }
}

// ---------------------------------------------------------------------------
// GUIA
// ---------------------------------------------------------------------------
export function guide(g, ctx) {
  const path = `/guias/${g.slug}/`
  const cat = ctx.catMap[g.category]
  const crumbs = [HOME, { name: 'Guias', path: '/guias/' }, { name: g.navTitle || g.title, path }]
  const related = (g.relatedGuides || []).map((s) => ctx.guideMap[s]).filter(Boolean)
  const more = ctx.guides.filter((x) => x.slug !== g.slug && !related.includes(x)).slice(0, Math.max(0, 3 - related.length))
  const howToBlock = g.howTo
    ? `<section class="howto" aria-labelledby="passo-a-passo">
      <h2 id="passo-a-passo">${esc(g.howTo.name)}</h2>
      ${g.howTo.supplies?.length || g.howTo.tools?.length ? `<div class="howto__need">
        ${g.howTo.supplies?.length ? `<div><h3>${icon('bucket', { size: 18 })}Materiais</h3><ul>${g.howTo.supplies.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}
        ${g.howTo.tools?.length ? `<div><h3>${icon('wrench', { size: 18 })}Ferramentas</h3><ul>${g.howTo.tools.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}
      </div>` : ''}
      <ol class="howto__steps">${g.howTo.steps.map((s, i) => `<li id="passo-${i + 1}"><span class="howto__n">${i + 1}</span><div><h3>${esc(s.name)}</h3><p>${s.text}</p></div></li>`).join('')}</ol>
    </section>`
    : ''
  const body = `
<article class="guide">
  <header class="phero phero--guide">
    <div class="phero__bg" aria-hidden="true"><div class="hero__grid"></div></div>
    <div class="wrap wrap--narrow">
      ${breadcrumb(crumbs)}
      <p class="eyebrow">${icon(cat?.icon || 'book', { size: 16 })} ${esc(g.kicker)}</p>
      <h1 class="phero__title phero__title--guide">${esc(g.title)}</h1>
      <p class="guide__meta">Por <a href="/sobre/">Equipe ${esc(site.name)}</a> · Atualizado em <time datetime="${g.dateModified}">${fmtDatePt(g.dateModified)}</time> · ${g.readingMinutes} min de leitura</p>
    </div>
  </header>
  <div class="wrap wrap--narrow guide__body">
    <aside class="answer" aria-label="Resposta rápida">
      <p class="answer__label">${icon('bolt', { size: 18 })} Resposta rápida</p>
      <p class="answer__text">${g.summary}</p>
      <ul class="answer__list">${g.keyTakeaways.map((k) => `<li>${icon('check', { size: 16, sw: 2.6 })}<span>${k}</span></li>`).join('')}</ul>
    </aside>
    ${g.sections.length > 3 ? toc(g.sections) : ''}
    ${g.widget === 'paint-calculator' ? `<div class="guide__widget"><h2 id="calculadora">Calculadora de tinta</h2>${paintCalculator()}</div>` : ''}
    <div class="prose">
      ${g.sections.map((s) => `<section><h2 id="${slugify(s.h2)}">${esc(s.h2)}</h2>${s.html}</section>`).join('')}
    </div>
    ${howToBlock}
    <aside class="gcta">
      <div class="gcta__in">
        <h2>${esc(g.cta.title)}</h2>
        <p>${g.cta.text}</p>
        <div class="group__chips">${g.cta.items.map((it) => addChip(it, cat?.name || '')).join('')}</div>
        <div class="gcta__btns">
          <button class="btn btn--dark" data-list-open>${icon('list', { size: 18 })}Ver minha lista</button>
          <a class="btn btn--wa" href="${wa(`Olá, ${site.name}! Li o guia "${g.title}" no site e queria tirar uma dúvida.`)}" target="_blank" rel="noopener" data-track="wa-guide">${icon('whatsapp', { size: 18 })}Tirar dúvida no WhatsApp</a>
        </div>
      </div>
    </aside>
    <section class="guide__faq" aria-labelledby="faq-guia">
      <h2 id="faq-guia">Perguntas frequentes</h2>
      ${faqList(g.faq)}
    </section>
    ${g.sources?.length ? `<section class="sources"><h2>Referências</h2><ul>${g.sources.map((s) => `<li>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener nofollow">${esc(s.name)}</a>` : esc(s.name)}</li>`).join('')}</ul><p class="sources__note">${icon('alert', { size: 15 })}Este guia é orientativo. Para instalações elétricas e hidráulicas, siga o manual do fabricante e contrate um profissional qualificado.</p></section>` : ''}
  </div>
</article>
<section class="section related" aria-labelledby="mais-guias">
  <div class="wrap">
    ${sectionHead({ eyebrow: `${icon('book', { size: 16 })} Continue lendo`, title: 'Outros guias do balcão', id: 'mais-guias' })}
    <div class="guides__grid">${[...related, ...more].slice(0, 3).map((x, i) => guideCard(x, i)).join('')}</div>
    ${cat ? `<a class="otile otile--wide" href="/${cat.slug}/" data-reveal>${icon(cat.icon, { size: 26 })}<span>Ver produtos de ${esc(cat.name.toLowerCase())}</span>${icon('arrow', { size: 18 })}</a>` : ''}
  </div>
</section>
${ctaBand()}`

  const title = g.seo.title
  const description = g.seo.description
  return {
    path,
    title,
    description,
    ogType: 'article',
    ogImage: `/assets/img/og/guia-${g.slug}.jpg`,
    extraHead: `<meta property="article:published_time" content="${g.datePublished}"><meta property="article:modified_time" content="${g.dateModified}">`,
    body,
    jsonld: jsonld([
      storeEntity(),
      websiteEntity(),
      webPage({ path, title, description, crumbs, image: `/assets/img/og/guia-${g.slug}.jpg`, dateModified: g.dateModified }),
      breadcrumbList(path, crumbs),
      article({ ...g, categoryName: cat?.name }),
      g.howTo ? howTo(g) : null,
      faqPage(path, g.faq),
    ]),
  }
}

// ---------------------------------------------------------------------------
// ÍNDICE DE GUIAS
// ---------------------------------------------------------------------------
export function guidesIndex(ctx) {
  const path = '/guias/'
  const crumbs = [HOME, { name: 'Guias', path }]
  const byCat = ctx.categories.map((c) => ({ c, gs: ctx.guides.filter((g) => g.category === c.slug) })).filter((x) => x.gs.length)
  const title = 'Guias e Dicas de Obra, Elétrica e Pintura | Pereira Luz & Cor'
  const description = 'Guias práticos da Pereira Luz & Cor: qual fio usar no chuveiro, quantas latas de tinta comprar, como escolher lâmpada LED, disco de esmerilhadeira e mais.'
  const body = `
<section class="phero">
  <div class="phero__bg" aria-hidden="true"><div class="hero__grid"></div><span class="phero__icon">${icon('book', { size: 420, sw: 0.6 })}</span></div>
  <div class="wrap">
    ${breadcrumb(crumbs)}
    <div class="phero__in">
      <p class="eyebrow">${icon('book', { size: 16 })} Dicas do balcão</p>
      <h1 class="phero__title">Guias para comprar certo e fazer bem feito</h1>
      <p class="phero__lead">As dúvidas que mais aparecem no balcão da ${esc(site.name)}, respondidas de forma direta: medidas, tabelas, passo a passo e o que levar da loja. Feito para quem vai botar a mão na massa em ${esc(site.address.city)} e região.</p>
      <div class="phero__ctas"><a class="btn btn--yellow btn--lg" href="/calculadora-de-tinta/">${icon('calc', { size: 20 })}Calculadora de tinta</a></div>
    </div>
  </div>
</section>
${byCat
  .map(
    ({ c, gs }) => `<section class="section gsec" aria-labelledby="g-${c.slug}"><div class="wrap">
  <div class="split-head">${sectionHead({ eyebrow: `${icon(c.icon, { size: 16 })} ${esc(c.name)}`, title: esc(c.name), id: `g-${c.slug}` })}<a class="link-arrow" href="/${c.slug}/" data-reveal>Produtos de ${esc(c.shortName.toLowerCase())} ${icon('arrow', { size: 18 })}</a></div>
  <div class="guides__grid">${gs.map((g, i) => guideCard(g, i)).join('')}</div>
</div></section>`,
  )
  .join('')}
${ctaBand()}`
  return {
    path,
    title,
    description,
    ogImage: '/assets/img/og/guias.jpg',
    body,
    jsonld: jsonld([
      storeEntity(),
      websiteEntity(),
      webPage({ path, title, description, type: ['WebPage', 'CollectionPage'], crumbs, dateModified: site.contentDate }),
      breadcrumbList(path, crumbs),
      itemList(path, 'Guias da Pereira Luz & Cor', ctx.guides.map((g) => ({ name: g.title, path: `/guias/${g.slug}/` }))),
    ]),
  }
}

// ---------------------------------------------------------------------------
// CALCULADORA
// ---------------------------------------------------------------------------
export function calculator(ctx) {
  const path = '/calculadora-de-tinta/'
  const crumbs = [HOME, { name: 'Calculadora de tinta', path }]
  const title = 'Calculadora de Tinta: Quantas Latas Comprar? | Pereira Luz & Cor'
  const description = 'Calcule grátis quantos litros e quantas latas de tinta você precisa: informe as medidas, portas, janelas e demãos. Peça o orçamento no WhatsApp em Barreiras.'
  const faq = [
    { q: 'Quantos m² pinta uma lata de tinta de 18 litros?', a: '<p>Depende da linha e da superfície. Nesta calculadora usamos uma estimativa conservadora de <strong>11 m² por litro por demão em parede lisa</strong> (cerca de 198 m² por demão numa lata de 18 L) e <strong>8 m² por litro em reboco ou textura</strong> (cerca de 144 m²). Linhas premium costumam render mais: confira sempre o rendimento impresso na lata.</p>' },
    { q: 'Quantas demãos de tinta devo passar?', a: '<p>Em geral, <strong>2 demãos</strong> bastam para manter a mesma cor ou trocar por um tom parecido. Ao cobrir uma cor escura com uma clara, conte com <strong>3 demãos</strong>. Parede nova ou muito porosa deve receber selador ou fundo preparador antes, o que também ajuda a tinta a render.</p>' },
    { q: 'Preciso descontar portas e janelas?', a: '<p>Sim. A calculadora desconta automaticamente <strong>1,68 m² por porta</strong> (0,80 × 2,10 m) e <strong>1,20 m² por janela</strong> (1,20 × 1,00 m). Se suas aberturas forem bem maiores, como portas de garagem ou janelas grandes, use o modo “Já sei a área” e informe a área líquida.</p>' },
    { q: 'É melhor comprar lata ou galão?', a: '<p>A lata de 18 L costuma sair mais em conta por litro, então vale a pena quando a conta passa de uns 14 litros. Para quantidades menores, os galões de 3,6 L evitam sobra. A calculadora já sugere a combinação de latas, galões e quartos com menos desperdício.</p>' },
  ]
  const body = `
<section class="phero">
  <div class="phero__bg" aria-hidden="true"><div class="hero__grid"></div><span class="phero__icon">${icon('calc', { size: 420, sw: 0.6 })}</span></div>
  <div class="wrap">
    ${breadcrumb(crumbs)}
    <div class="phero__in">
      <p class="eyebrow">${icon('roller', { size: 16 })} Ferramenta grátis</p>
      <h1 class="phero__title">Calculadora de tinta: quantas latas comprar?</h1>
      <p class="phero__lead">Para saber quanta tinta comprar, calcule a área das paredes (perímetro × pé-direito), desconte portas e janelas, multiplique pelo número de demãos e divida pelo rendimento da tinta. A calculadora faz tudo isso e ainda sugere a combinação de latas e galões.</p>
    </div>
  </div>
</section>
<section class="section calc-page">
  <div class="wrap">${paintCalculator()}</div>
</section>
<section class="section">
  <div class="wrap wrap--narrow prose">
    <h2 id="como-calcular">Como a calculadora faz a conta</h2>
    <ol>
      <li><strong>Área das paredes</strong> = (largura + comprimento) × 2 × pé-direito.</li>
      <li><strong>Desconta aberturas</strong>: 1,68 m² por porta e 1,20 m² por janela.</li>
      <li><strong>Teto (opcional)</strong> = largura × comprimento.</li>
      <li><strong>Litros</strong> = área × demãos ÷ rendimento (11 m²/L em parede lisa; 8 m²/L em reboco).</li>
      <li><strong>Folga de 10%</strong> para perdas, retoques e absorção.</li>
      <li><strong>Embalagens</strong>: combina latas de 18 L, galões de 3,6 L e quartos de 0,9 L com o mínimo de sobra.</li>
    </ol>
    <p>Exemplo: um quarto de 3 × 4 m com pé-direito de 2,60 m, uma porta e uma janela tem 33,52 m² de parede. Com 2 demãos em parede lisa, são cerca de <strong>6,7 litros</strong> — dois galões de 3,6 L. Quer o passo a passo completo? Leia o guia <a href="/guias/quantas-latas-de-tinta-preciso/">quantas latas de tinta eu preciso</a>.</p>
  </div>
</section>
<section class="section faq-sec" aria-labelledby="faq-calc">
  <div class="wrap faq-home__grid">
    ${sectionHead({ eyebrow: `${icon('info', { size: 16 })} Perguntas frequentes`, title: 'Dúvidas sobre quantidade de tinta', id: 'faq-calc' })}
    ${faqList(faq)}
  </div>
</section>
${ctaBand({ title: 'Calculou? Agora é só pedir.', text: `Mande o resultado no WhatsApp com a cor e o acabamento que você quer. A equipe da ${site.name} confirma e separa a tinta para você.` })}`
  return {
    path,
    title,
    description,
    ogImage: '/assets/img/og/calculadora-de-tinta.jpg',
    body,
    jsonld: jsonld([
      storeEntity(),
      websiteEntity(),
      webPage({ path, title, description, crumbs, dateModified: site.contentDate }),
      breadcrumbList(path, crumbs),
      {
        '@type': 'WebApplication',
        '@id': abs(path) + '#app',
        name: 'Calculadora de tinta — Pereira Luz & Cor',
        url: abs(path),
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        inLanguage: 'pt-BR',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
        provider: { '@id': abs('/#loja') },
      },
      faqPage(path, faq),
    ]),
  }
}

// ---------------------------------------------------------------------------
// FAQ GERAL
// ---------------------------------------------------------------------------
export function faqHub(ctx) {
  const path = '/perguntas-frequentes/'
  const crumbs = [HOME, { name: 'Perguntas frequentes', path }]
  const sf = storeFaq(ctx.categories)
  const title = 'Perguntas Frequentes | Pereira Luz & Cor em Barreiras-BA'
  const description = `Endereço, horário, formas de pagamento, orçamento pelo WhatsApp e dúvidas técnicas sobre elétrica, tintas, ferramentas e hidráulica na ${site.name}, em Barreiras.`
  const body = `
<section class="phero">
  <div class="phero__bg" aria-hidden="true"><div class="hero__grid"></div><span class="phero__icon">${icon('info', { size: 420, sw: 0.6 })}</span></div>
  <div class="wrap">
    ${breadcrumb(crumbs)}
    <div class="phero__in">
      <p class="eyebrow">${icon('info', { size: 16 })} Central de dúvidas</p>
      <h1 class="phero__title">Perguntas frequentes</h1>
      <p class="phero__lead">Tudo o que perguntam para a ${esc(site.name)}: onde fica, horário, pagamento, como pedir orçamento pelo WhatsApp e as dúvidas técnicas mais comuns de cada seção da loja.</p>
      <nav class="faq-jump" aria-label="Ir para">${[`<a href="#loja">A loja</a>`, ...ctx.categories.map((c) => `<a href="#${c.slug}">${esc(c.shortName)}</a>`)].join('')}</nav>
    </div>
  </div>
</section>
<section class="section faq-sec" id="loja" aria-labelledby="faq-loja-t">
  <div class="wrap faq-home__grid">
    ${sectionHead({ eyebrow: `${icon('store', { size: 16 })} A loja`, title: `Sobre a ${esc(site.name)}`, id: 'faq-loja-t' })}
    ${faqList(sf, { id: 'faq-loja' })}
  </div>
</section>
${ctx.categories
  .map(
    (c) => `<section class="section faq-sec faq-sec--cat" id="${c.slug}" aria-labelledby="faq-${c.slug}-t">
  <div class="wrap faq-home__grid">
    <div>${sectionHead({ eyebrow: `${icon(c.icon, { size: 16 })} ${esc(c.shortName)}`, title: esc(c.name), id: `faq-${c.slug}-t` })}<a class="link-arrow" href="/${c.slug}/#duvidas">Ver na página de ${esc(c.shortName.toLowerCase())} ${icon('arrow', { size: 18 })}</a></div>
    ${faqList(c.faq.slice(0, 4), { id: `faq-${c.slug}` })}
  </div>
</section>`,
  )
  .join('')}
${ctaBand()}`
  return {
    path,
    title,
    description,
    ogImage: '/assets/img/og/perguntas-frequentes.jpg',
    body,
    jsonld: jsonld([
      storeEntity(),
      websiteEntity(),
      webPage({ path, title, description, crumbs, dateModified: site.contentDate }),
      breadcrumbList(path, crumbs),
      faqPage(path, sf),
    ]),
  }
}

// ---------------------------------------------------------------------------
// SOBRE
// ---------------------------------------------------------------------------
export function about(ctx) {
  const path = '/sobre/'
  const crumbs = [HOME, { name: 'A loja', path }]
  const title = 'Sobre a Pereira Luz & Cor | Loja de Elétrica e Tintas em Barreiras'
  const description = `Conheça a ${site.name}: loja nova de materiais elétricos, tintas, ferramentas e ferragens no bairro ${site.address.neighborhood}, em Barreiras-BA. Atendimento de balcão e WhatsApp.`
  const body = `
<section class="phero">
  <div class="phero__bg" aria-hidden="true"><div class="hero__grid"></div><span class="phero__icon">${icon('store', { size: 420, sw: 0.6 })}</span></div>
  <div class="wrap">
    ${breadcrumb(crumbs)}
    <div class="phero__in">
      <p class="eyebrow">${icon('store', { size: 16 })} A loja</p>
      <h1 class="phero__title">Uma loja de bairro com energia nova</h1>
      <p class="phero__lead">A <strong>${esc(site.name)}</strong> é uma loja de materiais elétricos, tintas, ferramentas, hidráulica e ferragens localizada na ${esc(site.address.street)}, no bairro ${esc(site.address.neighborhood)}, em ${esc(site.address.city)}-${site.address.state}. Nasceu para resolver a obra e a manutenção da casa de quem mora e trabalha na região, sem precisar atravessar a cidade.</p>
    </div>
  </div>
</section>
<section class="section about">
  <div class="wrap about__grid">
    <figure class="store__photo" data-reveal>
      <picture>
        <source type="image/webp" srcset="/assets/img/loja-pereira-fachada-480.webp 480w, /assets/img/loja-pereira-fachada-800.webp 800w, /assets/img/loja-pereira-fachada-1280.webp 1280w" sizes="(min-width: 960px) 50vw, 100vw">
        <img src="/assets/img/loja-pereira-fachada-1280.jpg" alt="Fachada da ${esc(site.name)} em ${esc(site.address.city)}-BA" width="1280" height="960" loading="lazy" decoding="async">
      </picture>
      <figcaption><span class="tape">Nossa casa</span> ${esc(site.address.street)} · ${esc(site.address.neighborhood)}</figcaption>
    </figure>
    <div class="prose prose--dark">
      <h2>O que você encontra aqui</h2>
      <p>Do fio ao disjuntor, da lâmpada à fita de LED, da massa corrida à lata de tinta, da colher de pedreiro à furadeira: a ${esc(site.name)} reúne num só lugar o que a obra, a reforma e a manutenção do dia a dia pedem. Também tem hidráulica (torneiras, registros, mangueira por metro, caixa d'água), equipamentos (escadas, carrinho de mão, compressores, lavadoras), parafusos, colas, lubrificantes como o WD-40, utilidades e EPI.</p>
      <h2>Como a gente atende</h2>
      <ul>
        <li><strong>No balcão, com orientação:</strong> antes de vender, a equipe ajuda a conferir medida, bitola, voltagem e o tipo certo de tinta para cada parede.</li>
        <li><strong>Pelo WhatsApp:</strong> monte sua lista aqui no site, envie para ${esc(site.phoneDisplay)} e receba o orçamento. Depois é só passar para retirar.</li>
        <li><strong>Para profissionais:</strong> eletricistas, pintores, pedreiros e encanadores mandam a lista da obra inteira de uma vez.</li>
      </ul>
      <h2>Por que “Luz &amp; Cor”</h2>
      <p>O nome e a marca contam o que a loja faz. O <strong>raio</strong> que forma o “P” representa a parte elétrica — energia, iluminação, instalação. O <strong>pincel</strong> com tinta escorrendo representa as tintas e a pintura. O preto e o amarelo, as mesmas cores da fachada, falam de força e de obra.</p>
    </div>
  </div>
</section>
<section class="section values">
  <div class="wrap">
    ${sectionHead({ eyebrow: `${icon('shield', { size: 16 })} Nosso compromisso`, title: 'O que você pode esperar da gente', center: true })}
    <div class="pros__grid">
      ${[
        ['check', 'Indicação honesta', 'Se o que você precisa é mais simples ou mais barato, a gente fala. Comprar certo vale mais que vender mais.'],
        ['bolt', 'Atendimento rápido', 'Lista pelo WhatsApp, material separado e retirada sem fila sempre que possível.'],
        ['shield', 'Segurança em primeiro lugar', 'Em elétrica e hidráulica, orientamos seguir as normas e o manual — e chamar um profissional quando necessário.'],
      ]
        .map(([ic, t, d], i) => `<div class="pcard pcard--static" data-reveal style="--d:${i * 70}ms"><span class="pcard__icon">${icon(ic, { size: 26 })}</span><h3>${t}</h3><p>${d}</p></div>`)
        .join('')}
    </div>
  </div>
</section>
${ctaBand()}`
  return {
    path,
    title,
    description,
    ogImage: '/assets/img/og/sobre.jpg',
    body,
    jsonld: jsonld([
      storeEntity(ctx.categories),
      websiteEntity(),
      webPage({ path, title, description, type: ['WebPage', 'AboutPage'], crumbs, image: '/assets/img/loja-pereira-fachada-1280.jpg', dateModified: site.contentDate }),
      breadcrumbList(path, crumbs),
    ]),
  }
}

// ---------------------------------------------------------------------------
// CONTATO
// ---------------------------------------------------------------------------
export function contact(ctx) {
  const path = '/contato/'
  const crumbs = [HOME, { name: 'Contato', path }]
  const title = 'Contato e Como Chegar | Pereira Luz & Cor Barreiras-BA'
  const description = `${site.name}: ${addressLine()}. WhatsApp ${site.phoneDisplay}. Veja horário de funcionamento, mapa e como chegar à loja.`
  const body = `
<section class="phero">
  <div class="phero__bg" aria-hidden="true"><div class="hero__grid"></div><span class="phero__icon">${icon('pin', { size: 420, sw: 0.6 })}</span></div>
  <div class="wrap">
    ${breadcrumb(crumbs)}
    <div class="phero__in">
      <p class="eyebrow">${icon('pin', { size: 16 })} Contato</p>
      <h1 class="phero__title">Contato e como chegar</h1>
      <p class="phero__lead">A ${esc(site.name)} fica na <strong>${esc(site.address.street)}, bairro ${esc(site.address.neighborhood)}, ${esc(site.address.city)}-${site.address.state}</strong>. O jeito mais rápido de falar com a loja é pelo WhatsApp <strong>${esc(site.phoneDisplay)}</strong>.</p>
    </div>
  </div>
</section>
<section class="section contact">
  <div class="wrap contact__grid">
    <div class="contact__cards">
      <a class="ccontact ccontact--wa" href="${wa()}" target="_blank" rel="noopener" data-track="wa-contact" data-reveal>${icon('whatsapp', { size: 30 })}<div><b>WhatsApp</b><span>${esc(site.phoneDisplay)}</span><small>Orçamentos, dúvidas e disponibilidade</small></div>${icon('arrow', { size: 20 })}</a>
      <a class="ccontact" href="tel:${site.phoneE164}" data-reveal>${icon('phone', { size: 28 })}<div><b>Telefone</b><span>${esc(site.phoneDisplay)}</span><small>Ligue no horário de atendimento</small></div>${icon('arrow', { size: 20 })}</a>
      <a class="ccontact" href="${directionsUrl()}" target="_blank" rel="noopener" data-reveal>${icon('route', { size: 28 })}<div><b>Endereço</b><span>${esc(site.address.street)}</span><small>${esc(site.address.neighborhood)} · ${esc(site.address.city)}-${site.address.state}${site.address.postalCode ? ` · CEP ${esc(site.address.postalCode)}` : ''}</small></div>${icon('arrow', { size: 20 })}</a>
      ${site.social.instagram ? `<a class="ccontact" href="${site.social.instagram}" target="_blank" rel="noopener" data-reveal>${icon('instagram', { size: 28 })}<div><b>Instagram</b><span>Novidades e ofertas</span></div>${icon('arrow', { size: 20 })}</a>` : ''}
      <div class="infocard infocard--big" data-reveal>${icon('clock', { size: 24 })}<div><b>Horário de funcionamento <span class="open-badge open-badge--inline" data-open-badge></span></b>${hoursList()}</div></div>
    </div>
    <form class="wform" data-wa-form data-reveal>
      <h2>Mande uma mensagem</h2>
      <p>Preencha e toque em enviar: o WhatsApp abre com a mensagem pronta.</p>
      <label class="field"><span>Seu nome</span><input name="nome" autocomplete="name" required></label>
      <label class="field"><span>Assunto</span>
        <select name="assunto"><option>Orçamento</option><option>Disponibilidade de produto</option><option>Dúvida técnica</option><option>Outro assunto</option></select>
      </label>
      <label class="field"><span>Mensagem</span><textarea name="mensagem" rows="4" required placeholder="Ex.: Vocês têm disjuntor DR 40 A?"></textarea></label>
      <button class="btn btn--wa btn--block btn--lg" type="submit">${icon('send', { size: 20 })}Enviar no WhatsApp</button>
    </form>
  </div>
  <div class="wrap" data-reveal>${mapBlock()}</div>
</section>
<section class="section area">
  <div class="wrap">
    ${sectionHead({ eyebrow: `${icon('route', { size: 16 })} Atendemos`, title: `${esc(site.address.city)} e região`, text: 'Clientes de toda a cidade e das cidades vizinhas do Oeste Baiano fazem orçamento pelo WhatsApp e retiram na loja.' })}
    <ul class="area__list" data-reveal>${site.areaServed.map((c) => `<li>${icon('pin', { size: 16 })}${esc(c)}</li>`).join('')}</ul>
  </div>
</section>`
  return {
    path,
    title,
    description,
    ogImage: '/assets/img/og/contato.jpg',
    body,
    jsonld: jsonld([
      storeEntity(),
      websiteEntity(),
      webPage({ path, title, description, type: ['WebPage', 'ContactPage'], crumbs, dateModified: site.contentDate }),
      breadcrumbList(path, crumbs),
    ]),
  }
}

// ---------------------------------------------------------------------------
// 404
// ---------------------------------------------------------------------------
export function notFound(ctx) {
  const body = `
<section class="phero phero--404">
  <div class="phero__bg" aria-hidden="true"><div class="hero__grid"></div></div>
  <div class="wrap">
    <div class="phero__in nf">
      <p class="nf__code">4${icon('bolt', { size: 120, sw: 1.4 })}4</p>
      <h1 class="phero__title">Deu curto-circuito nessa página</h1>
      <p class="phero__lead">O endereço que você tentou abrir não existe ou mudou de lugar. Use a busca ou escolha uma categoria.</p>
      <div class="phero__ctas"><button class="btn btn--yellow btn--lg" data-search-open>${icon('search', { size: 20 })}Buscar produto</button><a class="btn btn--ghost btn--lg" href="/">Ir para o início</a></div>
      <div class="others__row">${ctx.categories.map((o) => `<a class="otile" href="/${o.slug}/">${icon(o.icon, { size: 24 })}<span>${esc(o.name)}</span>${icon('arrow', { size: 18 })}</a>`).join('')}</div>
    </div>
  </div>
</section>`
  return { path: '/404.html', title: `Página não encontrada | ${site.name}`, description: 'Página não encontrada.', ogImage: '/assets/img/og-pereira.jpg', noindex: true, body, jsonld: '' }
}
