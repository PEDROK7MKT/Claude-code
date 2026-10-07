// Blocos reutilizáveis de página.
import { site, esc, wa, hoursRows, directionsUrl, mapEmbedUrl, addressLine, slugify } from './lib.mjs'
import { icon } from './icons.mjs'

export const breadcrumb = (crumbs) => `
<nav class="crumbs" aria-label="Você está em">
  <ol>${crumbs
    .map((c, i) =>
      i === crumbs.length - 1
        ? `<li aria-current="page">${esc(c.name)}</li>`
        : `<li><a href="${c.path}">${esc(c.name)}</a></li>`,
    )
    .join('')}</ol>
</nav>`

export const sectionHead = ({ eyebrow, title, text, center = false, tag = 'h2', id }) => `
<div class="shead${center ? ' shead--center' : ''}" data-reveal>
  ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
  <${tag} class="shead__title"${id ? ` id="${id}"` : ''}>${title}</${tag}>
  ${text ? `<p class="shead__text">${text}</p>` : ''}
</div>`

/** Botão "+" que adiciona um item à lista de orçamento. */
export const addChip = (name, cat = '') =>
  `<button type="button" class="chip" data-add="${esc(name)}" data-cat="${esc(cat)}" aria-pressed="false" aria-label="Pôr na lista: ${esc(name)}"><span class="chip__txt">${esc(name)}</span><span class="chip__ico" aria-hidden="true">${icon('plus', { size: 15, sw: 2.4, cls: 'i-plus' })}${icon('check', { size: 15, sw: 2.6, cls: 'i-check' })}</span></button>`

/**
 * Envolve tabelas num contêiner rolável e focável (teclado) e marca cada
 * célula com o rótulo da coluna (no celular a tabela vira cartões).
 */
