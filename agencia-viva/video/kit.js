// Kit de peças do Reels: cria elementos no palco e registra tudo numa linha do tempo GSAP pausada.
// Regra: tudo que mexe passa pelo TL (fromTo com immediateRender:false), pra qualquer quadro poder ser renderizado fora de ordem.
const stage = document.getElementById('stage')
const TL = gsap.timeline({ paused: true, defaults: { ease: 'power3.out', duration: 0.6 } })
const CUES = []
const cue = (t, tipo, g = 1) => CUES.push({ t: +t.toFixed(3), tipo, g })

const el = (html, pai = stage) => { const d = document.createElement('div'); d.innerHTML = html.trim(); const e = d.firstElementChild; pai.appendChild(e); return e }
const $ = (sel, raiz = stage) => raiz.querySelector(sel)
const $$ = (sel, raiz = stage) => [...raiz.querySelectorAll(sel)]

// como cada cena entra: 'corte' (aparece no t0) ou 'empurra' (desliza por cima da anterior e fica inteira no t0).
// O Reels escolhe o padrão com KIT.entrada = 'empurra'.
const KIT = { entrada: 'corte', dEntrada: 0.3 }
// cena visível só entre t0 e t1
function cena(cls, t0, t1, { entra = KIT.entrada, dir = 1, d = KIT.dEntrada } = {}) {
  const c = el(`<section class="cena ${cls}"></section>`)
  if (t0 <= 0) gsap.set(c, { visibility: 'visible' })
  else if (entra === 'empurra') {
    TL.set(c, { visibility: 'visible' }, t0 - d)
    vai(c, { xPercent: 100 * dir }, { xPercent: 0, duration: d, ease: 'power3.inOut' }, t0 - d)
    cue(t0 - d, 'whoosh', 0.45)
  } else TL.set(c, { visibility: 'visible' }, t0)
  if (t1 != null) TL.set(c, { visibility: 'hidden' }, t1)
  return c
}
// tween que funciona fora de ordem. O estado inicial ("de") do PRIMEIRO tween de cada elemento já é aplicado
// na montagem: sem isso, o que entra no meio da cena aparece antes da hora.
const primeiro = new WeakMap()
const vai = (alvo, de, para, t) => {
  for (const a of (Array.isArray(alvo) ? alvo : [alvo])) {
    const antes = primeiro.get(a)
    if (antes == null || t < antes) { gsap.set(a, de); primeiro.set(a, t) }
  }
  return TL.fromTo(alvo, de, { ...para, immediateRender: false }, t)
}

// título em linhas mascaradas: linhas = ['Você contratou', '*marketing*'] (asteriscos = serifa itálica)
function titulo(pai, linhas, { cls = 'l', top = 400, left, align, cor } = {}) {
  const fmt = s => s.replace(/\*([^*]+)\*/g, '<span class="s">$1</span>')
  const t = el(`<div class="t ${cls}" style="top:${top}px${left != null ? `;left:${left}px` : ''}${align ? `;text-align:${align}` : ''}${cor ? `;color:${cor}` : ''}">${linhas.map(l => `<span class="linha"><span>${fmt(l)}</span></span>`).join('')}</div>`, pai)
  return { t, linhas: $$('.linha > span', t) }
}
function sobeLinhas(linhas, t, { stagger = 0.09, dur = 0.7, ease = 'power4.out' } = {}) {
  linhas.forEach((l, i) => vai(l, { yPercent: 135, rotate: 3 }, { yPercent: 0, rotate: 0, duration: dur, ease }, t + i * stagger))
}
function desceLinhas(linhas, t, { stagger = 0.05, dur = 0.4 } = {}) {
  linhas.forEach((l, i) => vai(l, { yPercent: 0 }, { yPercent: -135, duration: dur, ease: 'power3.in' }, t + i * stagger))
}

