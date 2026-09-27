// Agência Viva — movimento.
// GSAP + ScrollTrigger + SplitText + Lenis (em /assets/vendor).
// Sem JS ou com "reduzir movimento", o site continua completo e legível.
(() => {
  const doc = document.documentElement
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = matchMedia('(pointer: fine)').matches
  const hasG = !!(window.gsap && window.ScrollTrigger)
  doc.classList.remove('no-js')
  if (!hasG) doc.classList.add('no-gsap')
  let lenis = null

  // ─── menu mobile ───
  const burger = document.querySelector('.burger')
  const setMenu = open => {
    doc.classList.toggle('nav-open', open)
    burger && burger.setAttribute('aria-expanded', open)
    burger && burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu')
    if (lenis) open ? lenis.stop() : lenis.start()
    document.querySelectorAll('main, footer, .wa-float').forEach(el => { el.inert = open })
  }
  burger && burger.addEventListener('click', () => setMenu(!doc.classList.contains('nav-open')))
  addEventListener('keydown', e => { if (e.key === 'Escape' && doc.classList.contains('nav-open')) { setMenu(false); burger.focus() } })
  document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => setMenu(false)))

  // ─── header: some ao descer, volta ao subir ───
  const hdr = document.querySelector('.hdr')
  let lastY = 0
  const onScroll = y => {
    if (!hdr) return
    hdr.classList.toggle('is-scrolled', y > 30)
    if (y > 400 && y > lastY + 2 && !doc.classList.contains('nav-open')) hdr.classList.add('is-hidden')
    else if (y < lastY - 2 || y < 400) hdr.classList.remove('is-hidden')
    lastY = y
  }

  // ─── formulário "Quero um orçamento" → funil do CRM ───
  const aberto = Date.now()
  // o formulário muda de altura ao enviar: recalcula as animações de rolagem abaixo dele
  const relayout = () => { if (window.ScrollTrigger) requestAnimationFrame(() => ScrollTrigger.refresh()) }
  document.querySelectorAll('[data-lead-form]').forEach((form, i) => {
    const status = form.querySelector('.lf-status')
    status.id ||= 'lf-status-' + i
    const btn = form.querySelector('button[type=submit]')
    const campo = n => form.elements[n]
    const waLink = txt => `https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(txt)}`
    const erro = (msg, el) => {
      status.className = 'lf-status'; status.textContent = msg
      form.querySelectorAll('[aria-describedby]').forEach(f => f !== el && f.removeAttribute('aria-describedby'))
      // o motivo fica ligado ao campo: o leitor de tela lê junto quando o foco chega nele
      if (el) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', status.id); requestAnimationFrame(() => el.focus()) }
    }
    form.addEventListener('input', e => { e.target.removeAttribute('aria-invalid'); e.target.removeAttribute('aria-describedby') })
    form.addEventListener('submit', async e => {
      e.preventDefault()
      const nome = campo('nome').value.trim(), tel = campo('telefone').value.trim()
      const digitos = tel.replace(/\D/g, '')
      if (nome.length < 2) return erro('Coloca seu nome, por favor.', campo('nome'))
      if (digitos.length < 10 || digitos.length > 13) return erro('Confere o WhatsApp com DDD, tipo (77) 9 9999-9999.', campo('telefone'))
      const dados = { p_nome: nome, p_telefone: tel, p_cidade: campo('cidade').value, p_servico: campo('servico').value, p_mensagem: campo('mensagem').value.trim() }
      const resumo = `Olá, Agência Viva! Sou ${nome}${dados.p_cidade ? ` (${dados.p_cidade})` : ''}.${dados.p_servico ? ` Tenho interesse em ${dados.p_servico}.` : ''}${dados.p_mensagem ? ' ' + dados.p_mensagem : ''}`
      // robô: campo escondido preenchido ou envio instantâneo → finge sucesso e não grava
      if (campo('site_empresa').value || Date.now() - aberto < 2500) { form.classList.add('sent'); status.className = 'lf-status ok'; status.textContent = 'Recebido!'; relayout(); return }
      btn.disabled = true; btn.textContent = 'Enviando…'
      try {
        const r = await fetch(form.dataset.endpoint, { method: 'POST', headers: { apikey: form.dataset.key, 'Content-Type': 'application/json' }, body: JSON.stringify(dados) })
        if (!r.ok) throw new Error(String(r.status))
        form.classList.add('sent')
        status.className = 'lf-status ok'
        status.innerHTML = `<b>Recebido, ${nome.split(' ')[0].replace(/[<>&"]/g, '')}!</b><br>A gente vai te chamar no WhatsApp. Se quiser adiantar a conversa:<br><a class="btn btn--main" target="_blank" rel="noopener"></a>`
        const a = status.querySelector('a'); a.href = waLink(resumo); a.textContent = 'Chamar no WhatsApp agora'
        status.setAttribute('tabindex', '-1')
        status.focus()
        relayout()
      } catch (err) {
        btn.disabled = false; btn.textContent = 'Enviar pedido'
        status.className = 'lf-status'
        status.innerHTML = 'Não conseguimos enviar agora. Manda direto no WhatsApp, que chega na hora: <br><a class="btn btn--main" target="_blank" rel="noopener"></a>'
        const a = status.querySelector('a'); a.href = waLink(resumo); a.textContent = 'Enviar pelo WhatsApp'
        relayout()
      }
    })
  })

  // ─── mapa interativo (funciona com ou sem animação) ───
  const mapWrap = document.querySelector('[data-map]')
  const setCity = slug => {
    if (!mapWrap) return
    const a = mapWrap.querySelector(`.map a[data-city="${slug}"]`)
    if (!a) return
    mapWrap.querySelectorAll('[data-city]').forEach(el => el.classList.toggle('is-on', el.dataset.city === slug))
    const info = mapWrap.querySelector('.map-info')
    if (info) {
      info.querySelector('b').textContent = a.dataset.name
      info.querySelector('.hand').textContent = a.dataset.dist
      info.querySelector('span:not(.hand)').textContent = a.dataset.niches
      const link = info.querySelector('a')
      link.href = a.getAttribute('href')
      link.textContent = `Ver marketing em ${a.dataset.name} →`
    }
    const route = mapWrap.querySelector('.route')
    if (route) {
      const [bx, by] = route.dataset.from.split(',').map(Number)
      const [cx, cy] = a.dataset.xy.split(',').map(Number)
      route.setAttribute('d', slug === 'barreiras' ? '' : `M${bx},${by - 20} Q${(bx + cx) / 2 + 60},${Math.min(by, cy) - 80} ${cx},${cy - 20}`)
      if (window.gsap && slug !== 'barreiras' && !reduce) {
        const l = route.getTotalLength()
        gsap.fromTo(route, { strokeDashoffset: l }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' })
      }
    }
  }
  if (mapWrap) {
    mapWrap.querySelectorAll('[data-city]').forEach(el => {
      el.addEventListener('mouseenter', () => setCity(el.dataset.city))
      el.addEventListener('focus', () => setCity(el.dataset.city))
      el.addEventListener('click', e => { if (!fine && !el.classList.contains('is-on')) { e.preventDefault(); setCity(el.dataset.city) } })
    })
    setCity('barreiras')
  }

  if (reduce || !hasG) {
    addEventListener('scroll', () => onScroll(scrollY), { passive: true })
    onScroll(scrollY)
    document.querySelectorAll('.ticket').forEach(t => t.classList.add('is-on'))
    return
  }

  doc.classList.add('js-anim')
  gsap.registerPlugin(ScrollTrigger)
  if (window.SplitText) gsap.registerPlugin(SplitText)

  // ─── rolagem suave ───
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.12 })
    lenis.on('scroll', e => { ScrollTrigger.update(); onScroll(e.scroll) })
    gsap.ticker.add(t => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1)
      const t = id && document.getElementById(id)
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -70 }) }
    }))
  } else addEventListener('scroll', () => onScroll(scrollY), { passive: true })
  onScroll(scrollY)

  const mm = gsap.matchMedia()
  const DESK = '(min-width: 901px)', MOB = '(max-width: 900px)'
  const inHero = el => !!el.closest('.hero, .phero')

  // ─── títulos: linhas sobem de dentro de uma máscara ───
  document.fonts.ready.then(() => {
    document.querySelectorAll('[data-split]').forEach(el => {
      if (!window.SplitText) return
      SplitText.create(el, {
        type: 'lines', mask: 'lines', reduceWhiteSpace: false, linesClass: 'split-line', autoSplit: true,
        onSplit: self => gsap.from(self.lines, {
          yPercent: 110, rotate: 2, duration: 1.05, ease: 'expo.out', stagger: 0.09, delay: inHero(el) ? 0.1 : 0,
          scrollTrigger: inHero(el) ? undefined : { trigger: el, start: 'top 88%', once: true },
        }),
      })
    })
    ScrollTrigger.sort(); ScrollTrigger.refresh()
  })

  gsap.utils.toArray('[data-rise]').forEach(el => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: +el.dataset.rise || 0,
      scrollTrigger: inHero(el) ? undefined : { trigger: el, start: 'top 92%', once: true } })
  })

  gsap.utils.toArray('[data-draw] path').forEach(p => {
    const len = p.getTotalLength(), host = p.closest('[data-draw]')
    gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', delay: +host.dataset.draw || 0.2,
      scrollTrigger: inHero(host) ? undefined : { trigger: host, start: 'top 85%', once: true } })
  })

  // ─── hero: conversa acontecendo no WhatsApp ───
  if (document.querySelector('.hero-art')) {
    const tl = gsap.timeline({ delay: 0.35 })
    tl.from('.phone', { y: 80, rotate: 12, opacity: 0, duration: 1.2, ease: 'expo.out' })
      .to('.hero-art .seal', { opacity: 1, duration: 0.4 }, 0.8)
      .from('.hero-art .seal', { scale: 0.3, rotate: -120, duration: 1.1, ease: 'back.out(1.7)' }, 0.8)
    gsap.utils.toArray('.msg[data-seq]').forEach((m, i) => tl.to(m, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, 1 + i * 1.05))
    tl.to('.chip--maps', { opacity: 1, duration: 0.01 }, 2.1).from('.chip--maps', { y: -30, rotate: 20, scale: 0.7, duration: 0.8, ease: 'back.out(2)' }, 2.1)
      .to('.chip--ig', { opacity: 1, duration: 0.01 }, 3.2).from('.chip--ig', { y: 30, rotate: -20, scale: 0.7, duration: 0.8, ease: 'back.out(2)' }, 3.2)
      .to('.hero-art .note', { opacity: 1, duration: 0.6 }, 1.5)

    mm.add(DESK, () => {
      const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      const ini = { immediateRender: false, ease: 'none' }
      gsap.fromTo('.phone', { yPercent: 0, rotate: 0 }, { yPercent: -10, rotate: -7, ...ini, scrollTrigger: st })
      gsap.fromTo('.chip--maps', { y: 0 }, { y: -120, ...ini, scrollTrigger: { ...st } })
      gsap.fromTo('.chip--ig', { y: 0, x: 0 }, { y: -40, x: -30, ...ini, scrollTrigger: { ...st } })
      gsap.fromTo('.hero h1', { filter: 'blur(0px)', opacity: 1, y: 0 }, { filter: 'blur(6px)', opacity: 0.2, y: -60, ease: 'none', immediateRender: false, scrollTrigger: { ...st, start: '30% top' } })
    })
  }

  // selo: gira sempre, acelera com a rolagem
  const ring = document.querySelector('.seal .ring')
  if (ring) {
    const spin = gsap.to(ring, { rotate: 360, duration: 16, ease: 'none', repeat: -1, transformOrigin: '50% 50%' })
    ScrollTrigger.create({ onUpdate: s => { const v = Math.abs(s.getVelocity()); gsap.to(spin, { timeScale: 1 + Math.min(v / 250, 8), duration: 0.2, overwrite: true }); gsap.to(spin, { timeScale: 1, duration: 1.4, delay: 0.2 }) } })
  }

  // ─── faixas cruzadas: sentidos opostos, aceleram com a rolagem ───
  const bandLoops = [...document.querySelectorAll('.band__track')].map((t, i) =>
    gsap.fromTo(t, { xPercent: i ? -50 : 0 }, { xPercent: i ? 0 : -50, duration: i ? 46 : 38, ease: 'none', repeat: -1 }).totalTime((i ? 46 : 38) * 500))
  if (bandLoops.length) {
    let dir = 1
    ScrollTrigger.create({ trigger: '.bands', start: 'top bottom', end: 'bottom top', onUpdate: s => {
      const v = s.getVelocity(); if (v) dir = v > 0 ? 1 : -1
      bandLoops.forEach(l => { gsap.to(l, { timeScale: dir * (1 + Math.min(Math.abs(v) / 350, 5)), duration: 0.25, overwrite: true }); gsap.to(l, { timeScale: dir, duration: 1.2, delay: 0.25 }) })
    } })
  }

  // ─── manifesto: acende palavra por palavra ───
  const man = document.querySelector('.manifesto p')
  if (man && window.SplitText) document.fonts.ready.then(() => {
    const st = SplitText.create(man, { type: 'words' })
    gsap.fromTo(st.words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: man, start: 'top 78%', end: 'bottom 45%', scrub: true } })
  })

  // ─── serviços ───
  const svc = document.querySelector('.svc')
  if (svc) {
    const cards = gsap.utils.toArray('.svc .ticket')
    const n = cards.length
    const countEl = svc.querySelector('.svc__count b'), dots = [...svc.querySelectorAll('.dots button')]
    let current = -1
    const setActive = i => {
      if (i === current) return
      current = i
      cards.forEach((c, k) => c.classList.toggle('is-on', k === i))
      dots.forEach((d, k) => d.setAttribute('aria-current', k === i))
      if (countEl) countEl.textContent = String(i + 1).padStart(2, '0')
    }

    // computador: roda girando em torno de um eixo abaixo dos cartões
    mm.add(DESK, () => {
      const STEP = 15
      const place = p => cards.forEach((c, i) => {
        const d = i - p, a = Math.abs(d)
        // os que já passaram somem rápido (não cobrem o texto); os próximos ficam à vista
        const op = d < 0 ? Math.max(0, 1 - a * 1.1) : a > 2.6 ? 0 : 1 - Math.max(0, a - 1.6) * 0.8
        gsap.set(c, { rotate: d * STEP, scale: 1 - Math.min(a, 2) * 0.06, opacity: op, zIndex: 100 - Math.round(a * 10), pointerEvents: a > 0.5 ? 'none' : 'auto', filter: a > 0.5 ? 'grayscale(1)' : 'none' })
      })
      const obj = { p: 0 }
      place(0); setActive(0)
      const st = ScrollTrigger.create({
        trigger: svc, start: 'top top', end: () => `+=${(n - 1) * innerHeight * 0.55}`, pin: true, scrub: 0.6,
        snap: { snapTo: 1 / (n - 1), duration: { min: 0.2, max: 0.6 }, ease: 'power2.inOut', delay: 0.08 },
        onUpdate: s => { obj.p = s.progress * (n - 1); place(obj.p); setActive(Math.round(obj.p)) },
      })
      gsap.from(cards, { y: 160, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06, scrollTrigger: { trigger: svc, start: 'top 75%', once: true } })
      dots.forEach((d, i) => d.onclick = () => {
        const y = st.start + (st.end - st.start) * (i / (n - 1))
        lenis ? lenis.scrollTo(y, { duration: 1.1 }) : scrollTo({ top: y, behavior: 'smooth' })
      })
      return () => { gsap.set(cards, { clearProps: 'all' }); dots.forEach(d => d.onclick = null) }
    })

    // celular: um atrás do outro, com o rio passando por baixo
    mm.add(MOB, () => {
      const wheel = svc.querySelector('.wheel'), svg = svc.querySelector('.rio__svg'), path = svg && svg.querySelector('path')
      const draw = () => {
        if (!path) return
        const r = wheel.getBoundingClientRect()
        svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`)
        const pts = [[r.width * 0.2, -40], ...cards.map((c, i) => { const b = c.getBoundingClientRect(); return [i % 2 ? r.width * 0.78 : r.width * 0.22, b.top - r.top + b.height / 2] }), [r.width * 0.5, r.height + 40]]
        let d = `M${pts[0][0]},${pts[0][1]}`
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
          d += ` C${p1[0] + (p2[0] - p0[0]) / 5},${p1[1] + (p2[1] - p0[1]) / 5} ${p2[0] - (p3[0] - p1[0]) / 5},${p2[1] - (p3[1] - p1[1]) / 5} ${p2[0]},${p2[1]}`
        }
        path.setAttribute('d', d)
        const len = path.getTotalLength()
        gsap.set(path, { strokeDasharray: `${len} ${len + 80}`, strokeDashoffset: len + 40 }) // folga: esconde também a ponta redonda do traço
        return gsap.to(path, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: wheel, start: 'top 75%', end: 'bottom 80%', scrub: 0.6 } })
      }
      let tw
      document.fonts.ready.then(() => { tw = draw() })
      cards.forEach((c, i) => {
        gsap.from(c, { y: 110, rotate: i % 2 ? 9 : -9, scale: 0.92, opacity: 0, duration: 1.05, ease: 'back.out(1.4)', scrollTrigger: { trigger: c, start: 'top 90%', once: true } })
        ScrollTrigger.create({ trigger: c, start: 'top 70%', end: 'bottom 30%', onToggle: s => s.isActive && setActive(i) })
      })
      return () => { tw && tw.scrollTrigger && tw.scrollTrigger.kill(); tw && tw.kill() }
    })
  }
  // cartões fora da roda (páginas internas): gráfico sobe quando aparece
  document.querySelectorAll('.minis .ticket').forEach(t => ScrollTrigger.create({ trigger: t, start: 'top 85%', once: true, onEnter: () => t.classList.add('is-on') }))

  // ─── notificações subindo ───
  const notif = document.querySelector('.notif')
  if (notif) {
    const items = gsap.utils.toArray('.notif .n')
    mm.add(DESK, () => {
      gsap.set(items, { y: 520, opacity: 0, rotate: i => (i % 2 ? 6 : -6), scale: 0.92 })
      const tl = gsap.timeline({ scrollTrigger: { trigger: notif, start: 'top top', end: `+=${items.length * 55}%`, pin: true, scrub: 0.7 } })
      tl.from('.lock', { y: 60, rotate: 4, duration: 0.6, ease: 'power2.out' })
      items.forEach((it, i) => tl.to(it, { y: 0, opacity: 1, rotate: 0, scale: 1, duration: 1, ease: 'back.out(1.3)' }, 0.4 + i * 0.9))
      tl.to({}, { duration: 0.6 })
    })
    mm.add(MOB, () => {
      items.forEach(it => gsap.from(it, { y: 60, opacity: 0, rotate: -4, duration: 0.8, ease: 'back.out(1.6)', scrollTrigger: { trigger: it, start: 'top 92%', once: true } }))
    })
  }

  // ─── cartas empilhadas ───
  const scards = gsap.utils.toArray('.scard')
  scards.forEach((c, i) => {
    const next = scards[i + 1]
    if (next) gsap.to(c, { scale: 0.93, rotate: i % 2 ? 1.5 : -1.5, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true } })
  })

  // ─── método: trilho horizontal ───
  const track = document.querySelector('.method__track')
  if (track) {
    mm.add(DESK, () => {
      const dist = () => track.scrollWidth - innerWidth
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.method', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true } })
      gsap.to('.method__bar i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.method', start: 'top top', end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true } })
    })
    mm.add(MOB, () => {
      gsap.utils.toArray('.mpanel').forEach(p => gsap.from(p, { y: 70, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 90%', once: true } }))
    })
  }

  // ─── mapas: rios se desenham, alfinetes caem ───
  document.querySelectorAll('.map, .minimap').forEach(map => {
    const pins = map.querySelectorAll('.pin'), lines = map.querySelectorAll('.river, .trip')
    const tl = gsap.timeline({ scrollTrigger: { trigger: map, start: 'top 80%', once: true } })
    lines.forEach(r => { const trip = r.classList.contains('trip'), l = r.getTotalLength(); gsap.set(r, { strokeDasharray: trip ? '3 10' : l, strokeDashoffset: trip ? 200 : l }) })
    tl.to(lines, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.2 })
    tl.from(pins, { y: -60, opacity: 0, duration: 0.7, ease: 'bounce.out', stagger: 0.08 }, 0.3)
    tl.from(map.querySelectorAll('text'), { opacity: 0, duration: 0.5, stagger: 0.04 }, 0.7)
    tl.from(map.parentElement.querySelectorAll('.map-info'), { y: 30, opacity: 0, duration: 0.7, ease: 'expo.out' }, 1)
  })

  // ─── adereços das páginas internas ───
  document.querySelectorAll('.phero .prop').forEach(p => {
    gsap.from(p, { y: 70, rotate: 8, opacity: 0, duration: 1.3, ease: 'expo.out', delay: 0.3 })
    mm.add(DESK, () => gsap.to(p, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } }))
  })

  // ─── CTA e rodapé ───
  const bang = document.querySelector('.bang')
  if (bang) gsap.fromTo(bang, { rotate: -14, yPercent: -40 }, { rotate: 10, yPercent: -60, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } })
  const giant = document.querySelectorAll('.giant span')
  if (giant.length) gsap.from(giant, { yPercent: 100, rotate: i => (i % 2 ? 8 : -8), duration: 1.1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.giant', start: 'top 95%', once: true } })

  if (fine) document.querySelectorAll('.btn--lg').forEach(b => {
    const xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' })
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.16); yTo((e.clientY - r.top - r.height / 2) * 0.22) })
    b.addEventListener('pointerleave', () => { xTo(0); yTo(0) })
  })

  // os gatilhos de entrada foram criados antes das seções presas: reordena pela posição na página
  const reordenar = () => { ScrollTrigger.sort(); ScrollTrigger.refresh() }
  reordenar()
  document.fonts.ready.then(() => requestAnimationFrame(reordenar))
  addEventListener('load', reordenar)
})()
