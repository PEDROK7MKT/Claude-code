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

  document.documentElement.classList.replace('no-js', 'js')
  let motionOff = store.get('pereira:sem-animacao', false)
  const applyMotion = () => {
    document.documentElement.classList.toggle('no-motion', motionOff)
    $$('[data-motion-toggle]').forEach((b) => { b.setAttribute('aria-pressed', String(motionOff)); b.textContent = motionOff ? 'Ativar animações' : 'Pausar animações' })
  }
  applyMotion()
  $$('[data-motion-toggle]').forEach((b) => b.addEventListener('click', () => { motionOff = !motionOff; store.set('pereira:sem-animacao', motionOff); applyMotion() }))
  const still = () => reduce || motionOff

  /* ------------------------------------------------------------ toast */
  const toastEl = $('[data-toast]')
  let toastT
  const hideToast = () => toastEl.classList.remove('is-on')
  function toast(html, action) {
    if (!toastEl) return
    toastEl.innerHTML = `${ICON.check}<span>${html}</span>`
    if (action) {
      const b = document.createElement('button')
      b.type = 'button'
      b.textContent = action.label
      b.addEventListener('click', () => { hideToast(); action.fn() })
      toastEl.append(b)
    }
    toastEl.classList.add('is-on')
    clearTimeout(toastT)
    toastT = setTimeout(hideToast, action ? 7000 : 3200)
  }
  if (toastEl) {
    const hold = () => clearTimeout(toastT)
    const release = () => { clearTimeout(toastT); toastT = setTimeout(hideToast, 2500) }
    toastEl.addEventListener('mouseenter', hold)
    toastEl.addEventListener('focusin', hold)
    toastEl.addEventListener('mouseleave', release)
    toastEl.addEventListener('focusout', release)
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
    let hoverT, openedByHover = false
    const set = (open) => { megaBtn.setAttribute('aria-expanded', String(open)); mega.classList.toggle('is-open', open); if (!open) openedByHover = false }
    megaBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (openedByHover) { openedByHover = false; set(true); return }
      set(megaBtn.getAttribute('aria-expanded') !== 'true')
    })
    if (matchMedia('(hover: hover)').matches) {
      li.addEventListener('mouseenter', () => { clearTimeout(hoverT); if (!mega.classList.contains('is-open')) { set(true); openedByHover = true } })
      li.addEventListener('mouseleave', () => { hoverT = setTimeout(() => set(false), 350) })
    }
    document.addEventListener('click', (e) => { if (!li.contains(e.target)) set(false) })
    li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) set(false) })
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || megaBtn.getAttribute('aria-expanded') !== 'true') return
      const inside = mega.contains(document.activeElement)
      set(false)
      if (inside) megaBtn.focus()
    })
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
    if (el.matches('[data-menu]')) $$('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'))
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
  const undoBtn = $('[data-list-undo]')
  let backup = null
  if (noteEl) noteEl.value = store.get(KEY + ':obs', '')

  const count = () => list.reduce((n, i) => n + i.q, 0)
  function save() { store.set(KEY, list); render() }
  function saveQuiet() { store.set(KEY, list); renderCounts() }
  function render() { renderCounts(); renderItems() }
  function renderCounts() {
    const n = count()
    $$('[data-list-count]').forEach((b) => { b.textContent = n; b.hidden = n === 0 })
    $$('.icon-btn--list').forEach((b) => b.setAttribute('aria-label', n ? `Minha lista de orçamento, ${n} ${n > 1 ? 'itens' : 'item'}` : 'Minha lista de orçamento'))
    if (fab) fab.hidden = n === 0
    const names = new Set(list.map((i) => i.n))
    $$('[data-add]').forEach((b) => {
      const on = names.has(b.dataset.add)
      b.classList.toggle('is-added', on)
      if (b.classList.contains('chip')) b.setAttribute('aria-pressed', String(on))
    })
  }
  function renderItems() {
    if (!itemsEl) return
    // lembra o controle focado para devolver o foco depois de redesenhar
    const f = document.activeElement
    const keep = f && itemsEl.contains(f) ? (f.dataset.q ? `[data-q="${f.dataset.q}"][data-i="${f.dataset.i}"]` : f.dataset.qi ? `[data-qi="${f.dataset.qi}"]` : f.dataset.rm ? 'rm' : null) : null
    emptyEl.hidden = list.length > 0
    itemsEl.innerHTML = list
      .map(
        (it, i) => `<li class="qitem"><span class="qitem__name">${escHtml(it.n)}${it.c ? `<small>${escHtml(it.c)}</small>` : ''}</span>
        <span class="qty"><button type="button" data-q="-1" data-i="${i}" aria-label="Diminuir ${escHtml(it.n)}">${ICON.minus}</button><input type="number" min="1" value="${it.q}" data-qi="${i}" aria-label="Quantidade de ${escHtml(it.n)}"><button type="button" data-q="1" data-i="${i}" aria-label="Aumentar ${escHtml(it.n)}">${ICON.plus}</button></span>
        <button type="button" class="qitem__rm" data-rm="${i}" aria-label="Remover ${escHtml(it.n)}">${ICON.x}</button></li>`,
      )
      .join('')
    if (keep === 'rm') ($('[data-rm]', itemsEl) || $('#qadd-input'))?.focus()
    else if (keep) $(keep, itemsEl)?.focus()
  }
  function bump() { $$('.badge[data-list-count]').forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump') }) }
  function add(name, cat = '', q = 1, silent = false) {
    name = String(name).trim()
    if (!name) return
    const found = list.find((i) => norm(i.n) === norm(name))
    if (found) found.q += q
    else list.push({ n: name, c: cat, q })
    if (undoBtn) undoBtn.hidden = true
    save()
    bump()
    if (!silent) toast(`<b>${escHtml(name)}</b> na lista`, { label: 'Ver lista', fn: openList })
  }
  window.PereiraLista = { add }
  function openList() { closeLayer(searchEl); closeLayer(menu); openLayer(listEl, '.drawer__panel button') }

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
    if (q) {
      const i = +q.dataset.i, it = list[i]
      it.q = Math.max(1, it.q + +q.dataset.q)
      const inp = $(`[data-qi="${i}"]`, itemsEl)
      if (inp) inp.value = it.q
      saveQuiet()
    }
    if (rm) { list.splice(+rm.dataset.rm, 1); save() }
  })
  itemsEl && itemsEl.addEventListener('change', (e) => {
    const inp = e.target.closest('[data-qi]')
    if (inp) { const v = Math.max(1, parseInt(inp.value, 10) || 1); list[+inp.dataset.qi].q = v; inp.value = v; saveQuiet() }
  })
  // sincroniza a lista entre abas
  addEventListener('storage', (e) => {
    if (e.key === KEY) { list = store.get(KEY, []); render() }
    if (e.key === KEY + ':obs' && noteEl) noteEl.value = store.get(KEY + ':obs', '')
  })
  noteEl && noteEl.addEventListener('input', () => store.set(KEY + ':obs', noteEl.value))
  $('[data-list-addform]')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const inp = e.target.item
    add(inp.value, '', 1, true)
    inp.value = ''
    inp.focus()
  })
  $$('[data-list-open]').forEach((b) => b.addEventListener('click', openList))
  $$('[data-list-close]').forEach((b) => b.addEventListener('click', () => closeLayer(listEl)))
  $('[data-list-clear]')?.addEventListener('click', () => {
    if (!list.length) return
    backup = list.slice()
    list = []
    save()
    if (undoBtn) { undoBtn.hidden = false; undoBtn.focus() }
  })
  undoBtn?.addEventListener('click', () => {
    if (backup) { list = backup; backup = null; save() }
    undoBtn.hidden = true
    $('[data-list-send]')?.focus()
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
  const sStatus = $('[data-search-status]')
  const announce = (t) => { if (sStatus) sStatus.textContent = t }
  let INDEX = null
  const POPULAR = ['Fio 2,5 mm²', 'Disjuntor', 'Resistência de chuveiro', 'Fita de LED', 'Tinta acrílica', 'Massa corrida', 'Disco de corte', 'Mangueira', 'WD-40', "Caixa d'água"]
  // normalização da busca: sem acento, ² → 2, 2.5 → 2,5, "40a" → "40 a", aspas unificadas
  const qn = (s) => norm(s).replace(/[’‘´`']/g, '').replace(/²/g, '2').replace(/(\d)\.(\d)/g, '$1,$2').replace(/([a-z])-(\d)/g, '$1$2').replace(/(\d)([a-z])/g, '$1 $2')
  const STOP = new Set(['a', 'o', 'e', 'de', 'da', 'do', 'das', 'dos', 'em', 'para', 'pra', 'com', 'v', 'w', 'l', 'm', 'mm', 'mm2', 'cm', 'kg', 'x', 'litro', 'litros', 'metro', 'metros', 'tem', 'voces', 'quero', 'd'])
  let INDEX_P = null
  const loadIndex = () => (INDEX_P ||= fetch('/assets/search-index.json?v=' + (DATA.searchV || ''))
    .then((r) => r.json())
    .then((idx) => idx.map((it) => ({ ...it, k: qn(it.k), nn: qn(it.n) })))
    .catch(() => { INDEX_P = null; return [] }))
  function highlight(text, terms) {
    // calcula os trechos no texto puro e monta o HTML uma vez só
    const nt = qn(text)
    if (nt.length !== text.length) return escHtml(text)
    const ranges = []
    for (const t of terms) {
      if (t.length < 2) continue
      let i = nt.indexOf(t)
      while (i > -1) { ranges.push([i, i + t.length]); i = nt.indexOf(t, i + t.length) }
    }
    if (!ranges.length) return escHtml(text)
    ranges.sort((a, b) => a[0] - b[0])
    const merged = [ranges[0].slice()]
    for (const r of ranges.slice(1)) { const last = merged[merged.length - 1]; if (r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else merged.push(r.slice()) }
    let out = '', prev = 0
    for (const [a, b] of merged) { out += escHtml(text.slice(prev, a)) + '<mark>' + escHtml(text.slice(a, b)) + '</mark>'; prev = b }
    return out + escHtml(text.slice(prev))
  }
  function emptyState(q) {
    return `<div class="search__empty">${ICON.box}<p>${q ? `Não achamos <strong>“${escHtml(q)}”</strong> no site — mas a loja tem muito mais coisa no balcão.` : ''}</p>
      ${q ? `<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><a class="btn btn--wa btn--sm" target="_blank" rel="noopener" href="${waUrl(`Olá, ${DATA.name}! Vocês têm ${q}?`)}">${ICON.wa}Perguntar no WhatsApp</a><button class="btn btn--ghost btn--sm" data-add="${escHtml(q)}" data-cat="">${ICON.plus}Pôr “${escHtml(q.length > 24 ? q.slice(0, 24).trimEnd() + '…' : q)}” na lista</button></div>` : ''}</div>`
  }
  function renderPopular() {
    sResults.innerHTML = `<p class="search__label">Mais procurados</p><div class="search__pop">${POPULAR.map((p) => `<button type="button" data-pop="${escHtml(p)}">${escHtml(p)}</button>`).join('')}</div>`
  }
  async function doSearch(q) {
    const idx = await loadIndex()
    const all = qn(q).split(/\s+/).filter(Boolean)
    if (!all.length) { renderPopular(); announce(''); return }
    // palavras obrigatórias; números e unidades só somam pontos
    let need = all.filter((t) => !STOP.has(t) && !/^\d/.test(t))
    const extra = all.filter((t) => /^\d/.test(t))
    if (!need.length) need = extra.length ? extra.slice(0, 1) : all
    const terms = [...new Set([...need, ...extra])]
    const scoreOf = (it, strict) => {
      let score = 0, hits = 0
      for (const t of need) {
        const p = it.k.indexOf(t)
        if (p < 0) { if (strict) return -1; continue }
        hits++
        score += p === 0 ? 3 : it.k[p - 1] === ' ' ? 2 : 1
        if (it.nn.includes(t)) score += 2
      }
      for (const t of extra) if (it.k.includes(t)) score += 3
      return strict ? score : hits ? score + hits * 2 : -1
    }
    let scored = []
    for (const it of idx) { const sc = scoreOf(it, true); if (sc >= 0) scored.push([sc - (it.t ? 1 : 0), it]) }
    if (!scored.length && need.length > 1) for (const it of idx) { const sc = scoreOf(it, false); if (sc > 0) scored.push([sc - (it.t ? 1 : 0), it]) }
    scored.sort((a, b) => b[0] - a[0])
    const top = scored.slice(0, 12).map((x) => x[1])
    if (!top.length) { sResults.innerHTML = emptyState(q.trim()); announce('Nenhum resultado. Você pode perguntar no WhatsApp.'); return }
    announce(`${top.length} ${top.length > 1 ? 'resultados' : 'resultado'}`)
    const prods = top.filter((x) => !x.t), gs = top.filter((x) => x.t)
    sResults.innerHTML =
      (prods.length ? `<p class="search__label" id="sl-prod">Produtos</p><ul class="sres-list" aria-labelledby="sl-prod">` + prods.map((it) => `<li class="sres"><span class="sres__ico">${ICON.box}</span><div class="sres__main"><a href="${it.u}">${highlight(it.n, terms)}</a><small>${escHtml(it.g)} · ${escHtml(it.c)}</small></div><button type="button" class="btn btn--yellow btn--sm sres__add" data-add="${escHtml(it.n)}" data-cat="${escHtml(it.c)}" aria-label="Pôr na lista: ${escHtml(it.n)}">${ICON.plus}<span>Lista</span></button></li>`).join('') + '</ul>' : '') +
      (gs.length ? `<p class="search__label" id="sl-guia">Guias</p><ul class="sres-list" aria-labelledby="sl-guia">` + gs.map((it) => `<li class="sres"><span class="sres__ico">${ICON.book}</span><div class="sres__main"><a href="${it.u}">${highlight(it.n, terms)}</a><small>${escHtml(it.g)} · ${escHtml(it.c)}</small></div></li>`).join('') + '</ul>' : '') +
      `<p class="search__label">Não achou a medida certa?</p><div class="search__pop"><a class="btn btn--wa btn--sm" target="_blank" rel="noopener" href="${waUrl(`Olá, ${DATA.name}! Vocês têm ${q.trim()}?`)}">${ICON.wa}Perguntar “${escHtml(q.trim().length > 28 ? q.trim().slice(0, 28).trimEnd() + '…' : q.trim())}” no WhatsApp</a></div>`
  }
  let sT
  sInput && sInput.addEventListener('input', () => { clearTimeout(sT); sT = setTimeout(() => doSearch(sInput.value), 90) })
  // setas: do campo para os resultados e entre os links (foco real)
  sInput && sInput.addEventListener('keydown', (e) => {
    const links = $$('.sres__main a', sResults)
    if (e.key === 'ArrowDown' && links.length) { e.preventDefault(); links[0].focus() }
    else if (e.key === 'Enter') { e.preventDefault(); if (links[0]) { const href = links[0].href; closeLayer(searchEl); location.href = href } }
  })
  sResults && sResults.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const links = $$('.sres__main a', sResults)
    const i = links.indexOf(document.activeElement)
    if (i < 0) return
    e.preventDefault()
    if (e.key === 'ArrowUp' && i === 0) sInput.focus()
    else links[Math.min(links.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus()
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
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); openSearch() }
  })
  // busca do hero abre o painel com o termo
  const hs = $('[data-hero-search]')
  let heroVisible = true
  if (hs && 'IntersectionObserver' in window) new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting }).observe(hs)
  if (hs) {
    const hi = $('input', hs)
    hs.addEventListener('submit', (e) => { e.preventDefault(); openSearch(hi.value) })
    // placeholder "digitando"
    if (!reduce) {
      const words = ['fio flexível 2,5 mm²', 'tinta acrílica 18 litros', 'disco de corte', 'fita de LED 5 metros', 'resistência de chuveiro', 'mangueira por metro', 'disjuntor 40 A', 'WD-40']
      let wi = 0, ci = 0, del = false
      const base = 'Busque: '
      const tick = () => {
        if (motionOff) { hi.setAttribute('placeholder', 'Busque: fio, tinta, disco de corte…'); setTimeout(tick, 1500); return }
        if (!heroVisible || document.hidden) { setTimeout(tick, 800); return }
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
  function paintBadges() {
  const st = openState()
  if (st) {
    $$('[data-open-badge]').forEach((b) => {
      b.classList.remove('is-open', 'is-closed')
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
  }
  paintBadges()
  setInterval(paintBadges, 60000)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) paintBadges() })

  /* ------------------------------------------------------ calculadora */
  const PACKS = [
    { l: 18, name: 'lata de 18\u00a0L', plural: 'latas de 18\u00a0L', cost: 4 },
    { l: 3.6, name: 'galão de 3,6\u00a0L', plural: 'galões de 3,6\u00a0L', cost: 1 },
    { l: 0.9, name: 'quarto de 0,9\u00a0L', plural: 'quartos de 0,9\u00a0L', cost: 0.38 },
  ]
  // Combinação de embalagens que cobre `need` litros com o menor "custo"
  // relativo (lata ≈ 4 galões, quarto ≈ 0,38 galão) e, no empate, a menor
  // sobra. Na prática: lata a partir de ~14,4 L.
  function bestPack(need) {
    if (need <= 0) return null
    if (!isFinite(need)) return null
    let best = null
    const base = Math.max(0, Math.floor(need / 18) - 1)
    for (let a = base; a <= base + 2; a++) {
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
    const sr = $('[data-calc-sr]', calc)
    let last = null, srT
    const num = (n) => Math.min(10000, Math.max(0, parseFloat(String(form[n].value).replace(/\s/g, '').replace(',', '.')) || 0))
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
      out.l.textContent = nf(Math.ceil(liters * 10) / 10, 1)
      out.l.classList.remove('tick'); void out.l.offsetWidth; out.l.classList.add('tick')
      out.pack.textContent = p ? `Sugestão: ${packText(p)}` : 'Informe as medidas'
      clearTimeout(srT)
      srT = setTimeout(() => { if (sr) sr.textContent = p ? `Aproximadamente ${nf(liters, 1)} litros: ${packText(p)}.` : '' }, 700)
      out.area.textContent = `${detail} · ${coats} ${coats > 1 ? 'demãos' : 'demão'} · ${nf(area * coats, 1)} m² de pintura`
      if (wa) {
        wa.href = waUrl(`Olá, ${DATA.name}! Usei a calculadora do site: preciso de cerca de ${nf(Math.ceil(liters * 10) / 10, 1)} litros de tinta (${packText(p)}) para ${nf(area, 1)} m², ${coats} ${coats > 1 ? 'demãos' : 'demão'}. Cor/acabamento: `)
        wa.toggleAttribute('aria-disabled', !p)
      }
    }
    form.addEventListener('input', calcNow)
    form.addEventListener('change', calcNow)
    form.addEventListener('submit', (e) => e.preventDefault())
    $('[data-calc-add]', calc)?.addEventListener('click', () => {
      if (!last?.p) { toast('Informe as medidas para calcular'); return }
      ;[last.p.a, last.p.b, last.p.c].forEach((n, i) => { if (n) add(`Tinta — ${PACKS[i].name}`, 'Tintas e Pintura', n, true) })
      toast(`Tinta para ${nf(last.area, 1)} m² na lista`, { label: 'Ver lista', fn: openList })
    })
    calcNow()
  })

  /* --------------------------------------------- formulário → WhatsApp */
  $$('[data-wa-form] input, [data-wa-form] textarea').forEach((el) => el.addEventListener('input', () => el.setCustomValidity('')))
  $$('[data-wa-form]').forEach((f) => f.addEventListener('submit', (e) => {
    e.preventDefault()
    for (const n of ['nome', 'mensagem']) { const el = f.elements[n]; if (el) el.setCustomValidity(el.value.trim() ? '' : 'Preencha este campo') }
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
      const route = $('.map__btns a', m)
      setTimeout(() => {
        $('.map__ph', m)?.remove()
        if (route) { route.classList.add('map__route'); route.classList.replace('btn--ghost', 'btn--yellow'); m.append(route) }
        f.focus()
      }, 600)
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
        if (a) {
          a.classList.add('is-active')
          const box = a.parentElement
          if (box.scrollWidth > box.clientWidth) {
            const left = a.getBoundingClientRect().left - box.getBoundingClientRect().left + box.scrollLeft - (box.clientWidth - a.offsetWidth) / 2
            box.scrollTo({ left, behavior: still() ? 'auto' : 'smooth' })
          }
        }
      }
    }), { rootMargin: '-40% 0px -55% 0px' })
    map.forEach((_, id) => { const el = document.getElementById(id); el && so.observe(el) })
  }

  /* --------------------------------------- luz que segue o cursor */
  const spot = $('[data-spot]')
  const glow = spot && $('.hero__glow', spot)
  if (spot && glow && !reduce && matchMedia('(hover: hover)').matches) {
    let raf = 0, tx = 70, ty = 40, cx = 70, cy = 40, auto = true, t0 = performance.now()
    spot.addEventListener('pointermove', (e) => {
      auto = false
      const r = spot.getBoundingClientRect()
      tx = ((e.clientX - r.left) / r.width) * 100
      ty = ((e.clientY - r.top) / r.height) * 100
    })
    spot.addEventListener('pointerleave', () => { auto = true })
    const loop = (t) => {
      if (motionOff) { raf = requestAnimationFrame(loop); return }
      if (auto) { const k = (t - t0) / 3200; tx = 62 + Math.cos(k) * 22; ty = 42 + Math.sin(k * 1.3) * 18 }
      cx += (tx - cx) * 0.08
      cy += (ty - cy) * 0.08
      glow.style.setProperty('--mx', cx.toFixed(2) + '%')
      glow.style.setProperty('--my', cy.toFixed(2) + '%')
      raf = requestAnimationFrame(loop)
    }
    const vis = new IntersectionObserver(([en]) => { if (en.isIntersecting) { if (!raf) raf = requestAnimationFrame(loop) } else { cancelAnimationFrame(raf); raf = 0 } })
    vis.observe(spot)
  }

  /* ------------- esconde o botão flutuante quando o CTA do topo está visível */
  const heroCta = $('.hero__ctas, .phero__ctas')
  const fabW = $('.fab-wa')
  if (heroCta && fabW && 'IntersectionObserver' in window) new IntersectionObserver(([en]) => fabW.classList.toggle('is-hidden', en.isIntersecting)).observe(heroCta)

  /* -------------------------------- dica do botão de WhatsApp (1x) */
  const fabWa = $('.fab-wa')
  if (fabWa && !store.get('pereira:tip', false)) {
    setTimeout(() => { fabWa.classList.add('show-tip'); setTimeout(() => fabWa.classList.remove('show-tip'), 4200); store.set('pereira:tip', true) }, 6000)
  }
})()