const logo = (n, cls = '') => `<span class="logo-ic ${cls}">${LOGOS[n]}</span>`
const icone = {
  ia: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#0b0b0b"/><path d="M12 4.5l1.6 4.4 4.4 1.6-4.4 1.6L12 16.5l-1.6-4.4L6 10.5l4.4-1.6z" fill="#fff"/><path d="M17.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" fill="#fff"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>',
  lupa: '<svg viewBox="0 0 24 24" width="40" height="40"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#5f6368" stroke-width="2.4"/><path d="M15.5 15.5L21 21" stroke="#5f6368" stroke-width="2.4" stroke-linecap="round"/></svg>',
  seta: '<svg viewBox="0 0 70 50"><path d="M6 6c20-4 42 8 50 36"/><path d="M45 34l11 9 5-13"/></svg>',
}
const LOGO_VIVA = '../public/assets/logo-viva.png'
// logo da Viva: o PNG é branco; em fundo claro vira preto com brightness(0), igual ao site
const logoViva = (pai, estilo, { preto = true } = {}) => el(`<img class="logo-viva" src="${LOGO_VIVA}" alt="Agência Viva" style="${estilo}${preto ? ';filter:brightness(0)' : ''}">`, pai)

// traços à mão (desenham com strokeDashoffset)
const TRACOS = {
  circulo: ['0 0 200 80', 'M152 11C112 1 42 3 17 25-3 45 30 75 100 74c70-1 99-22 91-43-7-18-50-26-94-22'],
  sublinha: ['0 0 200 20', 'M4 14C50 5 120 4 196 11'],
  risco: ['0 0 200 40', 'M4 26C60 18 120 14 196 12'],
  seta: ['0 0 70 50', 'M6 6c20-4 42 8 50 36M45 34l11 9 5-13'],
}
function traco(pai, tipo, estilo, t, dur = 0.5) {
  const [vb, d] = TRACOS[tipo]
  const s = el(`<svg class="traco" viewBox="${vb}" preserveAspectRatio="none" style="${estilo}"><path d="${d}"/></svg>`, pai)
  const p = s.querySelector('path'), L = p.getTotalLength()
  // folga no traço: esconde também a ponta arredondada antes de começar a desenhar
  gsap.set(p, { strokeDasharray: `${L} ${L + 40}`, strokeDashoffset: L + 20 })
  vai(p, { strokeDashoffset: L + 20 }, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut' }, t)
  return s
}

// entrada de objeto: cai girando (como carimbo) ou pula
const carimba = (alvo, t, rot = -4) => { vai(alvo, { scale: 1.6, opacity: 0, rotate: rot - 8 }, { scale: 1, opacity: 1, rotate: rot, duration: 0.45, ease: 'back.out(2.2)' }, t); cue(t + 0.12, 'carimbo', 0.8) }
const pula = (alvo, t, { y = 90, rot = 0, dur = 0.55 } = {}) => vai(alvo, { y, opacity: 0, rotate: rot - 4 }, { y: 0, opacity: 1, rotate: rot, duration: dur, ease: 'back.out(1.7)' }, t)
const some = (alvo, t, { y = -60, dur = 0.35 } = {}) => vai(alvo, { opacity: 1, y: 0 }, { opacity: 0, y, duration: dur, ease: 'power2.in' }, t)

// celular com tela de bloqueio
function celular(pai, { left = 220, top = 330, tela = 'lock', hora = '08:12', data = 'segunda-feira, 6 de outubro' } = {}) {
  const c = el(`<div class="cel" style="left:${left}px;top:${top}px"><div class="cel__tela ${tela}"><div class="cel__ilha"></div></div></div>`, pai)
  const tl = $('.cel__tela', c)
  if (tela === 'lock') el(`<div><div class="lock__data">${data}</div><div class="lock__hora">${hora}</div><div class="lock__lista"></div></div>`, tl)
  return c
}
function notificacao(lista, { logo: lg, titulo: tt, quando = 'agora', texto }) {
  return el(`<div class="n">${logo(lg)}<div class="n__topo"><b>${tt}</b>${quando}</div><div>${texto}</div></div>`, lista)
}

// chat de WhatsApp dentro do celular
function chat(celEl, { nome = 'Sua Empresa', status = 'online' } = {}) {
  const tela = $('.cel__tela', celEl)
  tela.className = 'cel__tela chat'
  el('<div class="cel__ilha"></div>', tela)
  el(`<div class="chat__topo"><span class="chat__av">${nome.slice(0, 1)}</span><div>${nome}<small>${status}</small></div></div>`, tela)
  return el('<div class="chat__corpo"></div>', tela)
}
const bolha = (corpo, lado, texto, hora = '08:12', extra = '') => el(`<div class="bolha ${lado} ${extra}">${texto}<small>${hora}</small></div>`, corpo)

// selo girando "FEITO NO OESTE DA BAHIA · DESDE 2016" (devolve o anel de texto, pra girar)
let nSelo = 0
function selo(pai, estilo, cor = 'var(--black)') {
  const id = 'anel' + ++nSelo
  const s = el(`<div class="selo" style="${estilo};color:${cor}"><svg viewBox="0 0 120 120"><defs><path id="${id}" d="M60 60m-45 0a45 45 0 1 1 90 0a45 45 0 1 1-90 0"/></defs><circle cx="60" cy="60" r="57" fill="var(--paper)" stroke="currentColor" stroke-width="3"/><g class="anel"><text><textPath href="#${id}" textLength="279" lengthAdjust="spacing">FEITO NO OESTE DA BAHIA · DESDE 2016 ·</textPath></text></g><image href="${LOGO_VIVA}" x="27" y="47" width="66" height="30" style="filter:brightness(0)"/></svg></div>`, pai)
  const anel = $('.anel', s)
  gsap.set(anel, { transformOrigin: '60px 60px' })
  return { s, anel }
}

// faixa em movimento
function faixa(pai, itens, { top, rot = -4, clara = false, vel = 160, t0 = 0, t1 = 60 } = {}) {
  const f = el(`<div class="faixa${clara ? ' clara' : ''}" style="top:${top}px;transform:rotate(${rot}deg)"><div class="faixa__trilho">${[...itens, ...itens, ...itens].map(i => `<span>${i}</span><i>✦</i>`).join('')}</div></div>`, pai)
  const tr = $('.faixa__trilho', f)
  vai(tr, { x: 0 }, { x: -vel * (t1 - t0), duration: t1 - t0, ease: 'none' }, t0)
  return f
}

// contador numérico
function conta(alvo, de, ate, t, dur, fmt = n => Math.round(n).toLocaleString('pt-BR')) {
  const o = { v: de }
  alvo.textContent = fmt(de)
  vai(o, { v: de }, { v: ate, duration: dur, ease: 'power2.out', onUpdate: () => { alvo.textContent = fmt(o.v) } }, t)
}

// transição: cortina preta/papel varrendo a tela
function cortina(t, { cor = 'var(--black)', dir = 'cima', dur = 0.5 } = {}) {
  const c = el(`<div class="cena" style="background:${cor};visibility:visible;z-index:50"></div>`)
  const de = dir === 'cima' ? 100 : -100
  gsap.set(c, { yPercent: de })
  vai(c, { yPercent: de }, { yPercent: 0, duration: dur / 2, ease: 'power3.in' }, t - dur / 2)
  vai(c, { yPercent: 0 }, { yPercent: -de, duration: dur / 2, ease: 'power3.out' }, t)
  cue(t - dur / 2, 'whoosh', 0.8)
  return c
}
// flash de impacto
function flash(t, cor = '#fff', forca = 0.8) {
  const f = el(`<div class="cena" style="background:${cor};visibility:visible;z-index:60;opacity:0"></div>`)
  vai(f, { opacity: 0 }, { opacity: forca, duration: 0.02, ease: 'none' }, t)
  vai(f, { opacity: forca }, { opacity: 0, duration: 0.35, ease: 'power2.out' }, t + 0.02)
}
// tremida de câmera na cena
function treme(alvo, t, forca = 14, dur = 0.35) {
  const n = 7
  for (let i = 0; i < n; i++) TL.to(alvo, { x: (i % 2 ? -1 : 1) * forca * (1 - i / n), y: (i % 3 - 1) * forca * 0.5 * (1 - i / n), duration: dur / n, ease: 'none', immediateRender: false }, t + i * dur / n)
  TL.to(alvo, { x: 0, y: 0, duration: 0.05, immediateRender: false }, t + dur)
}

function pronto(dur, musica) {
  CUES.sort((a, b) => a.t - b.t)
  window.REEL = { dur, musica, cues: CUES, pronto: true, seek: t => { TL.seek(t, false) } }
  TL.seek(0, false)
}

// ─── mockups de serviço ─────────────────────────────────────
// busca no Google com a empresa em 1º (resultado "top" destacado)
function googleBusca(pai, { termo = 'loja de roupa em barreiras', left = 90, top = 520, largura = 840, resultados = [] } = {}) {
  const g = el(`<div class="obj" style="left:${left}px;top:${top}px;width:${largura}px;padding:34px 0 10px;overflow:hidden">
    <div style="display:flex;align-items:center;gap:22px;padding:0 30px 26px"><span style="font:500 64px/1 Arial,sans-serif;letter-spacing:-2px"><span style="color:#4285f4">G</span><span style="color:#ea4335">o</span><span style="color:#fbbc05">o</span><span style="color:#4285f4">g</span><span style="color:#34a853">l</span><span style="color:#ea4335">e</span></span></div>
    <div class="busca" style="margin:0 30px 20px">${icone.lupa}<span class="termo"></span><span class="cursor" style="width:3px;height:40px;background:#202124"></span></div>
    <div class="lista-res">${resultados.map((r, i) => `<div class="res${r.top ? ' top' : ''}"><small>${r.url}</small><b>${r.titulo}</b>${r.nota ? `<span><span class="estrelas">★★★★★</span> ${r.nota}</span>` : `<span>${r.desc || ''}</span>`}</div>`).join('')}</div></div>`, pai)
  g.dataset.termo = termo
  return g
}
// digita um texto letra por letra (com som de teclado)
function digita(alvo, texto, t, cps = 22) {
  const o = { n: 0 }
  alvo.textContent = ''
  vai(o, { n: 0 }, { n: texto.length, duration: texto.length / cps, ease: 'none', onUpdate: () => { alvo.textContent = texto.slice(0, Math.round(o.n)) } }, t)
  cue(t, 'digita', 0.9)
  return t + texto.length / cps
}
// resposta de IA citando a empresa
function respostaIA(pai, { pergunta, resposta, left = 90, top = 900, largura = 840 } = {}) {
  return el(`<div class="obj" style="left:${left}px;top:${top}px;width:${largura}px;padding:30px 32px;border-radius:32px">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:18px"><span class="logo-ic" style="width:64px;height:64px;border-radius:18px;box-shadow:none">${icone.ia}</span><b style="font:800 30px var(--sans)">Assistente de IA</b></div>
    <div style="font:600 30px/1.3 var(--sans);color:var(--muted);margin-bottom:16px">“${pergunta}”</div>
    <div class="ia-resp" style="font:500 32px/1.35 var(--sans)">${resposta}</div></div>`, pai)
}
// navegador com site sendo montado
function siteMock(pai, { url = 'suaempresa.com.br', left = 110, top = 560, largura = 820 } = {}) {
  return el(`<div class="nav" style="left:${left}px;top:${top}px;width:${largura}px">
    <div class="nav__barra"><i></i><i></i><i></i><span class="nav__url">${url}</span></div>
    <div style="padding:40px 44px;display:grid;gap:26px">
      <div class="sb" style="font:900 72px/.95 var(--sans);font-stretch:72%">A melhor opção<br>da cidade, <span style="font-family:var(--serif);font-style:italic;font-weight:400">a um clique.</span></div>
      <div class="sb" style="height:22px;width:88%;border-radius:11px;background:var(--paper-2)"></div>
      <div class="sb" style="height:22px;width:64%;border-radius:11px;background:var(--paper-2)"></div>
      <div class="sb" style="display:inline-flex;align-items:center;gap:14px;justify-self:start;padding:22px 34px;border-radius:99px;background:var(--wa);color:#fff;font:800 32px var(--sans);border:3px solid var(--black)">${LOGOS.whatsapp.replace('fill="#25d366"', 'fill="#fff"').replace('<svg', '<svg width="40" height="40"')} Chamar no WhatsApp</div>
      <div class="sb" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px">${'<span style="height:150px;border-radius:18px;background:var(--paper-2);border:3px solid var(--black)"></span>'.repeat(3)}</div>
    </div></div>`, pai)
}
// cartão de anúncio com gráfico de vendas subindo
function graficoSobe(pai, { left = 110, top = 1000, largura = 820, altura = 360, titulo = 'Vendas pelo anúncio' } = {}) {
  const pts = [[0, 300], [110, 280], [220, 290], [330, 230], [440, 210], [550, 150], [660, 110], [760, 40]]
  const d = 'M' + pts.map(p => p.join(',')).join(' L')
  const g = el(`<div class="obj" style="left:${left}px;top:${top}px;width:${largura}px;padding:28px 30px">
    <div style="display:flex;justify-content:space-between;align-items:baseline;font:800 30px var(--sans)"><span>${titulo}</span><span class="pill" style="font-size:28px;padding:10px 18px">▲ subindo</span></div>
    <svg viewBox="-10 0 780 ${altura - 40}" style="width:100%;height:${altura - 80}px;overflow:visible;margin-top:14px"><path d="M0,300 H760" stroke="#ddd" stroke-width="3"/><path class="linha-g" d="${d}" fill="none" stroke="var(--black)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><circle class="ponto" cx="760" cy="40" r="16" fill="var(--black)"/></svg></div>`, pai)
  const p = $('.linha-g', g), L = p.getTotalLength()
  gsap.set(p, { strokeDasharray: L, strokeDashoffset: L })
  gsap.set($('.ponto', g), { scale: 0, transformOrigin: '50% 50%' })
  return { g, desenha: (t, dur = 1.1, pct = 38) => { vai(p, { strokeDashoffset: L }, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut' }, t); vai($('.ponto', g), { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, t + dur - 0.1); } }
}
// prancheta de diagnóstico com itens que vão sendo marcados
function prancheta(pai, itens, { left = 150, top = 560, largura = 780, titulo = 'Diagnóstico Viva' } = {}) {
  const g = el(`<div class="obj" style="left:${left}px;top:${top}px;width:${largura}px;padding:44px 44px 36px;border-radius:24px">
    <div style="position:absolute;top:-34px;left:50%;width:220px;height:64px;margin-left:-110px;border-radius:14px;background:var(--black)"></div>
    <div style="font:900 64px/1 var(--sans);font-stretch:72%;margin-bottom:10px">${titulo}</div>
    <div style="font:600 26px var(--sans);color:var(--muted);letter-spacing:.14em;text-transform:uppercase;margin-bottom:26px">sob medida pra sua empresa</div>
    <div style="display:grid;gap:18px">${itens.map(i => `<div class="item" style="display:flex;align-items:center;gap:22px;font:700 38px var(--sans)"><span class="box" style="width:54px;height:54px;border:4px solid var(--black);border-radius:12px;display:grid;place-items:center;flex:none"><span class="ok" style="width:40px;height:40px;display:block">${icone.check}</span></span>${i}</div>`).join('')}</div></div>`, pai)
  return g
}

// recibo/boleto da "agência qualquer"
function recibo(pai, linhas, { left = 170, top = 560, largura = 740, titulo = 'AGÊNCIA QUALQUER', sub = 'recibo do mês' } = {}) {
  return el(`<div class="obj recibo" style="left:${left}px;top:${top}px;width:${largura}px;padding:40px 44px 50px;border-radius:10px;font-family:'DejaVu Sans Mono',monospace;box-shadow:14px 14px 0 rgba(0,0,0,.9)">
    <div style="font:900 52px/1 var(--sans);font-stretch:72%;letter-spacing:.02em">${titulo}</div>
    <div style="font-size:26px;color:var(--muted);margin:8px 0 26px">${sub}</div>
    <div style="border-top:4px dashed var(--black);padding-top:22px;display:grid;gap:20px">${linhas.map(([a, b, cls = '']) => `<div class="lr ${cls}" style="display:flex;justify-content:space-between;gap:20px;font-size:34px;font-weight:700"><span>${a}</span><span>${b}</span></div>`).join('')}</div></div>`, pai)
}
// quadro de gravação (audiovisual)
function recFrame(pai, { left = 110, top = 560, largura = 860, altura = 620, legenda = 'Bastidores da <span class="s">sua</span> loja' } = {}) {
  return el(`<div class="obj" style="left:${left}px;top:${top}px;width:${largura}px;height:${altura}px;background:#1b1b1b;color:#fff;overflow:hidden">
    <div style="position:absolute;inset:36px;border:4px solid rgba(255,255,255,.85);border-radius:10px"></div>
    <div style="position:absolute;left:66px;top:62px;display:flex;align-items:center;gap:14px;font:800 34px var(--sans)"><i class="rec-dot" style="width:26px;height:26px;border-radius:50%;background:#e33"></i>REC</div>
    <div class="rec-tc" style="position:absolute;right:66px;top:62px;font:600 34px 'DejaVu Sans Mono',monospace">00:00:14</div>
    <div style="position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;border:5px solid #fff;display:grid;place-items:center"><svg viewBox="0 0 24 24" width="70" height="70"><path d="M8 5l12 7-12 7z" fill="#fff"/></svg></div>
    <div class="t" style="left:66px;right:66px;bottom:64px;top:auto;font-size:76px;color:#fff">${legenda}</div></div>`, pai)
}
// quadro de marca (branding)
function marcaBoard(pai, { left = 120, top = 560, largura = 840 } = {}) {
  return el(`<div class="obj" style="left:${left}px;top:${top}px;width:${largura}px;padding:38px;display:grid;gap:26px">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">${[['#0b0b0b', '#fff', 'Preto'], ['#fff', '#0b0b0b', 'Branco'], ['#c9c6bf', '#0b0b0b', 'Cinza'], ['#f3f2ee', '#0b0b0b', 'Papel']].map(([bg, c, n]) => `<div class="mb" style="height:170px;border-radius:16px;border:4px solid var(--black);background:${bg};color:${c};display:flex;align-items:flex-end;padding:14px;font:800 26px var(--sans)">${n}</div>`).join('')}</div>
    <div class="mb" style="display:flex;align-items:baseline;gap:30px;border-top:3px solid var(--black);padding-top:24px"><b style="font:900 150px/.8 var(--sans);font-stretch:70%">Aa</b><span style="font:400 150px/.8 var(--serif);font-style:italic">Aa</span><small style="font:600 28px/1.2 var(--sans);color:var(--muted)">título forte<br>+ assinatura</small></div>
    <div class="mb" style="display:grid;place-items:center;height:210px;border-radius:18px;background:var(--black);color:var(--paper);font:900 110px/.85 var(--sans);font-stretch:70%;letter-spacing:-.02em">SUA MARCA</div></div>`, pai)
}

// engrenagem (contorno) pra cena da "máquina"
function engrenagem(pai, { r = 300, dentes = 14, estilo = '', cor = '#2a2a2a', larg = 10 } = {}) {
  const pts = []
  for (let i = 0; i < dentes; i++) {
    const a0 = (i / dentes) * Math.PI * 2, w = Math.PI / dentes
    for (const [a, rr] of [[a0 - w * 0.55, r * 0.84], [a0 - w * 0.35, r], [a0 + w * 0.35, r], [a0 + w * 0.55, r * 0.84]]) pts.push([Math.cos(a) * rr, Math.sin(a) * rr])
  }
  const d = 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join('L') + 'Z'
  const g = el(`<svg style="position:absolute;overflow:visible;${estilo}" width="${r * 2}" height="${r * 2}" viewBox="${-r} ${-r} ${r * 2} ${r * 2}"><path d="${d}" fill="none" stroke="${cor}" stroke-width="${larg}" stroke-linejoin="round"/><circle r="${r * 0.32}" fill="none" stroke="${cor}" stroke-width="${larg}"/></svg>`, pai)
  return g
}
// cabeçalho de cada peça da máquina: "PEÇA 1/6 · NOME" + título
function peca(c, n, nome, linhas, t, { cor } = {}) {
  const lab = el(`<div class="label" style="left:80px;top:250px;display:flex;align-items:center;gap:18px${cor ? ';color:' + cor : ''}"><span class="pill" style="font-size:28px;padding:10px 20px;${cor ? 'background:var(--paper);color:var(--black)' : ''}">${n}/6</span>${nome}</div>`, c)
  pula(lab, t, { y: 30 })
  const a = titulo(c, linhas, { cls: 'm', top: 320, cor })
  sobeLinhas(a.linhas, t + 0.08)
  cue(t, 'whoosh', 0.55)
  return a
}

// ─── peças tiradas do site ───────────────────────────────────
const fmt = s => s.replace(/\*([^*]+)\*/g, '<span class="s">$1</span>')
// notificação grande (legível no celular)
const notifGrande = (pai, { logo: lg, titulo, texto, quando = 'agora' }, estilo = '') =>
  el(`<div class="ng" style="${estilo}">${logo(lg)}<div class="ng__topo"><b>${titulo}</b><span>${quando}</span></div><div class="ng__txt">${texto}</div></div>`, pai)

// ingresso de serviço (igual aos cartões da roda do site)
const ingresso = (pai, { tag = '', titulo, texto = '', logos: ls = [], arte = '' }, estilo = '') =>
  el(`<div class="ing" style="${estilo}">${ls.length ? `<div class="ing__logos">${ls.map(n => logo(n, n === 'tiktok' || n === 'instagram' ? 'cheio' : '')).join('')}</div>` : ''}<div class="ing__tag">${tag}</div><h3>${fmt(titulo)}</h3><p>${fmt(texto)}</p><div class="ing__arte">${arte}</div></div>`, pai)

// roda de ingressos: giram em volta de um pivô bem abaixo da tela; gira(i, t) traz o ingresso i pra frente
function roda(pai, itens, { cx = 540, cy = 1060, raio = 1500, passo = 30 } = {}) {
  const r = el(`<div style="position:absolute;left:${cx}px;top:${cy + raio}px;width:0;height:0"></div>`, pai)
  const ings = itens.map((it, i) => {
    const g = el(`<div style="position:absolute;left:0;top:0;width:0;height:0;transform:rotate(${i * passo}deg)"></div>`, r)
    return ingresso(g, it, `left:-330px;top:${-raio - 410}px`)
  })
  let atual = 0
  gsap.set(r, { rotate: 0 })
  return { r, ings, gira: (i, t, dur = 0.55) => { vai(r, { rotate: -atual * passo }, { rotate: -i * passo, duration: dur, ease: 'back.inOut(1.2)' }, t); cue(t, 'whoosh', 0.4); atual = i } }
}

// mapa do Oeste (desenho do site); devolve os pinos por cidade
function mapaOeste(pai, estilo) {
  const m = el(`<div class="mapa" style="${estilo}">${MAPA}</div>`, pai)
  const pinos = Object.fromEntries($$('a[data-city]', m).map(a => [a.dataset.city, a]))
  $$('.pin', m).forEach(p => gsap.set(p, { transformOrigin: '0 0' }))
  return { m, pinos }
}

// painel do método (01 Diagnóstico...)
const painel = (pai, { num, titulo, texto, mao = '', escuro = false }, estilo = '') =>
  el(`<div class="mp${escuro ? ' escuro' : ''}" style="${estilo}"><div class="mp__num">${num}</div><h3>${fmt(titulo)}</h3><p>${texto}</p>${mao ? `<div class="mao">${mao}</div>` : ''}</div>`, pai)

// botão principal do site (preto, texto papel, ícone do WhatsApp)
const botaoSite = (pai, texto, estilo = '') =>
  el(`<div class="botao" style="${estilo}">${LOGOS.whatsapp.replace('fill="#25d366"', 'fill="currentColor"').replace('<svg', '<svg width="64" height="64"')}${texto}</div>`, pai)

// selo grande e legível: anel "FEITO NO OESTE DA BAHIA" girando + "DESDE 2016" parado no centro
function seloGrande(pai, estilo) {
  const id = 'anelg' + ++nSelo
  const s = el(`<div class="selog" style="${estilo}"><svg viewBox="0 0 120 120"><defs><path id="${id}" d="M60 60m-47 0a47 47 0 1 1 94 0a47 47 0 1 1-94 0"/></defs>
    <circle cx="60" cy="60" r="58" fill="#0b0b0b" stroke="#f3f2ee" stroke-width="1.5"/><circle cx="60" cy="60" r="38" fill="none" stroke="#f3f2ee" stroke-width=".8" stroke-dasharray="1.5 2.5"/>
    <g class="anel"><text><textPath href="#${id}" textLength="290" lengthAdjust="spacing">FEITO NO OESTE DA BAHIA · 8 CIDADES ·</textPath></text></g>
    <text x="60" y="50" text-anchor="middle" style="font:800 7px Archivo;letter-spacing:.3em">DESDE</text>
    <text x="60" y="74" text-anchor="middle" style="font:900 26px Archivo;font-stretch:72%;letter-spacing:0">2016</text>
    <image href="${LOGO_VIVA}" x="44" y="79" width="32" height="15"/></svg></div>`, pai)
  const anel = $('.anel', s); gsap.set(anel, { transformOrigin: '60px 60px' })
  return { s, anel }
}
