/* Pereira Luz & Cor — interações do site (sem dependências). */
(() => {
  'use strict'
  const $ = (s, r = document) => r.querySelector(s)
  const $$ = (s, r = document) => [...r.querySelectorAll(s)]
  const DATA = JSON.parse($('#site-data')?.textContent || '{}')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const waUrl = (text) => `https://wa.me/${DATA.wa}?text=${encodeURIComponent(text)}`
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
  }
  const ICON = {
    plus: '<svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
    x: '<svg class="i" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    check: '<svg class="i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    box: '<svg class="i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
    book: '<svg class="i" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>',
    wa: '<svg class="i" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z"/></svg>',
  }

  document.documentElement.classList.remove('no-js')

  /* ------------------------------------------------------------ toast */
  const toastEl = $('[data-toast]')
  let toastT
  function toast(html, action) {
    if (!toastEl) return
    toastEl.innerHTML = `${ICON.check}<span>${html}</span>`
    if (action) {
      const b = document.createElement('button')
      b.textContent = action.label
      b.addEventListener('click', action.fn)
      toastEl.append(b)
    }
    toastEl.classList.add('is-on')
    clearTimeout(toastT)
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 3200)
  }

  /* ---------------------------------------------------------- header */
  const hdr = $('[data-hdr]')
  const onScroll = () => hdr && hdr.classList.toggle('is-scrolled', scrollY > 10)
  addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // mega menu
  const megaBtn = $('[data-mega-toggle]')
  const mega = $('#mega-produtos')
  if (megaBtn && mega) {
    const li = megaBtn.closest('li')
    let hoverT
    const set = (open) => { megaBtn.setAttribute('aria-expanded', String(open)); mega.classList.toggle('is-open', open) }
    megaBtn.addEventListener('click', (e) => { e.stopPropagation(); set(megaBtn.getAttribute('aria-expanded') !== 'true') })
    if (matchMedia('(hover: hover)').matches) {
      li.addEventListener('mouseenter', () => { clearTimeout(hoverT); set(true) })
      li.addEventListener('mouseleave', () => { hoverT = setTimeout(() => set(false), 180) })
    }
    document.addEventListener('click', (e) => { if (!li.contains(e.target)) set(false) })
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false) })
  }

  /* --------------------------------------------- modais (menu/lista/busca) */
  let lastFocus = null
  function openLayer(el, focusSel) {
    if (!el) return
    lastFocus = document.activeElement
    el.hidden = false
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => { const f = focusSel ? $(focusSel, el) : $('button, a, input', el); f && f.focus() })
  }
  function closeLayer(el) {
    if (!el || el.hidden) return
    el.hidden = true
    if (![...$$('[data-menu],[data-list],[data-search]')].some((x) => !x.hidden)) document.body.style.overflow = ''
    lastFocus && lastFocus.focus && lastFocus.focus()
  }
  // focus trap simples
  document.addEventListener('keydown', (e) => {
    const layer = $$('[data-menu],[data-list],[data-search]').find((x) => !x.hidden)
    if (!layer) return
    if (e.key === 'Escape') { closeLayer(layer); return }
    if (e.key !== 'Tab') return
    const f = $$('a[href], button:not([disabled]), input, textarea, select', layer).filter((x) => x.offsetParent !== null)
    if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  })

  const menu = $('[data-menu]')
  $$('[data-menu-open]').forEach((b) => b.addEventListener('click', () => { openLayer(menu); b.setAttribute('aria-expanded', 'true') }))
  $$('[data-menu-close]').forEach((b) => b.addEventListener('click', () => closeLayer(menu)))
  menu && menu.addEventListener('click', (e) => { if (e.target === menu || e.target.closest('a')) closeLayer(menu) })

  /* ------------------------------------------------ lista de orçamento */
  const KEY = 'pereira:lista'
  let list = store.get(KEY, [])
  const listEl = $('[data-list]')
  const itemsEl = $('[data-list-items]')
  const emptyEl = $('[data-list-empty]')
  const noteEl = $('[data-list-note]')
  const fab = $('.fab-list')
  if (noteEl) noteEl.value = store.get(KEY + ':obs', '')

  const count = () => list.reduce((n, i) => n + i.q, 0)
  function save() { store.set(KEY, list); render() }
  function render() {
    const n = count()
    $$('[data-list-count]').forEach((b) => { b.textContent = n; b.hidden = n === 0 })
    if (fab) fab.hidden = n === 0
    const names = new Set(list.map((i) => i.n))
    $$('[data-add]').forEach((b) => b.classList.toggle('is-added', names.has(b.dataset.add)))
    if (!itemsEl) return
    emptyEl.hidden = list.length > 0
    itemsEl.innerHTML = list
      .map(
        (it, i) => `<li class="qitem"><span class="qitem__name">${escHtml(it.n)}${it.c ? `<small>${escHtml(it.c)}</small>` : ''}</span>
        <span class="qty"><button type="button" data-q="-1" data-i="${i}" aria-label="Diminuir">${ICON.minus}</button><input type="number" min="1" value="${it.q}" data-qi="${i}" aria-label="Quantidade de ${escHtml(it.n)}"><button type="button" data-q="1" data-i="${i}" aria-label="Aumentar">${ICON.plus}</button></span>
        <button type="button" class="qitem__rm" data-rm="${i}" aria-label="Remover ${escHtml(it.n)}">${ICON.x}</button></li>`,
      )
      .join('')
  }
  function bump() { $$('.badge[data-list-count]').forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump') }) }
  function add(name, cat = '', q = 1, silent = false) {
    name = String(name).trim()
    if (!name) return
    const found = list.find((i) => norm(i.n) === norm(name))
    if (found) found.q += q
    else list.push({ n: name, c: cat, q })
    save()
    bump()
    if (!silent) toast(`<b>${escHtml(name)}</b> na lista`, { label: 'Ver lista', fn: () => openLayer(listEl) })
  }
  window.PereiraLista = { add }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]')
    if (!b) return
    e.preventDefault()
    const name = b.dataset.add
    const inList = list.findIndex((i) => i.n === name)
    if (inList > -1 && b.classList.contains('chip')) {
      list.splice(inList, 1)
      save()
      toast(`<b>${escHtml(name)}</b> saiu da lista`)
    } else add(name, b.dataset.cat || '')
  })
  itemsEl && itemsEl.addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]')
    const rm = e.target.closest('[data-rm]')
    if (q) { const it = list[+q.dataset.i]; it.q = Math.max(1, it.q + +q.dataset.q); save() }
    if (rm) { list.splice(+rm.dataset.rm, 1); save() }
  })
  itemsEl && itemsEl.addEventListener('change', (e) => {
    const inp = e.target.closest('[data-qi]')
    if (inp) { list[+inp.dataset.qi].q = Math.max(1, parseInt(inp.value, 10) || 1); save() }
  })
  noteEl && noteEl.addEventListener('input', () => store.set(KEY + ':obs', noteEl.value))
  $('[data-list-addform]')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const inp = e.target.item
    add(inp.value, '', 1, true)
    inp.value = ''
    inp.focus()
  })
  $$('[data-list-open]').forEach((b) => b.addEventListener('click', () => openLayer(listEl, '.drawer__panel button')))
  $$('[data-list-close]').forEach((b) => b.addEventListener('click', () => closeLayer(listEl)))
  $('[data-list-clear]')?.addEventListener('click', () => {
    if (!list.length) return
    const backup = list.slice()
    list = []
    save()
    toast('Lista limpa', { label: 'Desfazer', fn: () => { list = backup; save() } })
  })
  $('[data-list-send]')?.addEventListener('click', () => {
    if (!list.length) { $('#qadd-input')?.focus(); toast('Adicione pelo menos um item à lista'); return }
    const lines = list.map((i) => `• ${i.q}x ${i.n}`).join('\n')
    const obs = noteEl?.value.trim()
    const msg = `Olá, ${DATA.name}! Vim pelo site e gostaria de um orçamento:\n\n${lines}${obs ? `\n\nObs.: ${obs}` : ''}\n\nObrigado!`
    window.open(waUrl(msg), '_blank', 'noopener')
  })
  render()

  /* ------------------------------------------------------------- busca */
  const searchEl = $('[data-search]')
  const sInput = $('[data-search-input]')
  const sResults = $('[data-search-results]')
  let INDEX = null
  let sel = -1
  const POPULAR = ['Fio 2,5 mm²', 'Disjuntor', 'Resistência de chuveiro', 'Fita de LED', 'Tinta acrílica', 'Massa corrida', 'Disco de corte', 'Mangueira', 'WD-40', "Caixa d'água"]
  async function loadIndex() {
    if (INDEX) return INDEX
    try { INDEX = await (await fetch('/assets/search-index.json')).json() } catch { INDEX = [] }
    return INDEX
  }
  function highlight(text, terms) {
    let out = escHtml(text)
    for (const t of terms) {
      if (t.length < 2) continue
      const nt = norm(text)
      const i = nt.indexOf(t)
      if (i > -1) {
        const orig = text.slice(i, i + t.length)
        out = out.replace(escHtml(orig), `<mark>${escHtml(orig)}</mark>`)
      }
    }
    return out
  }
  function emptyState(q) {
    return `<div class="search__empty">${ICON.box}<p>${q ? `Não achamos <strong>“${escHtml(q)}”</strong> no site — mas a loja tem muito mais coisa no balcão.` : ''}</p>
      ${q ? `<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><a class="btn btn--wa btn--sm" target="_blank" rel="noopener" href="${waUrl(`Olá, ${DATA.name}! Vocês têm ${q}?`)}">${ICON.wa}Perguntar no WhatsApp</a><button class="btn btn--ghost btn--sm" data-add="${escHtml(q)}" data-cat="">${ICON.plus}Pôr “${escHtml(q.slice(0, 24))}” na lista</button></div>` : ''}</div>`
  }
  function renderPopular() {
    sResults.innerHTML = `<p class="search__label">Mais procurados</p><div class="search__pop">${POPULAR.map((p) => `<button type="button" data-pop="${escHtml(p)}">${escHtml(p)}</button>`).join('')}</div>`
  }
  async function doSearch(q) {
    const idx = await loadIndex()
    const terms = norm(q).split(/\s+/).filter(Boolean)
    if (!terms.length) { renderPopular(); return }
    const scored = []
    for (const it of idx) {
      let score = 0, ok = true
      for (const t of terms) {
        const p = it.k.indexOf(t)
        if (p < 0) { ok = false; break }
        score += p === 0 ? 3 : it.k[p - 1] === ' ' ? 2 : 1
        if (norm(it.n).includes(t)) score += 2
      }
      if (ok) scored.push([score - (it.t ? 1 : 0), it])
    }
    scored.sort((a, b) => b[0] - a[0])
    const top = scored.slice(0, 12).map((x) => x[1])
    sel = -1
    if (!top.length) { sResults.innerHTML = emptyState(q.trim()); return }
    const prods = top.filter((x) => !x.t), gs = top.filter((x) => x.t)
    sResults.innerHTML =
      (prods.length ? `<p class="search__label">Produtos</p>` + prods.map((it) => `<div class="sres" role="option" aria-selected="false"><span class="sres__ico">${ICON.box}</span><div class="sres__main"><a href="${it.u}">${highlight(it.n, terms)}</a><small>${escHtml(it.g)} · ${escHtml(it.c)}</small></div><button type="button" class="btn btn--yellow btn--sm sres__add" data-add="${escHtml(it.n)}" data-cat="${escHtml(it.c)}" aria-label="Adicionar ${escHtml(it.n)} à lista">${ICON.plus}<span>Lista</span></button></div>`).join('') : '') +
      (gs.length ? `<p class="search__label">Guias</p>` + gs.map((it) => `<div class="sres" role="option" aria-selected="false"><span class="sres__ico">${ICON.book}</span><div class="sres__main"><a href="${it.u}">${highlight(it.n, terms)}</a><small>${escHtml(it.g)} · ${escHtml(it.c)}</small></div></div>`).join('') : '') +
      `<p class="search__label">Não achou a medida certa?</p><div class="search__pop"><a class="btn btn--wa btn--sm" target="_blank" rel="noopener" href="${waUrl(`Olá, ${DATA.name}! Vocês têm ${q.trim()}?`)}">${ICON.wa}Perguntar “${escHtml(q.trim().slice(0, 28))}” no WhatsApp</a></div>`
  }
  let sT
  sInput && sInput.addEventListener('input', () => { clearTimeout(sT); sT = setTimeout(() => doSearch(sInput.value), 90) })
  sInput && sInput.addEventListener('keydown', (e) => {
    const opts = $$('.sres', sResults)
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!opts.length) return
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length
      opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === sel)))
      opts[sel].scrollIntoView({ block: 'nearest' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = opts[sel > -1 ? sel : 0]
      if (o) location.href = $('a', o).href
    }
  })
  sResults && sResults.addEventListener('click', (e) => {
    const p = e.target.closest('[data-pop]')
    if (p) { sInput.value = p.dataset.pop; doSearch(p.dataset.pop); sInput.focus() }
    if (e.target.closest('a')) closeLayer(searchEl)
  })
  function openSearch(q = '') {
    closeLayer(listEl)
    openLayer(searchEl, '[data-search-input]')
    sInput.value = q
    q ? doSearch(q) : renderPopular()
    loadIndex()
  }
  $$('[data-search-open]').forEach((b) => b.addEventListener('click', () => openSearch()))
  $$('[data-search-close]').forEach((b) => b.addEventListener('click', () => closeLayer(searchEl)))
  document.addEventListener('keydown', (e) => {
    if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch() }
  })
  // busca do hero abre o painel com o termo
  const hs = $('[data-hero-search]')
  if (hs) {
    const hi = $('input', hs)
    hs.addEventListener('submit', (e) => { e.preventDefault(); openSearch(hi.value) })
    hi.addEventListener('input', () => { if (hi.value.length >= 2) { const v = hi.value; hi.value = ''; openSearch(v) } })
    // placeholder "digitando"
    if (!reduce) {
      const words = ['fio flexível 2,5 mm²', 'tinta acrílica 18 litros', 'disco de corte', 'fita de LED 5 metros', 'resistência de chuveiro', 'mangueira por metro', 'disjuntor 40 A', 'WD-40']
      let wi = 0, ci = 0, del = false
      const base = 'Busque: '
      const tick = () => {
        if (document.activeElement === hi) { setTimeout(tick, 600); return }
        const w = words[wi]
        ci += del ? -1 : 1
        hi.setAttribute('placeholder', base + w.slice(0, ci) + (ci % 2 ? '|' : ''))
        if (!del && ci === w.length) { del = true; setTimeout(tick, 1500); return }
        if (del && ci === 0) { del = false; wi = (wi + 1) % words.length }
        setTimeout(tick, del ? 35 : 75)
      }
      setTimeout(tick, 1800)
    }
  }

  /* ------------------------------------------------- aberto agora */
  const DAYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa']
  const DAY_PT = { su: 'domingo', mo: 'segunda', tu: 'terça', we: 'quarta', th: 'quinta', fr: 'sexta', sa: 'sábado' }
  const fmt = (t) => { const [h, m] = t.split(':'); return m === '00' ? `${+h}h` : `${+h}h${m}` }
  function openState() {
    if (!DATA.hours) return null
    let parts
    try {
      parts = new Intl.DateTimeFormat('en-US', { timeZone: DATA.tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())
    } catch { return null }
    const wd = parts.find((p) => p.type === 'weekday').value.slice(0, 2).toLowerCase()
    const mins = +parts.find((p) => p.type === 'hour').value * 60 + +parts.find((p) => p.type === 'minute').value
    const toM = (t) => { const [h, m] = t.split(':'); return +h * 60 + +m }
    const today = DATA.hours.find((h) => h.days.includes(wd))
    if (today && mins >= toM(today.opens) && mins < toM(today.closes)) return { open: true, text: `Aberto agora · fecha às ${fmt(today.closes)}` }
    if (today && mins < toM(today.opens)) return { open: false, text: `Fechado · abre hoje às ${fmt(today.opens)}` }
    const di = DAYS.indexOf(wd)
    for (let k = 1; k <= 7; k++) {
      const d = DAYS[(di + k) % 7]
      const h = DATA.hours.find((x) => x.days.includes(d))
      if (h) return { open: false, text: `Fechado · abre ${k === 1 ? 'amanhã' : DAY_PT[d]} às ${fmt(h.opens)}` }
    }
    return null
  }
  const st = openState()
  if (st) {
    $$('[data-open-badge]').forEach((b) => {
      b.classList.add(st.open ? 'is-open' : 'is-closed')
      const span = $('span', b)
      if (b.classList.contains('open-badge--inline')) b.textContent = st.open ? 'Aberto agora' : 'Fechado agora'
      else if (span) span.textContent = st.text
      else {
        const svg = $('svg', b)
        b.textContent = ''
        svg && b.append(svg)
        b.append(document.createTextNode(st.text))
      }
    })
  }

  /* ------------------------------------------------------ calculadora */
  const PACKS = [
    { l: 18, name: 'lata de 18 L', plural: 'latas de 18 L', cost: 4 },
    { l: 3.6, name: 'galão de 3,6 L', plural: 'galões de 3,6 L', cost: 1 },
    { l: 0.9, name: 'quarto de 0,9 L', plural: 'quartos de 0,9 L', cost: 0.38 },
  ]
  // Combinação de embalagens que cobre `need` litros com o menor "custo"
  // relativo (lata ≈ 4 galões, quarto ≈ 0,38 galão) e, no empate, a menor
  // sobra. Na prática: lata a partir de ~14,4 L.
  function bestPack(need) {
    if (need <= 0) return null
    let best = null
    const max18 = Math.ceil(need / 18) + 1
    for (let a = 0; a <= max18; a++) {
      for (let b = 0; b <= 4; b++) {
        for (let c = 0; c <= 3; c++) {
          const vol = a * 18 + b * 3.6 + c * 0.9
          if (vol + 1e-9 < need) continue
          const cost = a * PACKS[0].cost + b * PACKS[1].cost + c * PACKS[2].cost
          const waste = vol - need
          if (!best || cost < best.cost - 1e-9 || (Math.abs(cost - best.cost) < 1e-9 && waste < best.waste)) best = { a, b, c, vol, cost, waste }
        }
      }
    }
    return best
  }
  const nf = (n, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })
  function packText(p) {
    if (!p) return '—'
    const parts = []
    ;[p.a, p.b, p.c].forEach((n, i) => { if (n) parts.push(`${n} ${n > 1 ? PACKS[i].plural : PACKS[i].name}`) })
    return parts.join(' + ')
  }
  $$('[data-calc]').forEach((calc) => {
    const form = $('[data-calc-form]', calc)
    const out = { l: $('[data-calc-liters]', calc), pack: $('[data-calc-pack]', calc), area: $('[data-calc-area-out]', calc) }
    const wa = $('[data-calc-wa]', calc)
    let last = null
    const num = (n) => Math.max(0, parseFloat(String(form[n].value).replace(',', '.')) || 0)
    function calcNow() {
      const mode = form.modo.value
      $('[data-calc-room]', calc).hidden = mode !== 'comodo'
      $('[data-calc-area]', calc).hidden = mode !== 'area'
      let area, detail
      if (mode === 'comodo') {
        const L = num('largura'), C = num('comprimento'), H = num('altura')
        const walls = Math.max(0, 2 * (L + C) * H - num('portas') * 1.68 - num('janelas') * 1.2)
        const ceil = form.teto.checked ? L * C : 0
        area = walls + ceil
        detail = `Paredes: ${nf(walls, 2)} m²${ceil ? ` · Teto: ${nf(ceil, 2)} m²` : ''}`
      } else {
        area = num('area')
        detail = `Área informada: ${nf(area, 2)} m²`
      }
      const coats = +form.demaos.value
      const yieldM2 = +form.superficie.value
      const liters = (area * coats / yieldM2) * 1.1
      const p = bestPack(liters)
      last = { liters, p, area, coats }
      out.l.textContent = nf(liters, 1)
      out.l.classList.remove('tick'); void out.l.offsetWidth; out.l.classList.add('tick')
      out.pack.textContent = p ? `Sugestão: ${packText(p)}` : 'Informe as medidas'
      out.area.textContent = `${detail} · ${coats} ${coats > 1 ? 'demãos' : 'demão'} · ${nf(area * coats, 1)} m² de pintura`
      if (wa) wa.href = waUrl(`Olá, ${DATA.name}! Usei a calculadora do site: preciso de cerca de ${nf(liters, 1)} litros de tinta (${packText(p)}) para ${nf(area, 1)} m², ${coats} demãos. Cor/acabamento: `)
    }
    form.addEventListener('input', calcNow)
    form.addEventListener('change', calcNow)
    form.addEventListener('submit', (e) => e.preventDefault())
    $('[data-calc-add]', calc)?.addEventListener('click', () => {
      if (!last?.p) return
      ;[last.p.a, last.p.b, last.p.c].forEach((n, i) => { if (n) add(`Tinta — ${PACKS[i].name}`, 'Tintas e Pintura', n, true) })
      toast(`Tinta para ${nf(last.area, 1)} m² na lista`, { label: 'Ver lista', fn: () => openLayer(listEl) })
    })
    calcNow()
  })

  /* --------------------------------------------- formulário → WhatsApp */
  $$('[data-wa-form]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!f.reportValidity()) return
    const d = new FormData(f)
    window.open(waUrl(`Olá, ${DATA.name}! Meu nome é ${d.get('nome')}.\nAssunto: ${d.get('assunto')}\n\n${d.get('mensagem')}`), '_blank', 'noopener')
  }))

  /* ------------------------------------------------------------ mapa */
  $$('[data-map]').forEach((m) => {
    const load = () => {
      if (m.dataset.loaded) return
      m.dataset.loaded = '1'
      const f = document.createElement('iframe')
      f.src = m.dataset.src
      f.title = `Mapa: ${DATA.name}`
      f.loading = 'lazy'
      f.referrerPolicy = 'no-referrer-when-downgrade'
      f.allowFullscreen = true
      m.append(f)
      setTimeout(() => $('.map__ph', m)?.remove(), 600)
    }
    $('[data-map-load]', m)?.addEventListener('click', load)
  })

  /* ------------------------------------------------ reveal on scroll */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target) } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null
  $$('[data-reveal], .phone').forEach((el) => (io ? io.observe(el) : el.classList.add('in-view')))

  /* ------------------------------------------- subnav: seção ativa */
  const sub = $$('.subnav a')
  if (sub.length && 'IntersectionObserver' in window) {
    const map = new Map(sub.map((a) => [a.getAttribute('href').slice(1), a]))
    const so = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.isIntersecting) {
        sub.forEach((a) => a.classList.remove('is-active'))
        const a = map.get(en.target.id)
        if (a) { a.classList.add('is-active'); a.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' }) }
      }
    }), { rootMargin: '-40% 0px -55% 0px' })
    map.forEach((_, id) => { const el = document.getElementById(id); el && so.observe(el) })
  }

  /* --------------------------------------- luz que segue o cursor */
  const spot = $('[data-spot]')
  if (spot && !reduce) {
    let raf = 0, tx = 70, ty = 40, cx = 70, cy = 40, auto = !matchMedia('(hover: hover)').matches, t0 = performance.now()
    spot.addEventListener('pointermove', (e) => {
      auto = false
      const r = spot.getBoundingClientRect()
      tx = ((e.clientX - r.left) / r.width) * 100
      ty = ((e.clientY - r.top) / r.height) * 100
    })
    spot.addEventListener('pointerleave', () => { auto = true })
    const loop = (t) => {
      if (auto) { const k = (t - t0) / 3200; tx = 62 + Math.cos(k) * 22; ty = 42 + Math.sin(k * 1.3) * 18 }
      cx += (tx - cx) * 0.08
      cy += (ty - cy) * 0.08
      spot.style.setProperty('--mx', cx + '%')
      spot.style.setProperty('--my', cy + '%')
      raf = requestAnimationFrame(loop)
    }
    const vis = new IntersectionObserver(([en]) => { if (en.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop) } else { cancelAnimationFrame(raf); raf = 0 } })
    vis.observe(spot)
  }

  /* -------------------------------- dica do botão de WhatsApp (1x) */
  const fabWa = $('.fab-wa')
  if (fabWa && !store.get('pereira:tip', false)) {
    setTimeout(() => { fabWa.classList.add('show-tip'); setTimeout(() => fabWa.classList.remove('show-tip'), 4200); store.set('pereira:tip', true) }, 6000)
  }
})()