export const wrapTables = (html, label = 'Tabela') =>
  String(html).replace(/<table>([\s\S]*?)<\/table>/g, (m, inner) => {
    const heads = [...(inner.match(/<thead>([\s\S]*?)<\/thead>/)?.[1] || '').matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((x) => x[1].replace(/<[^>]+>/g, '').trim())
    const body = heads.length
      ? inner.replace(/<tbody>([\s\S]*?)<\/tbody>/, (b, rows) => `<tbody>${rows.replace(/<tr>([\s\S]*?)<\/tr>/g, (r, cells) => { let i = 0; return `<tr>${cells.replace(/<td>/g, () => `<td data-label="${esc(heads[i++] || '')}">`)}</tr>` })}</tbody>`)
      : inner
    return `<div class="table-wrap${heads.length ? ' table-wrap--cards' : ''}" role="region" tabindex="0" aria-label="${esc(label)}"><table>${body}</table></div>`
  })

export const categoryCard = (c, i = 0) => `
<a class="ccard" href="/${c.slug}/" data-reveal style="--d:${i * 60}ms">
  <span class="ccard__num">${String(c.order).padStart(2, '0')}</span>
  <span class="ccard__icon">${icon(c.icon, { size: 34, sw: 1.6 })}</span>
  <h3 class="ccard__title">${esc(c.name)}</h3>
  <p class="ccard__text">${esc(c.cardBlurb)}</p>
  <ul class="ccard__tags">${c.groups.slice(0, 3).map((g) => `<li>${esc(g.name)}</li>`).join('')}</ul>
  <span class="ccard__go">Ver produtos ${icon('arrow', { size: 18 })}</span>
</a>`

export const guideCard = (g, i = 0) => `
<a class="gcard" href="/guias/${g.slug}/" data-reveal style="--d:${i * 60}ms">
  <span class="gcard__cat">${icon(g.categoryIcon, { size: 16 })}${esc(g.categoryShort)}</span>
  <h3 class="gcard__title">${esc(g.title)}</h3>
  <p class="gcard__text">${esc(g.summaryShort)}</p>
  <span class="gcard__meta">${g.readingMinutes} min de leitura <span class="gcard__go">${icon('arrow', { size: 18 })}</span></span>
</a>`

export const faqList = (faq, { id = 'duvidas' } = {}) => `
<div class="faq" id="${id}">
  ${faq
    .map(
      (f, i) => `<details class="faq__item" data-reveal${i === 0 ? ' open' : ''}>
    <summary><span>${esc(f.q)}</span><span class="faq__icon" aria-hidden="true">${icon('plus', { size: 20, sw: 2.2 })}</span></summary>
    <div class="faq__a">${wrapTables(/<p|<ul|<ol|<table/.test(f.a) ? f.a : `<p>${f.a}</p>`, `Tabela: ${f.q}`)}</div>
  </details>`,
    )
    .join('')}
</div>`

export const hoursList = () => `
<ul class="hours">${hoursRows()
  .map((r) => `<li><span>${esc(r.label)}</span><span>${esc(r.value)}</span></li>`)
  .join('')}</ul>`

export const mapBlock = () => `
<div class="map" data-map data-src="${esc(mapEmbedUrl())}">
  <div class="map__ph">
    <div class="map__grid" aria-hidden="true"></div>
    <span class="map__pin" aria-hidden="true">${icon('pin', { size: 40, sw: 1.6 })}</span>
    <p><strong>${esc(site.name)}</strong><br>${esc(addressLine())}</p>
    <div class="map__btns">
      <button class="btn btn--yellow btn--sm" data-map-load>${icon('pin', { size: 16 })}Carregar mapa</button>
      <a class="btn btn--ghost btn--sm" href="${directionsUrl()}" target="_blank" rel="noopener">${icon('route', { size: 16 })}Traçar rota</a>
    </div>
  </div>
</div>`

export const ctaBand = ({ title = 'Monte sua lista. A gente separa tudo.', text = `Mande sua lista de material pelo WhatsApp e receba o orçamento da ${site.name} sem sair de casa. Depois é só passar na loja e retirar.` } = {}) => `
<section class="ctaband">
  <div class="hazard" aria-hidden="true"></div>
  <div class="wrap ctaband__in" data-reveal>
    <div>
      <h2 class="ctaband__title">${title}</h2>
      <p>${text}</p>
    </div>
    <div class="ctaband__btns">
      <a class="btn btn--wa btn--lg" href="${wa()}" target="_blank" rel="noopener" data-track="wa-ctaband">${icon('whatsapp', { size: 22 })}Pedir orçamento</a>
      <button class="btn btn--dark btn--lg" data-list-open>${icon('list', { size: 20 })}Ver minha lista</button>
    </div>
  </div>
</section>`

/** Calculadora de tinta (marcação; a lógica está em site.js). */
export const paintCalculator = ({ compact = false } = {}) => `
<div class="calc${compact ? ' calc--compact' : ''}" data-calc>
  <form class="calc__form" data-calc-form novalidate>
    <fieldset class="calc__mode">
      <legend class="sr-only">Como você quer calcular?</legend>
      <label><input type="radio" name="modo" value="comodo" checked><span>Por cômodo</span></label>
      <label><input type="radio" name="modo" value="area"><span>Por área (m²)</span></label>
    </fieldset>
    <div class="calc__grid" data-calc-room>
      <label class="field"><span>Largura (m)</span><input name="largura" type="text" inputmode="decimal" autocomplete="off" value="3"></label>
      <label class="field"><span>Comprimento (m)</span><input name="comprimento" type="text" inputmode="decimal" autocomplete="off" value="4"></label>
      <label class="field"><span>Pé-direito (m)</span><input name="altura" type="text" inputmode="decimal" autocomplete="off" value="2,6"></label>
      <label class="field"><span>Portas</span><input name="portas" type="number" inputmode="numeric" min="0" step="1" value="1"></label>
      <label class="field"><span>Janelas</span><input name="janelas" type="number" inputmode="numeric" min="0" step="1" value="1"></label>
      <label class="field field--check"><input name="teto" type="checkbox"><span>Pintar o teto também</span></label>
    </div>
    <div class="calc__grid" data-calc-area hidden>
      <label class="field field--wide"><span>Área total a pintar (m²)</span><input name="area" type="text" inputmode="decimal" autocomplete="off" value="40"></label>
    </div>
    <div class="calc__grid calc__grid--2">
      <label class="field"><span>Superfície</span>
        <select name="superficie">
          <option value="11">Lisa / com massa corrida</option>
          <option value="8">Reboco / áspera / textura</option>
        </select>
      </label>
      <label class="field"><span>Demãos</span>
        <select name="demaos">
          <option value="2" selected>2 demãos (padrão)</option>
          <option value="3">3 demãos (escuro → claro)</option>
          <option value="1">1 demão (só retoque)</option>
        </select>
      </label>
    </div>
  </form>
  <div class="calc__out">
    <p class="sr-only" aria-live="polite" data-calc-sr></p>
    <p class="calc__label">Você vai precisar de aproximadamente</p>
    <p class="calc__big"><span data-calc-liters>0</span> <small>litros</small></p>
    <p class="calc__pack" data-calc-pack>—</p>
    <p class="calc__area" data-calc-area-out></p>
    <div class="calc__btns">
      <button class="btn btn--dark" data-calc-add>${icon('plus', { size: 18 })}Pôr na lista</button>
      <a class="btn btn--wa" href="${wa()}" data-calc-wa target="_blank" rel="noopener">${icon('whatsapp', { size: 18 })}Pedir no WhatsApp</a>
    </div>
    <p class="calc__note">${icon('info', { size: 14 })}Estimativa conservadora: ${'11'} m²/L por demão em parede lisa e 8 m²/L em reboco, com 10% de folga. O rendimento real varia por marca e linha — confira na lata.</p>
  </div>
</div>`

export const toc = (sections) => `
<nav class="toc" aria-label="Neste guia">
  <p class="toc__title">Neste guia</p>
  <ol>${sections.map((s) => `<li><a href="#${slugify(s.h2)}">${esc(s.h2)}</a></li>`).join('')}</ol>
</nav>`
