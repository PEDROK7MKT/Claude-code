// Agência Viva — movimento.
// GSAP + ScrollTrigger + SplitText + Lenis (em /assets/vendor).
// Sem JS ou com "reduzir movimento", o site continua completo e legível.
(() => {
  const doc = document.documentElement
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = matchMedia('(pointer: fine)').matches
  const G = window.gsap
  const hasG = !!(G && window.ScrollTrigger)
  doc.classList.remove('no-js')
  if (!hasG) doc.classList.add('no-gsap')

  // ─── menu mobile ───
  const burger = document.querySelector('.burger')
  const setMenu = open => {
    doc.classList.toggle('nav-open', open)
    burger && burger.setAttribute('aria-expanded', open)
    if (lenis) open ? lenis.stop() : lenis.start()
  }
  burger && burger.addEventListener('click', () => setMenu(!doc.classList.contains('nav-open')))
  addEventListener('keydown', e => { if (e.key === 'Escape' && doc.classList.contains('nav-open')) setMenu(false) })
  document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => setMenu(false)))

  // ─── header: some ao descer, volta ao subir ───
  const hdr = document.querySelector('.hdr')
  let lastY = 0
  const onScroll = y => {
    if (!hdr) return
    hdr.classList.toggle('is-scrolled', y > 30)
    hdr.classList.toggle('is-hidden', y > 400 && y > lastY + 2 && !doc.classList.contains('nav-open'))
    if (y < lastY - 2 || y < 400) hdr.classList.remove('is-hidden')
    lastY = y
  }

  let lenis = null
  if (reduce || !hasG) {
    addEventListener('scroll', () => onScroll(scrollY), { passive: true })
    onScroll(scrollY)
    return
  }

  doc.classList.add('js-anim')
  const { gsap } = window
  gsap.registerPlugin(ScrollTrigger)
  if (window.SplitText) gsap.registerPlugin(SplitText)

  // ─── rolagem suave ───
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1 })
    lenis.on('scroll', e => { ScrollTrigger.update(); onScroll(e.scroll) })
    gsap.ticker.add(t => lenis.raf(t * 1000))
    gsap.ticker.lagSmoothing(0)
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1)
      const t = id && document.getElementById(id)
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -80 }) }
    }))
  } else {
    addEventListener('scroll', () => onScroll(scrollY), { passive: true })
  }
  onScroll(scrollY)

  const mm = gsap.matchMedia()
  const DESK = '(min-width: 901px)'

  // ─── títulos: linhas sobem de dentro de uma máscara ───
  const splitReveal = (el, delay = 0) => {
    if (!window.SplitText) return
    SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: self => gsap.from(self.lines, {
        yPercent: 110, rotate: 2, duration: 1.05, ease: 'expo.out', stagger: 0.09, delay,
        scrollTrigger: el.closest('.hero, .phero') ? undefined : { trigger: el, start: 'top 86%', once: true },
      }),
    })
  }
  document.fonts.ready.then(() => {
    document.querySelectorAll('[data-split]').forEach(el => splitReveal(el, el.closest('.hero, .phero') ? 0.15 : 0))
    ScrollTrigger.refresh()
  })

  // blocos que sobem
  gsap.utils.toArray('[data-rise]').forEach(el => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: +el.dataset.rise || 0,
      scrollTrigger: el.closest('.hero, .phero') ? undefined : { trigger: el, start: 'top 90%', once: true } })
  })

  // traços feitos à mão se desenham
  gsap.utils.toArray('[data-draw] path').forEach(p => {
    const len = p.getTotalLength()
    const host = p.closest('[data-draw]')
    gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, {
      strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut', delay: +host.dataset.draw || 0.2,
      scrollTrigger: host.closest('.hero, .phero') ? undefined : { trigger: host, start: 'top 85%', once: true },
    })
  })

  // ─── hero: conversa no WhatsApp acontecendo ───
  const heroArt = document.querySelector('.hero-art')
  if (heroArt) {
    const msgs = gsap.utils.toArray('.msg[data-seq]')
    const tl = gsap.timeline({ delay: 0.5 })
    tl.from('.phone', { y: 80, rotate: 12, opacity: 0, duration: 1.2, ease: 'expo.out' })
      .to('.hero-art .seal', { opacity: 1, duration: 0.6 }, 0.9)
      .from('.hero-art .seal', { scale: 0.4, rotate: -90, duration: 1, ease: 'back.out(1.8)' }, 0.9)
    msgs.forEach((m, i) => tl.to(m, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, 1.1 + i * 1.05))
    tl.to('.chip--maps', { opacity: 1, duration: 0.01 }, 2.2).from('.chip--maps', { y: -30, rotate: 20, scale: 0.7, duration: 0.8, ease: 'back.out(2)' }, 2.2)
      .to('.chip--ig', { opacity: 1, duration: 0.01 }, 3.3).from('.chip--ig', { y: 30, rotate: -20, scale: 0.7, duration: 0.8, ease: 'back.out(2)' }, 3.3)
      .to('.hero-art .note', { opacity: 1, duration: 0.6 }, 1.6)

    mm.add(DESK, () => {
      gsap.to('.phone', { yPercent: -10, rotate: -3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      gsap.to('.chip--maps', { y: -120, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      gsap.to('.chip--ig', { y: -40, x: -30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      gsap.to('.hero h1', { filter: 'blur(6px)', opacity: 0.25, y: -60, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } })
    })
  }

  // ─── faixa: velocidade reage à rolagem ───
  const band = document.querySelector('.band__track')
  if (band) {
    const loop = gsap.to(band, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 })
    let dir = 1
    ScrollTrigger.create({
      trigger: '.band', start: 'top bottom', end: 'bottom top',
      onUpdate: s => {
        const v = s.getVelocity()
        if (v) dir = v > 0 ? 1 : -1
        gsap.to(loop, { timeScale: dir * (1 + Math.min(Math.abs(v) / 400, 5)), duration: 0.25, overwrite: true })
        gsap.to(loop, { timeScale: dir, duration: 1.2, delay: 0.25 })
      },
    })
  }

  // ─── manifesto: acende palavra por palavra ───
  const man = document.querySelector('.manifesto p')
  if (man && window.SplitText) {
    document.fonts.ready.then(() => {
      const st = SplitText.create(man, { type: 'words' })
      gsap.fromTo(st.words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: man, start: 'top 78%', end: 'bottom 45%', scrub: true } })
    })
  }

  // ─── o rio passando por baixo dos serviços ───
  const rio = document.querySelector('.rio')
  if (rio) {
    const svg = rio.querySelector('.rio__svg')
    const cards = [...rio.querySelectorAll('.ticket')]
    const paths = [...svg.querySelectorAll('path')]
    let tween
    const draw = () => {
      const r = rio.getBoundingClientRect()
      const W = r.width, H = r.height
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const pts = [[-80, 40]]
      cards.forEach(c => {
        const b = c.getBoundingClientRect()
        pts.push([b.left - r.left + b.width / 2, b.top - r.top + b.height / 2])
      })
      pts.push([W + 80, H - 30])
      // Catmull-Rom → Bézier: curva que passa pelos centros dos cartões
      let d = `M${pts[0][0]},${pts[0][1]}`
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2
        const c1 = [p1[0] + (p2[0] - p0[0]) / 5, p1[1] + (p2[1] - p0[1]) / 5]
        const c2 = [p2[0] - (p3[0] - p1[0]) / 5, p2[1] - (p3[1] - p1[1]) / 5]
        d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
      }
      paths.forEach(p => p.setAttribute('d', d))
      const main = paths[0], len = main.getTotalLength()
      tween && tween.scrollTrigger && tween.scrollTrigger.kill()
      tween && tween.kill()
      gsap.set(main, { strokeDasharray: len, strokeDashoffset: len })
      tween = gsap.to(main, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: rio, start: 'top 70%', end: 'bottom 80%', scrub: 0.6 } })
      const shine = paths[1]
      if (shine) gsap.set(shine, { opacity: 0 })
      if (shine) tween.eventCallback('onUpdate', () => gsap.set(shine, { opacity: tween.progress() > 0.98 ? 1 : 0 }))
    }
    document.fonts.ready.then(draw)
    let rt
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { draw(); ScrollTrigger.refresh() }, 200) })

    cards.forEach((c, i) => {
      gsap.from(c, { y: 120, rotate: i % 2 ? 10 : -10, scale: 0.9, opacity: 0, duration: 1.1, ease: 'back.out(1.4)',
        scrollTrigger: { trigger: c, start: 'top 88%', once: true } })
    })
  }

  // ─── notificações subindo (a "carta" da Viva) ───
  const notif = document.querySelector('.notif')
  if (notif) {
    const items = gsap.utils.toArray('.notif .n')
    mm.add(DESK, () => {
      gsap.set(items, { y: 520, opacity: 0, rotate: i => (i % 2 ? 6 : -6), scale: 0.92 })
      const tl = gsap.timeline({ scrollTrigger: { trigger: notif, start: 'top top', end: `+=${items.length * 55}%`, pin: true, scrub: 0.7, anticipatePin: 1 } })
      tl.from('.lock', { y: 60, rotate: 4, duration: 0.6, ease: 'power2.out' })
      items.forEach((n, i) => tl.to(n, { y: 0, opacity: 1, rotate: 0, scale: 1, duration: 1, ease: 'back.out(1.3)' }, 0.4 + i * 0.9))
      tl.to({}, { duration: 0.6 })
    })
    mm.add('(max-width: 900px)', () => {
      items.forEach(n => gsap.from(n, { y: 60, opacity: 0, rotate: -4, duration: 0.8, ease: 'back.out(1.6)', scrollTrigger: { trigger: n, start: 'top 92%', once: true } }))
    })
  }

  // ─── cartas empilhadas: a de baixo encolhe quando a próxima cobre ───
  const scards = gsap.utils.toArray('.scard')
  scards.forEach((c, i) => {
    const next = scards[i + 1]
    if (!next) return
    gsap.to(c, { scale: 0.93, rotate: i % 2 ? 1.5 : -1.5, ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true } })
  })

  // ─── método: trilho horizontal preso na tela ───
  const track = document.querySelector('.method__track')
  if (track) {
    mm.add(DESK, () => {
      const dist = () => track.scrollWidth - innerWidth
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.method', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true } })
      gsap.to('.method__bar i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.method', start: 'top top', end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true } })
    })
    mm.add('(max-width: 900px)', () => {
      gsap.utils.toArray('.mpanel').forEach(p => gsap.from(p, { y: 70, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 90%', once: true } }))
    })
  }

  // ─── mapa: alfinetes caem, rios se desenham ───
  document.querySelectorAll('.map, .minimap').forEach(map => {
    const pins = map.querySelectorAll('.pin')
    const rivers = map.querySelectorAll('.river, .trip')
    const tl = gsap.timeline({ scrollTrigger: { trigger: map, start: 'top 80%', once: true } })
    rivers.forEach(r => { const l = r.getTotalLength(); gsap.set(r, { strokeDasharray: r.classList.contains('trip') ? '3 10' : l, strokeDashoffset: r.classList.contains('trip') ? 200 : l }) })
    tl.to(rivers, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.2 })
    tl.from(pins, { y: -60, opacity: 0, duration: 0.7, ease: 'bounce.out', stagger: 0.09, transformOrigin: '50% 100%' }, 0.3)
    tl.from(map.querySelectorAll('text'), { opacity: 0, duration: 0.5, stagger: 0.05 }, 0.7)
  })

  // ─── adereços das páginas internas ───
  document.querySelectorAll('.phero .prop').forEach(p => {
    gsap.from(p, { y: 70, rotate: 8, opacity: 0, duration: 1.3, ease: 'expo.out', delay: 0.35 })
    mm.add(DESK, () => gsap.to(p, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } }))
  })

  // ─── CTA: o "!" balança com a rolagem ───
  const bang = document.querySelector('.bang')
  if (bang) gsap.fromTo(bang, { rotate: -14, yPercent: -40 }, { rotate: 10, yPercent: -60, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } })

  // ─── rodapé: VIVA! sobe letra por letra ───
  const giant = document.querySelectorAll('.giant span')
  if (giant.length) gsap.from(giant, { yPercent: 100, rotate: i => (i % 2 ? 8 : -8), duration: 1.1, ease: 'expo.out', stagger: 0.07, scrollTrigger: { trigger: '.giant', start: 'top 95%', once: true } })

  // ─── botões com leve "ímã" ───
  if (fine) document.querySelectorAll('.btn--main, .btn--lg').forEach(b => {
    const xTo = gsap.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: 0.5, ease: 'power3' })
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.18); yTo((e.clientY - r.top - r.height / 2) * 0.25) })
    b.addEventListener('pointerleave', () => { xTo(0); yTo(0) })
  })

  addEventListener('load', () => ScrollTrigger.refresh())
})()
