// Agência Viva — micro-interações. Sem dependências, ~3 KB.
(() => {
  const doc = document.documentElement
  doc.classList.remove('no-js')
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const fine = matchMedia('(pointer: fine)').matches

  // header encolhe ao rolar
  const hdr = document.querySelector('.hdr')
  const onScroll = () => hdr && hdr.classList.toggle('is-scrolled', scrollY > 30)
  addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // menu mobile
  const burger = document.querySelector('.burger')
  if (burger) {
    burger.addEventListener('click', () => {
      const open = doc.classList.toggle('nav-open')
      burger.setAttribute('aria-expanded', open)
    })
    document.querySelectorAll('.nav a').forEach(a =>
      a.addEventListener('click', () => { doc.classList.remove('nav-open'); burger.setAttribute('aria-expanded', 'false') }))
  }

  // revelar ao entrar na tela
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
  }), { rootMargin: '0px 0px -8% 0px' })
  document.querySelectorAll('.rv').forEach(el => io.observe(el))

  // palavras que giram no hero
  const rot = document.querySelector('.rotator')
  if (rot && !reduce) {
    const items = [...rot.children]
    let i = 0
    setInterval(() => {
      const cur = items[i]
      cur.classList.remove('on'); cur.classList.add('off')
      i = (i + 1) % items.length
      const nxt = items[i]
      nxt.classList.remove('off'); void nxt.offsetWidth; nxt.classList.add('on')
      setTimeout(() => cur.classList.remove('off'), 700)
    }, 2200)
  }

  // manifesto acende palavra por palavra conforme rola
  const man = document.querySelector('.manifesto')
  if (man && !reduce) {
    man.innerHTML = man.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ')
    const words = man.querySelectorAll('.w')
    let ticking = false
    const paint = () => {
      const r = man.getBoundingClientRect()
      const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)))
      const n = Math.round(p * words.length)
      words.forEach((w, k) => w.classList.toggle('lit', k < n))
      ticking = false
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paint) } }, { passive: true })
    paint()
  }

  // contadores
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return
    const el = e.target, end = +el.dataset.count, pre = el.dataset.pre || '', suf = el.dataset.suf || ''
    cio.unobserve(el)
    if (reduce) { el.textContent = pre + end + suf; return }
    const t0 = performance.now(), dur = 1600
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - k, 4)))
      el.textContent = pre + v + suf
      if (k < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }), { threshold: 0.6 })
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el))

  if (!fine || reduce) return

  // holofote nos cards
  document.querySelectorAll('.card').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect()
    c.style.setProperty('--mx', e.clientX - r.left + 'px')
    c.style.setProperty('--my', e.clientY - r.top + 'px')
  }))

  // botões magnéticos
  document.querySelectorAll('.btn').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect()
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`
    })
    b.addEventListener('pointerleave', () => { b.style.transform = '' })
  })

  // blobs do hero seguem o mouse (parallax leve)
  const blobs = document.querySelector('.blobs')
  if (blobs) {
    let raf = 0
    addEventListener('pointermove', e => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / innerWidth - 0.5) * 40, y = (e.clientY / innerHeight - 0.5) * 40
        blobs.style.transform = `translate(${x}px, ${y}px)`
      })
    }, { passive: true })
  }
})()
