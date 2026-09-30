// Reels "Sua empresa tá viva?" (54,5 s, 120 BPM depois do drop: 1 tempo = 0,5 s).
// O vídeo mede o pulso da empresa de quem assiste. O palco é um celular gigante; a etiqueta da Viva (a do site) fica no topo.
// 0–13,5 s: a empresa sem pulso (Google, Instagram, WhatsApp): o que é dela está apagado, o coração desacelera, linha reta.
// 13,5 s: o bip. A tinta volta, cada prova sai da tela como ficha de papel, e depois vêm a roda, o método, o Oeste,
// as notificações e o cartão final, que repete o quadro 0 com ponto final (loop).
// Zona segura: textos em x 80–930, y 240–1470. Variantes do fim: window.VARIANTE = 'anuncio' | 'direct'.
KIT.entrada = 'empurra'
KIT.dEntrada = 0.3
const DUR = 54.5
const VAR = window.VARIANTE || ''
const T2 = 4.5, T3 = 7.1, T4 = 10.0, T5 = 13.5, T6 = 17.0, T7 = 19.5, T8 = 23.0, T9 = 26.5, T10 = 29.5, T11 = 33.5, T12 = 40.5, T13 = 45.0, T14 = 49.5

el(`<style>
.ti { position: absolute; left: 80px; right: 150px; font-weight: 900; font-stretch: 72%; line-height: .9; letter-spacing: -.02em; }
.ti .s { display: inline-block; font-family: var(--serif); font-style: italic; font-weight: 400; font-stretch: 100%; letter-spacing: -.01em; }
/* etiqueta da marca = .label do site: logo, traço e rótulo, sem fundo (pílula preta só no botão do CTA) */
.etq { position: absolute; left: 80px; top: 250px; height: 60px; color: var(--black); display: flex; align-items: center; gap: 22px; z-index: 45; visibility: hidden; white-space: nowrap; }
.etq img { height: 60px; display: block; filter: brightness(0); }
.etq i { width: 40px; height: 4px; background: currentColor; flex: none; }
.etq .rot { height: 46px; overflow: hidden; font: 700 40px/46px var(--sans); letter-spacing: .16em; }
.etq .rot span { display: block; }
.etq.inv { color: var(--paper); }
.etq.inv img { filter: none; }
.ilus { position: absolute; right: 150px; top: 257px; font: 500 40px/46px var(--sans); color: #55524d; z-index: 45; visibility: hidden; }
.ilus.inv { color: #c9c6bf; }
.carimbo { position: absolute; padding: 14px 30px 10px; border: 9px solid var(--black); border-radius: 14px; font: 900 130px/.9 var(--sans); font-stretch: 70%; text-align: center; letter-spacing: .01em; color: var(--black); background: rgba(243,242,238,.5); mix-blend-mode: multiply; white-space: nowrap; }
.scr { position: absolute; inset: 0; }
.ov { position: absolute; inset: 0; }
.gw { font: 500 90px/1 Arial, sans-serif; letter-spacing: -3px; }
.gG { font: 700 44px/1 Arial, sans-serif; }
.gbar { position: absolute; left: 60px; width: 776px; height: 110px; border: 3px solid #dfe1e5; border-radius: 60px; display: flex; align-items: center; gap: 22px; padding: 0 34px; font: 500 46px var(--sans); color: #202124; background: #fff; box-shadow: 0 4px 14px rgba(0,0,0,.08); }
.gbar .cur { width: 3px; height: 50px; background: #202124; }
.gbar .fx { margin-left: auto; font: 400 50px/1 Arial, sans-serif; color: #70757a; }
.gres { position: absolute; left: 60px; width: 776px; height: 120px; padding: 14px 24px; border-bottom: 2px solid #ececec; background: #fff; }
.gres b { display: block; font: 700 46px/1.1 var(--sans); color: #1a0dab; }
.gres span { font: 500 40px/1.2 var(--sans); color: #4d5156; }
.est { color: #fbbc04; letter-spacing: 2px; }
.vaga { position: absolute; left: 60px; width: 776px; height: 160px; border: 4px dashed #c9c6bf; border-radius: 24px; display: grid; place-items: center; font: 700 60px/1 var(--hand); color: #55524d; }
.raiox { position: absolute; left: 0; right: 0; height: 90px; background: linear-gradient(rgba(11,11,11,0), rgba(11,11,11,.14)); border-bottom: 8px solid var(--black); }
.ig-av { position: absolute; width: 150px; height: 150px; border-radius: 50%; display: grid; place-items: center; }
.ig-nome { position: absolute; font: 800 48px/1 var(--sans); }
.ig-bio { position: absolute; height: 22px; border-radius: 11px; background: #e6e4de; }
.ig-g { position: absolute; width: 252px; height: 252px; overflow: hidden; }
.ig-g.morto { background: #e6e4de; display: grid; place-items: center; }
.etq-p { position: absolute; padding: 10px 18px; border-radius: 10px; background: var(--black); color: var(--paper); font: 800 40px/1 var(--sans); white-space: nowrap; }
.cinza { filter: grayscale(1); opacity: .55; }
.wa-topo { position: absolute; left: 0; right: 0; top: 68px; height: 110px; background: #f7f7f5; display: flex; align-items: center; gap: 24px; padding: 0 60px 0 70px; border-bottom: 2px solid #e2e0da; }
.wa-av { width: 90px; height: 90px; border-radius: 50%; display: grid; place-items: center; font: 900 40px var(--sans); flex: none; }
.wa-topo b { display: block; font: 800 46px/1.05 var(--sans); }
.wa-topo small { display: block; font: 500 40px/1.1 var(--sans); color: #55524d; }
.wa-topo .logo-ic { margin-left: auto; width: 64px; height: 64px; box-shadow: none; background: none; }
.wa-topo.morto b, .wa-topo.morto small { color: #8a8680; }
.wa-fundo { position: absolute; left: 0; right: 0; top: 178px; bottom: 0; background: #efeae2; }
.wb { position: absolute; max-width: 700px; padding: 16px 24px 12px; border-radius: 24px; font: 500 46px/1.2 var(--sans); background: #fff; box-shadow: 0 2px 0 rgba(0,0,0,.08); white-space: nowrap; }
.wb small { display: block; text-align: right; font: 500 32px/1 var(--sans); color: #667; margin-top: 4px; }
.wb.eu { background: #d9fdd3; }
.wb.morto { background: #f0f0ec; color: #8a8680; box-shadow: none; }
.chip { position: absolute; left: 50%; translate: -50% 0; display: flex; align-items: center; gap: 16px; padding: 12px 26px; border-radius: 14px; background: #e6e4de; font: 800 40px/1 var(--sans); letter-spacing: .06em; white-space: nowrap; }
/* ficha de papel do site: a prova que sai da tela quando ela revive */
.ficha { position: absolute; background: var(--white); border: 4px solid var(--black); border-radius: 24px; color: var(--black); }
.pb { display: inline-flex; align-items: center; gap: 10px; padding: 10px 22px; border: 3px solid #0b0b0b; border-radius: 99px; font: 700 40px/1 var(--sans); background: #fff; }
.pb .logo-ic { width: 44px; height: 44px; border-radius: 10px; box-shadow: none; }
.faixa2 { position: absolute; left: -200px; right: -200px; height: 118px; display: flex; align-items: center; white-space: nowrap; overflow: hidden; }
.faixa2 .tr { display: inline-flex; align-items: center; gap: 30px; font: 900 60px/1 var(--sans); font-stretch: 75%; text-transform: uppercase; }
.faixa2 .tr .logo-ic { width: 90px; height: 90px; border-radius: 22px; box-shadow: 0 0 0 3px var(--black); }
.faixa2 .tr .nm { font: 800 56px/1 var(--sans); font-stretch: 85%; text-transform: none; }
.aba { position: absolute; left: 210px; width: 660px; height: 820px; background: var(--white); border: 4px solid var(--black); border-radius: 30px; box-shadow: 14px 14px 0 var(--black); display: flex; align-items: flex-start; gap: 22px; padding: 18px 36px; color: var(--black); }
.aba .logo-ic { width: 64px; height: 64px; border-radius: 16px; box-shadow: 0 0 0 3px var(--black); flex: none; }
.aba b { font: 900 64px/64px var(--sans); font-stretch: 72%; }
.cxp { position: absolute; width: 250px; height: 320px; background: var(--paper-2); border: 5px solid var(--black); border-radius: 12px; box-shadow: 14px 14px 0 var(--black); }
.cxp .fx { background: var(--black); color: var(--paper); font: 900 40px/1 var(--sans); font-stretch: 72%; padding: 18px 10px 14px; text-align: center; }
.cxp .mao { left: 10px; right: 10px; top: 118px; text-align: center; font-size: 64px; line-height: .95; rotate: -3deg; background: var(--white); border: 3px solid var(--black); padding: 8px 4px; }
.cxp::before { content: ''; position: absolute; top: -18px; left: 50%; width: 110px; height: 34px; translate: -50% 0; rotate: 4deg; background: rgba(210,206,198,.9); }
.mpc { position: absolute; left: 80px; width: 840px; height: 130px; border: 4px solid var(--black); border-radius: 24px; background: var(--white); color: var(--black); box-shadow: 12px 12px 0 var(--black); display: flex; align-items: center; gap: 30px; padding: 0 36px; }
.mpc.escuro { background: var(--black); color: var(--paper); border-color: var(--paper); box-shadow: 12px 12px 0 #55524d; }
.mpc .n { font: 400 110px/1 var(--serif); font-style: italic; width: 110px; }
.mpc b { font: 900 64px/1 var(--sans); font-stretch: 72%; }
.busca-m { position: absolute; left: 80px; width: 846px; height: 90px; border-radius: 45px; background: #161616; border: 3px solid rgba(243,242,238,.18); display: flex; align-items: center; gap: 18px; padding: 0 30px; color: var(--paper); font: 700 42px/1 var(--sans); white-space: nowrap; }
.busca-m .mao { position: static; font-size: 56px; color: #c9c6bf; margin-left: auto; }
.lock-h { position: absolute; left: 0; right: 0; text-align: center; font: 300 130px/1 var(--sans); color: var(--paper); letter-spacing: -.02em; }
.lock-d { position: absolute; left: 0; right: 0; text-align: center; font: 600 40px/1 var(--sans); color: #d8d6d0; }
.ng.n3 { width: 820px; height: 176px; grid-template-columns: 90px 1fr; align-content: center; gap: 2px 24px; padding: 18px 30px; border-radius: 40px; }
.ng.n3 .logo-ic { width: 90px; height: 90px; border-radius: 24px; }
.ng.n3 .ng__topo { font-size: 34px; }
.ng.n3 .ng__topo b { font-size: 38px; }
.ng.n3 .ng__txt { font-size: 40px; line-height: 1.12; }
.mapa text { font-size: 36px; }
.mapa text.main { font-size: 48px; }
.mapa .hand-t { font-size: 52px; }
.mapa .compass { display: none; }
</style>`, document.head)

// ── ajudantes ──────────────────────────────────────────────
const titulo2 = (pai, linhas, top, px, cor) => {
  const t = el(`<div class="ti" style="top:${top}px;font-size:${px}px${cor ? ';color:' + cor : ''}">${linhas.map(l => `<span class="linha"><span>${fmt(l)}</span></span>`).join('')}</div>`, pai)
  return { t, linhas: $$('.linha > span', t) }
}
const escreve = (alvo, t, dur = 0.4) => vai(alvo, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: dur, ease: 'power2.inOut' }, t)
// traço livre (coordenadas do quadro 1080x1920, ou de um viewBox próprio) que se desenha
function risca(pai, d, t, dur = 0.35, { vb = '0 0 1080 1920', estilo = 'left:0;top:0;width:1080px;height:1920px', larg = 8, cor = 'currentColor' } = {}) {
  const s = el(`<svg class="traco" viewBox="${vb}" style="${estilo};stroke-width:${larg};color:${cor}"><path d="${d}"/></svg>`, pai)
  const p = $('path', s), L = p.getTotalLength()
  gsap.set(p, { strokeDasharray: `${L} ${L + 40}`, strokeDashoffset: t == null ? 0 : L + 20 })
  if (t != null) vai(p, { strokeDashoffset: L + 20 }, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut' }, t)
  return s
}
const tremeX = (alvo, t, f = 10, dur = 0.3) => { const n = 6; for (let i = 0; i < n; i++) TL.to(alvo, { x: (i % 2 ? -f : f) * (1 - i / n), rotation: (i % 2 ? -0.6 : 0.6) * (1 - i / n), duration: dur / n, ease: 'none', immediateRender: false }, t + i * dur / n); TL.to(alvo, { x: 0, rotation: 0, duration: 0.04, immediateRender: false }, t + dur) }
const pulsa = (alvo, t, s = 1.06) => vai(alvo, { scale: 1 }, { scale: s, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.out' }, t)
const LUPA = icone.lupa.replace('width="40" height="40"', 'width="46" height="46"')
// troca de app: título e conteúdo da tela saem pra esquerda; os novos entram montados da direita (moldura parada)
function trocaApp(sai, entra, t, d = 0.3) {
  sai.forEach(e => vai(e, { x: 0 }, { x: -1080, duration: d, ease: 'power3.inOut' }, t))
  entra.forEach(e => { gsap.set(e, { x: 1080 }); vai(e, { x: 1080 }, { x: 0, duration: d, ease: 'power3.inOut' }, t) })
  cue(t, 'whoosh', 0.45)
}
// a cena anterior recua enquanto a nova empurra (sem painel chapado, sem quadro vazio)
const recua = (c, t, eixo = 'y') => eixo === 'y'
  ? vai(c, { y: 0, filter: 'brightness(1)' }, { y: -300, filter: 'brightness(0.6)', duration: 0.3, ease: 'power3.inOut' }, t - 0.3)
  : vai(c, { x: 0, filter: 'blur(0px)' }, { x: -1080, filter: 'blur(8px)', duration: 0.3, ease: 'power3.inOut' }, t - 0.3)
// ficha: a prova pousa como ficha de papel do site (sombra dura, girada, maior)
function pousa(f, t, { rot = -2, esc = 1.04, dx = 0, dur = 0.35 } = {}) {
  vai(f, { y: -40, x: dx, scale: 1.2, rotate: 0, boxShadow: '0px 0px 0 #0b0b0b', opacity: 0 }, { y: 0, x: dx, scale: esc, rotate: rot, boxShadow: '14px 14px 0 #0b0b0b', opacity: 1, duration: dur, ease: 'back.out(1.6)' }, t)
}
// ruído determinístico (0–1) pra tremida e picos desiguais
const rnd = k => { const x = Math.sin(k * 12.9898) * 43758.5453; return x - Math.floor(x) }

// PULSO À MÃO: o traço corre pra esquerda e cada batida aparece na borda direita no instante do som.
let nEcg = 0
function ecgT(pai, estilo, { w, batidas, t0, t1, vel = 340, larg = 8, k = 1, alto = b => 0.85 + 0.3 * rnd(b), cls = '', fade = true }) {
  const y0 = 55 * k, tb = t0 - w / vel, X = t => (t - tb) * vel, id = 'trem' + ++nEcg
  let d = `M0 ${y0}`
  batidas.filter(b => b > tb - 1 && b < t1 + 1).sort((a, b) => a - b).forEach(b => {
    const x = X(b), a = alto(b) * k, p = dx => (x + dx * k).toFixed(1)
    d += ` L${p(-70)} ${y0} Q${p(-55)} ${y0 - 9 * a} ${p(-40)} ${y0} L${p(-14)} ${y0} L${p(-8)} ${y0 + 12 * a} L${p(0)} ${y0 - 50 * a} L${p(8)} ${y0 + 22 * a} L${p(16)} ${y0} L${p(55)} ${y0} Q${p(78)} ${y0 - 14 * a} ${p(100)} ${y0}`
  })
  d += ` L${X(t1 + 1).toFixed(1)} ${y0}`
  const W = Math.ceil(X(t1 + 1)), H = 110 * k
  const e = el(`<div class="${cls}" style="position:absolute;overflow:hidden;height:${H}px;width:${w}px;${fade ? '-webkit-mask-image:linear-gradient(90deg,transparent,#000 40px);mask-image:linear-gradient(90deg,transparent,#000 40px);' : ''}${estilo}"><svg viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:visible"><defs><filter id="${id}" x="-2%" y="-40%" width="104%" height="180%"><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed="${nEcg}"/><feDisplacementMap in="SourceGraphic" scale="${2.5 * k}"/></filter></defs><path d="${d}" fill="none" stroke="currentColor" stroke-width="${larg}" stroke-linecap="round" stroke-linejoin="round" filter="url(#${id})"/></svg></div>`, pai)
  vai($('svg', e), { x: 0 }, { x: -(t1 - t0) * vel, duration: t1 - t0, ease: 'none' }, t0)
  return e
}
// escala um path (só comandos M/L/C/Q/S/T, em pares x y) pra caixa x,y,w,h a partir de um viewBox largura×altura
function escalaPath(d, x, y, sx, sy) {
  const tk = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g)
  let cmd = 'M', i = 0, out = []
  for (const t of tk) {
    if (/[a-zA-Z]/.test(t)) { cmd = t; i = 0; out.push(t); continue }
    const v = +t, abs = cmd === cmd.toUpperCase(), eixoX = i % 2 === 0
    out.push((eixoX ? (abs ? x : 0) + v * sx : (abs ? y : 0) + v * sy).toFixed(1)); i++
  }
  return out.join(' ')
}
// círculo à mão + cauda que desce pela margem e vira a linha do pulso (um traço só)
function circuloCauda(pai, { x, y, w, h, base, cor = 'currentColor', larg = 8, t, dur = 0.5 }) {
  const dC = escalaPath(TRACOS.circulo[1], x, y, w / 200, h / 80)
  const x0 = x + 0.05 * w, y0 = y + 0.66 * h
  const dT = `M${x0.toFixed(1)} ${y0.toFixed(1)} C ${(x - 22).toFixed(1)} ${(y + h + 20).toFixed(1)}, ${(x - 16).toFixed(1)} ${(base - 70).toFixed(1)}, 80 ${base}`
  const s = el(`<svg class="traco" viewBox="0 0 1080 1920" style="left:0;top:0;width:1080px;height:1920px;stroke-width:${larg};color:${cor}"><path class="c" d="${dC}"/><path class="k" d="${dT}"/></svg>`, pai)
  ;[['.c', 0, 0.7], ['.k', 0.7, 0.3]].forEach(([sel, a, f]) => {
    const p = $(sel, s), L = p.getTotalLength()
    gsap.set(p, { strokeDasharray: `${L} ${L + 40}`, strokeDashoffset: t == null ? 0 : L + 20 })
    if (t != null) vai(p, { strokeDashoffset: L + 20 }, { strokeDashoffset: 0, duration: dur * f, ease: 'power2.inOut' }, t + dur * a)
  })
  return s
}

// ── o coração (som + pulso): 72 BPM, depois 60, depois duas batidas fracas e para ──
const BAT1 = [0, 0.83, 1.67, 2.5, 3.33, 4.17, 5.0, 5.83, 6.67, 7.5, 8.5, 9.5, 11.2, 12.2]
const FORCA = { 11.2: 0.7, 12.2: 0.4 }
BAT1.forEach(b => cue(b, 'coracao', FORCA[b] || 0.9))
const antes = n => Array.from({ length: n }, (_, i) => -(i + 1) * 0.83)

// ── etiqueta da marca (camada fixa): um rótulo por cena, rolando no meio da entrada ──
const ETQS = [
  [0, 'OESTE DA BAHIA'], [T2, 'RAIO-X · 1/3', 'ecg'], [T3, 'RAIO-X · 2/3', 'ecg'], [T4, 'RAIO-X · 3/3', 'ecg'],
  [T6, 'NO GOOGLE'], [T7, 'NO INSTAGRAM'], [T8, 'NO WHATSAPP'], [T9, 'BUSCA POR IA'],
  [T10, 'O QUE A GENTE FAZ'], [T11, 'O MÉTODO'], [T12, 'ONDE A GENTE ATUA', 'inv'], [T13, 'O QUE MUDA', 'inv'], [T14, 'OESTE DA BAHIA'],
]
ETQS.forEach(([t, rot, extra], i) => {
  const p = el(`<div class="etq${extra === 'inv' ? ' inv' : ''}"><img src="${LOGO_VIVA}" alt="Agência Viva"><i></i><div class="rot"><span>${rot}</span></div></div>`)
  if (extra === 'ecg') ecgT(p, 'position:relative;flex:none', { w: 100, batidas: BAT1, t0: T2 - 0.2, t1: 13.5, vel: 90, larg: 4, k: 0.4, alto: b => FORCA[b] || 1, fade: false })
  const t0 = t === T6 ? T6 - 0.05 : t > 0 ? t - 0.2 : 0
  const fim = t === T4 ? 13.4 : ETQS[i + 1] ? ETQS[i + 1][0] - 0.2 : DUR + 1
  if (t <= 0) gsap.set(p, { visibility: 'visible' }); else TL.set(p, { visibility: 'visible' }, t0)
  TL.set(p, { visibility: 'hidden' }, fim)
  if (t > 0) vai($('.rot span', p), { yPercent: 100 }, { yPercent: 0, duration: 0.25, ease: 'power3.out' }, t0)
  if (t === T4) vai(p, { opacity: 1 }, { opacity: 0, duration: 0.2 }, 13.15)
})
// '*ilustração' na linha da etiqueta, alinhada à direita (cenas 6–9 e 13)
;[[T6 - 0.05, T10 - 0.2, ''], [T13 - 0.2, T14 - 0.2, ' inv']].forEach(([a, b, cls]) => {
  const e = el(`<div class="ilus${cls}">*ilustração</div>`)
  TL.set(e, { visibility: 'visible' }, a); TL.set(e, { visibility: 'hidden' }, b)
})

// ════ ATO 1 (0–13,5): a empresa sem pulso, no mesmo celular ════════════════
const A = cena('papel grao', 0, T5)
const celA = celularG(A, { top: 900 })
const tA = celA.tela
// quadro 0: a frase-mãe do site virada em pergunta; círculo com cauda e pulso já desenhados
const t1 = titulo2(A, ['Sua empresa tá', '<span class="s" style="margin:0 .2em 0 .1em">viva</span> no celular', 'de quem compra?'], 420, 120)
const circ1 = circuloCauda(A, { x: 50, y: 520, w: 280, h: 145, base: 820 })
const ecg1 = ecgT(A, 'left:80px;top:765px;color:var(--black)', { w: 920, batidas: [...antes(4), ...BAT1.slice(0, 7)], t0: 0, t1: T2 })
;[0, 0.83, 1.67, 2.5, 3.33, 4.17].forEach(b => pulsa($('.s', t1.t), b))
vai(A, { scale: 1 }, { scale: 1.03, duration: 4.2, ease: 'none', transformOrigin: '50% 40%' }, 0)
vai(A, { scale: 1.03 }, { scale: 1, duration: 0.3, ease: 'power2.inOut' }, 4.2)

// tela do Google: logo, barra e, depois do enter, a lista
const G = el('<div class="scr"></div>', tA)
const gLogo = el('<div class="gw" style="position:absolute;left:0;right:0;top:40px;text-align:center"><span style="color:#4285f4">G</span><span style="color:#ea4335">o</span><span style="color:#fbbc05">o</span><span style="color:#4285f4">g</span><span style="color:#34a853">l</span><span style="color:#ea4335">e</span></div>', G)
const gBar = el(`<div class="gbar" style="top:188px"><span class="lp">${LUPA}</span><span class="gG" style="display:none;color:#9a978f">G</span><span class="termo">pizzaria em Barreiras</span><span class="cur"></span><span class="fx">✕</span></div>`, G)
const termo = $('.termo', gBar)
{
  const texto = t => t < 1.55 ? 'pizzaria em Barreiras' : t < 1.95 ? 'revenda agrícola Barreiras'.slice(0, Math.round((t - 1.55) * 65)) : t < 3.75 ? 'revenda agrícola Barreiras' : t < 3.85 ? '' : 'loja de roupa em Barreiras'
  const o = { p: 0 }
  vai(o, { p: 0 }, { p: 1, duration: 2.5, ease: 'none', onUpdate: () => { termo.textContent = texto(1.5 + o.p * 2.5) } }, 1.5)
  vai(termo, { backgroundColor: 'rgba(210,227,252,0)' }, { backgroundColor: 'rgba(210,227,252,1)', duration: 0.03 }, 1.5)
  TL.set(termo, { backgroundColor: 'rgba(210,227,252,0)' }, 1.55)
  cue(1.5, 'digita', 0.3); cue(1.55, 'digita', 0.7)
  // ✕ limpa a barra e abre 'Pesquisas recentes'; o toque na recente leva o texto pra barra
  const fx = $('.fx', gBar)
  vai(fx, { scale: 1 }, { scale: 0.8, duration: 0.05, yoyo: true, repeat: 1 }, 3.75); cue(3.75, 'tique', 0.5)
  const rec = el(`<div style="position:absolute;left:60px;top:318px;width:776px;padding:18px 34px;background:#fff;border-radius:0 0 30px 30px;box-shadow:0 10px 20px rgba(0,0,0,.08)"><div style="font:600 34px var(--sans);color:#70757a;margin-bottom:14px">Pesquisas recentes</div><div class="lin" style="display:flex;align-items:center;gap:20px;font:500 44px var(--sans);padding:6px 0;border-radius:10px"><svg viewBox="0 0 24 24" width="40" height="40"><circle cx="12" cy="12" r="9" fill="none" stroke="#70757a" stroke-width="2.2"/><path d="M12 7v5l3 2" fill="none" stroke="#70757a" stroke-width="2.2" stroke-linecap="round"/></svg>loja de roupa em Barreiras</div></div>`, G)
  gsap.set(rec, { opacity: 0 }); TL.set(rec, { opacity: 1 }, 3.75)
  vai($('.lin', rec), { backgroundColor: 'rgba(230,228,222,0)' }, { backgroundColor: 'rgba(230,228,222,1)', duration: 0.05 }, 3.85); cue(3.85, 'tique', 0.5)
  TL.set(rec, { opacity: 0 }, 3.95)
  vai(gBar, { scale: 1 }, { scale: 0.97, duration: 0.07, yoyo: true, repeat: 1 }, 4.0); cue(4.0, 'tique', 0.8)
  TL.set($('.cur', gBar), { opacity: 0 }, 4.0)
  vai(gLogo, { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: -60, scale: 0.6, duration: 0.2, ease: 'power2.in' }, 4.0)
  vai(gBar, { y: 0 }, { y: -110, duration: 0.25, ease: 'power3.inOut' }, 4.0)
  TL.set($('.lp', gBar), { display: 'none' }, 4.2); TL.set($('.gG', gBar), { display: 'inline' }, 4.2)
}
const lista = el('<div style="position:absolute;inset:0"></div>', G)
const RES = [['Concorrente', '★★★★★', 'aberto agora'], ['Outro concorrente', '★★★★☆', 'aberto agora'], ['Mais um concorrente', '★★★★★', 'aberto agora']]
const res = RES.map(([n, e, s], i) => el(`<div class="gres" style="top:${208 + i * 130}px"><b>${n}</b><span><span class="est">${e}</span> · ${s}</span></div>`, lista))
const vaga = el('<div class="vaga" style="top:618px">sua empresa aparece?</div>', lista)
vai(lista, { y: 500, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power3.out' }, 4.0)

// saída do quadro 0: título, círculo e pulso sobem; o celular sobe e o título da cena 2 vem preso nele
vai([t1.t, circ1, ecg1], { y: 0 }, { y: -700, duration: 0.3, ease: 'power2.in' }, 4.2)
vai([t1.t, circ1, ecg1], { opacity: 1 }, { opacity: 0, duration: 0.12, ease: 'none' }, 4.2)
vai(celA.c, { y: 0 }, { y: -300, duration: 0.3, ease: 'power3.inOut' }, 4.2)
cue(4.2, 'whoosh', 0.45)

// ── 2. RAIO-X 1/3: só aparece o concorrente (4,5–7,1) ──
const t2 = titulo2(A, ['Só aparece', '*o concorrente.*'], 370, 104)
vai(t2.t, { y: 300, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power3.inOut' }, 4.2)
{
  const T = T2
  const rx = el('<div class="raiox" style="top:0"></div>', G)
  gsap.set(rx, { opacity: 0 })
  TL.set(rx, { opacity: 1 }, T + 0.1); vai(rx, { y: 0 }, { y: 700, duration: 0.5, ease: 'power1.inOut' }, T + 0.1); TL.set(rx, { opacity: 0 }, T + 0.6)
  cue(T + 0.1, 'whoosh_desce', 0.4)
  res.forEach((r, i) => { vai(r, { backgroundColor: 'rgb(255,255,255)' }, { backgroundColor: 'rgb(248,250,247)', duration: 0.05 }, T + 0.2 + i * 0.1); vai(r, { backgroundColor: 'rgb(248,250,247)' }, { backgroundColor: 'rgb(255,255,255)', duration: 0.1 }, T + 0.3 + i * 0.1) })
  vai(vaga, { borderColor: 'rgba(201,198,191,1)' }, { borderColor: 'rgba(201,198,191,.3)', duration: 0.075, yoyo: true, repeat: 3 }, T + 0.65); cue(T + 0.65, 'tique', 0.6)
  risca(G, 'M128 648 L768 752', T + 0.8, 0.15, { larg: 8 }); risca(G, 'M768 648 L128 752', T + 0.95, 0.15, { larg: 8 }); cue(T + 0.8, 'erro', 0.5)
  const st = el('<div class="carimbo" style="left:204px;top:470px">SUMIDA</div>', G)
  carimba(st, T + 1.1, -9)
  tremeX(celA.c, T + 1.15, 8, 0.3)
}

// ── 3. RAIO-X 2/3: Instagram parado (7,1–10) ──
const teia = estilo => {
  const cx = 252, cy = 0, raios = [95, 110, 125, 140, 155, 170].map(a => a * Math.PI / 180)
  let d = raios.map(a => `M${cx} ${cy} L${(cx + Math.cos(a) * 250).toFixed(1)} ${(cy + Math.sin(a) * 250).toFixed(1)}`).join(' ')
  ;[55, 105, 155, 205].forEach(r => { d += ' M' + raios.map((a, i) => `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}${i < raios.length - 1 ? ` Q${(cx + Math.cos(a + 0.13) * r * 0.9).toFixed(1)} ${(cy + Math.sin(a + 0.13) * r * 0.9).toFixed(1)}` : ''}`).join(' ') })
  return `<svg class="traco" viewBox="0 0 252 252" style="${estilo};stroke-width:4;color:#0b0b0b"><path d="${d}"/></svg>`
}
const ICONE_IMG = '<svg viewBox="0 0 24 24" width="80" height="80"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="#c9c6bf" stroke-width="2"/><circle cx="9" cy="10" r="1.8" fill="#c9c6bf"/><path d="M4 18l5-5 4 4 3-3 4 4" fill="none" stroke="#c9c6bf" stroke-width="2"/></svg>'
// perfil do Instagram APAGADO (é tudo da empresa): sem tinta, contorno tracejado, logo cinza
const perfilMorto = pai => {
  const cab = el('<div class="mh" style="position:absolute;left:0;right:0;top:0;height:270px;background:#fff"></div>', pai)
  el(`<span class="logo-ic cheio cinza" style="position:absolute;left:60px;top:18px;width:44px;height:44px;border-radius:12px;box-shadow:none">${LOGOS.instagram}</span>`, cab)
  el('<div class="ig-av" style="left:60px;top:68px;border:5px dashed #c9c6bf"><svg viewBox="0 0 24 24" width="80" height="80"><circle cx="12" cy="9" r="4" fill="#c9c6bf"/><path d="M4 21c1-5 5-7 8-7s7 2 8 7" fill="#c9c6bf"/></svg></div>', cab)
  el('<div class="ig-nome" style="left:238px;top:92px;color:#8a8680">suaempresa</div>', cab)
  el('<div class="ig-bio" style="left:238px;top:166px;width:420px"></div>', cab); el('<div class="ig-bio" style="left:238px;top:204px;width:300px"></div>', cab)
  const blocos = [0, 1, 2, 3, 4, 5].map(i => el(`<div class="ig-g morto" style="left:${60 + (i % 3) * 258}px;top:${278 + Math.floor(i / 3) * 258}px">${ICONE_IMG}</div>`, pai))
  const veu = el('<div style="position:absolute;inset:0;background:rgba(230,228,222,.3)"></div>', pai)
  const w = el(teia('left:576px;top:278px;width:252px;height:252px'), pai)
  return { cab, blocos, veu, w }
}
const I3 = el('<div class="scr"></div>', tA)
const t3 = titulo2(A, ['Último post:', '*há 4 meses.*'], 370, 104)
{
  const T = T3
  const { blocos, w } = perfilMorto(I3)
  const tg = el('<div class="etq-p" style="left:80px;top:300px">há 4 meses</div>', I3)
  const p = $('path', w), L = p.getTotalLength()
  gsap.set(p, { strokeDasharray: `${L} ${L + 40}`, strokeDashoffset: L * 0.5 })
  vai(p, { strokeDashoffset: L * 0.5 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut' }, T + 0.6)
  const rx = el('<div class="raiox" style="top:0"></div>', I3); gsap.set(rx, { opacity: 0 })
  TL.set(rx, { opacity: 1 }, T + 0.1); vai(rx, { y: 0 }, { y: 760, duration: 0.6, ease: 'power1.inOut' }, T + 0.1); TL.set(rx, { opacity: 0 }, T + 0.7)
  cue(T + 0.1, 'whoosh_desce', 0.4)
  vai(tg, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, T + 0.3)
  ;[[0.3, 1, 0.8], [0.7, 0.8, 0.65], [1.1, 0.65, 0.5]].forEach(([d, a, b]) => { vai(blocos, { opacity: a }, { opacity: b, duration: 0.08 }, T + d); cue(T + d, 'tique', 0.7) })
  const st = el('<div class="carimbo" style="left:190px;top:470px">PARADA</div>', I3)
  carimba(st, T + 1.2, -7)
}
gsap.set([I3, t3.t], { x: 1080 })
trocaApp([G, t2.t], [I3, t3.t], T3 - 0.3)

// ── 4. RAIO-X 3/3: WhatsApp respondendo 2 dias depois (10–13,5) ──
const W4 = el('<div class="scr"></div>', tA)
const t4 = titulo2(A, ['Respondeu', '*2 dias depois.*'], 370, 104)
{
  const T = T4
  el('<div class="wa-fundo"></div>', W4)
  el(`<div class="wa-topo morto"><span class="wa-av" style="border:4px dashed #c9c6bf"></span><div><b>Sua Empresa</b><small>visto por último há 2 dias</small></div><span class="logo-ic cinza">${LOGOS.whatsapp}</span></div>`, W4)
  el('<div class="wb" style="left:40px;top:208px">Oi! Tem esse vestido no M?<small>seg 09:12</small></div>', W4)
  const chip = el('<div class="chip" style="top:338px"><svg viewBox="0 0 24 24" width="44" height="44"><circle cx="12" cy="12" r="9.5" fill="none" stroke="#0b0b0b" stroke-width="2.4"/><path class="pont" d="M12 12V6" stroke="#0b0b0b" stroke-width="2.4" stroke-linecap="round"/></svg>2 DIAS DEPOIS</div>', W4)
  const b2 = el('<div class="wb eu morto" style="right:40px;top:438px">Oi, tem sim!<small>qua 10:40</small></div>', W4)
  const b3 = el('<div class="wb" style="left:40px;top:558px">Já comprei no concorrente.<small>qua 10:41</small></div>', W4)
  vai(chip, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, T + 0.3)
  vai($('.pont', chip), { rotate: 0 }, { rotate: 720, duration: 0.5, ease: 'power1.inOut', svgOrigin: '12 12' }, T + 0.3)
  for (let i = 0; i < 5; i++) cue(T + 0.3 + i * 0.1, 'tique', 0.6)
  vai(b2, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: 'back.out(1.8)' }, T + 0.3); cue(T + 0.3, 'pop', 0.5)
  vai(b3, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: 'back.out(1.8)' }, T + 0.5); cue(T + 0.5, 'erro', 0.8)
  tremeX(celA.c, T + 0.55, 10, 0.3)
  const st = el('<div class="carimbo" style="left:198px;top:138px;font-size:110px">VENDA<br>PERDIDA</div>', W4)
  carimba(st, T + 1.1, -8)
}
gsap.set([W4, t4.t], { x: 1080 })
trocaApp([I3, t3.t], [W4, t4.t], T4 - 0.3)
// a tela apaga, o monitor vira linha reta e o celular engole o quadro
{
  const veu = el('<div style="position:absolute;inset:0;background:#000;opacity:0;z-index:20"></div>', tA)
  vai(veu, { opacity: 0 }, { opacity: 0.85, duration: 0.3, ease: 'power2.in' }, 12.95)
  const fl = risca(A, 'M0 1080 C 120 1078, 240 1083, 300 1080 L330 1070 L350 1080 L372 1087 L382 1054 L394 1092 L406 1080 C 600 1082, 850 1077, 1080 1080', 12.95, 0.3, { larg: 8, cor: 'var(--paper)' })
  fl.style.zIndex = 30
  CUES.push({ t: 12.95, tipo: 'flatline', g: 1.0, d: 0.55 })
  vai(celA.c, { scale: 1 }, { scale: 3.4, duration: 0.35, ease: 'power3.in', transformOrigin: '470px 480px' }, 13.15)
  vai(t4.t, { opacity: 1 }, { opacity: 0, duration: 0.2 }, 13.15)
}

// ════ 5. A VIRADA (13,5–17): o bip. A Viva deixa sua empresa viva ═══════════
const B = cena('preta grao', T5, T6, { entra: 'corte' })
{
  const T = T5
  cue(T, 'bip', 1.0); cue(T, 'impacto', 1.0)
  flash(T, '#fff', 0.25)
  const lg = logoViva(B, 'position:absolute;left:80px;top:300px;width:520px', { preto: false })
  vai(lg, { scale: 1.15, rotate: -4 }, { scale: 1, rotate: -2, duration: 0.45, ease: 'back.out(1.8)', transformOrigin: '0% 50%' }, T)
  titulo2(B, ['A Viva deixa', 'sua empresa', '<span class="s" style="font-size:150px">viva.</span>'], 590, 130, 'var(--paper)')
  circuloCauda(B, { x: 40, y: 828, w: 350, h: 170, base: 1080, cor: 'var(--paper)', t: T + 0.3, dur: 0.5 }); cue(T + 0.3, 'tique', 0.8)
  ecgT(B, 'left:80px;top:1025px;color:var(--paper)', { w: 920, batidas: [13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17], t0: T, t1: T6, alto: b => (b === 13.5 ? 1.4 : 0.85 + 0.3 * rnd(b)) })
  // as duas faixas cruzadas do hero do site: cidades (papel) e plataformas (branca), chegando apagadas
  const CID = [...CIDADES, 'E todo o Oeste da Bahia']
  const PLAT = [['google', 'Google'], ['googlemaps', 'Google Maps'], ['instagram', 'Instagram'], ['whatsapp', 'WhatsApp'], ['ia', 'IA']]
  const fB = el(`<div class="faixa2" style="top:${1340 - 59}px;background:#fff;color:var(--black);transform:rotate(2.5deg)"><div class="tr">${[0, 1, 2].map(() => PLAT.map(([l, n]) => `<span class="logo-ic${l === 'instagram' ? ' cheio' : ''}">${l === 'ia' ? icone.ia : LOGOS[l]}</span><span class="nm">${n}</span><b style="opacity:.5">·</b>`).join('')).join('')}</div></div>`, B)
  const fA = el(`<div class="faixa2" style="top:${1250 - 59}px;background:var(--paper);color:var(--black);border-block:4px solid var(--black);transform:rotate(-3deg)"><div class="tr">${[0, 1, 2].map(() => CID.map(c => `<span>${c}</span><b style="opacity:.5">·</b>`).join('')).join('')}</div></div>`, B)
  vai($('.tr', fA), { x: -300 }, { x: -300 - 120 * 4, duration: 4, ease: 'none' }, T - 0.5)
  vai($('.tr', fB), { x: -1800 }, { x: -1800 + 120 * 4, duration: 4, ease: 'none' }, T - 0.5)
  ;[fA, fB].forEach(f => vai(f, { opacity: 0.35 }, { opacity: 1, duration: 0.3 }, T + 1.1))
  $$('.logo-ic', fB).forEach((l, i) => { gsap.set(l, { filter: 'grayscale(1)' }); vai(l, { filter: 'grayscale(1)' }, { filter: 'grayscale(0)', duration: 0.3 }, T + 1.1 + (i % 5) * 0.1) })
  for (let i = 0; i < 5; i++) cue(T + 1.1 + i * 0.1, 'pop', 0.5)
}

// ════ ATO 2 (17–29,5): cada tela revive no mesmo celular ═══════════════════
const C = cena('papel grao', T6, T10, { eixo: 'y' })
recua(B, T6)
const celC = celularG(C, { top: 600 })
const tC = celC.tela

// 6. Procurou? Achou você. (17–19,5): no pacote local do Maps a empresa entra completa, em 2º
const S6 = el('<div class="scr"></div>', tC), O6 = el('<div class="ov"></div>', C)
titulo2(O6, ['Procurou?', '*Achou você.*'], 370, 110)
{
  const T = T6
  const bar = el(`<div class="gbar" style="top:78px"><span class="gG"><span class="gc" style="color:#4285f4">G</span></span><span>loja de roupa em Barreiras</span></div>`, S6)
  vai($('.gc', bar), { color: '#9a978f' }, { color: '#4285f4', duration: 0.3 }, T)
  el('<div class="gres" style="top:198px"><b>Concorrente</b><span><span class="est">★★★★☆</span> · aberto agora</span></div>', S6)
  const r2 = el('<div class="gres" style="top:338px"><b>Outro concorrente</b><span><span class="est">★★★★☆</span> · aberto agora</span></div>', S6)
  const r3 = el('<div class="gres" style="top:468px"><b>Mais um concorrente</b><span><span class="est">★★★★★</span> · aberto agora</span></div>', S6)
  const vg = el('<div class="vaga" style="top:618px">sua empresa aparece?</div>', S6)
  ;[r2, r3, vg].forEach(e => vai(e, { y: 0 }, { y: 300, duration: 0.3, ease: 'power3.inOut' }, T))
  vai(vg, { opacity: 1 }, { opacity: 0, duration: 0.2 }, T)
  const f = el(`<div class="ficha" style="left:110px;top:955px;width:810px;height:280px;overflow:hidden">
    <div style="position:absolute;left:24px;top:24px;width:150px;height:150px;border-radius:16px;background:#e6e4de;overflow:hidden"><svg viewBox="0 0 150 150" width="150" height="150"><path d="M0 95 L150 70 M60 0 L85 150 M0 30 L150 45" stroke="#fff" stroke-width="12"/></svg><span class="anel" style="position:absolute;left:55px;top:43px;width:40px;height:40px;border-radius:50%;border:4px solid #0b0b0b"></span><svg viewBox="-16 -50 32 52" width="38" height="60" style="position:absolute;left:56px;top:20px"><path d="M0 0C-11-17-16-25-16-33a16 16 0 1 1 32 0C16-25 11-17 0 0Z" fill="#0b0b0b"/><circle cy="-33" r="5" fill="#fff"/></svg></div>
    <div style="position:absolute;left:200px;top:26px"><b class="se" style="font:800 50px/1.1 var(--sans)">Sua Empresa</b><div style="font:500 40px/1.3 var(--sans);color:#4d5156"><span class="est">★★★★★</span> · <span style="color:#188038">Aberto agora</span></div></div>
    <div style="position:absolute;left:24px;top:192px;display:flex;gap:14px"><span class="pb"><svg viewBox="0 0 24 24" width="36" height="36"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="#0b0b0b"/></svg>Ligar</span><span class="pb"><svg viewBox="0 0 24 24" width="36" height="36"><path d="M12 2l9 9-9 9-9-9z" fill="#0b0b0b"/><path d="M9 13v-2.5h5V8l3 3-3 3v-1.5h-3V13z" fill="#fff"/></svg>Rota</span><span class="pb">${logo('whatsapp')}WhatsApp</span></div>
    <i class="brilho" style="position:absolute;top:0;bottom:0;width:120px;left:-160px;background:linear-gradient(100deg,transparent,rgba(255,255,255,.7),transparent)"></i></div>`, O6)
  pousa(f, T + 0.1, { rot: -2 }); cue(T + 0.1, 'pop', 0.7)
  vai($('.brilho', f), { x: 0 }, { x: 1100, duration: 0.5, ease: 'power2.inOut' }, T + 0.35)
  vai($('.anel', f), { scale: 1, opacity: 1 }, { scale: 2.2, opacity: 0, duration: 0.5, repeat: 3, ease: 'power1.out' }, T + 0.2)
  traco(f, 'circulo', 'left:172px;top:4px;width:400px;height:100px;stroke-width:6', T + 0.5, 0.4); cue(T + 0.5, 'tique', 0.6)
}
cue(T6, 'bip', 0.5)

// 7. Rolou o feed? Viu seu anúncio. (19,5–23)
const S7 = el('<div class="scr"></div>', tC), O7 = el('<div class="ov"></div>', C)
titulo2(O7, ['Rolou o feed?', '<span class="s" style="font-size:.95em">Viu seu anúncio.</span>'], 370, 110)
const VESTIDO = (w = 200) => `<svg viewBox="0 0 100 100" width="${w}" height="${w}"><path d="M50 12v8M38 26c0-7 24-7 24 0l-12 8zM30 34l20 -6 20 6-4 20 12 34H22l12-34z" fill="none" stroke="#0b0b0b" stroke-width="3.5" stroke-linejoin="round"/></svg>`
const post = () => `<div style="position:absolute;left:0;top:0;right:0;height:90px;display:flex;align-items:center;gap:20px;padding-left:24px"><span style="width:70px;height:70px;border-radius:50%;background:#e6e4de;border:3px solid #d62976;display:grid;place-items:center;font:900 30px var(--sans)">SE</span><div><b style="display:block;font:800 44px/1 var(--sans)">suaempresa</b><b style="font:800 44px/1.1 var(--sans)">Patrocinado</b></div></div>
  <div style="position:absolute;left:0;right:0;top:100px;height:430px;background:#e6e4de;display:flex;align-items:center;justify-content:center;gap:30px">${VESTIDO(300)}<span style="font:400 96px/1 var(--serif);font-style:italic">Novidade</span></div>
  <div class="cta" style="position:absolute;left:24px;right:24px;top:550px;height:90px;border-radius:20px;background:#0866ff;color:#fff;display:flex;align-items:center;justify-content:center;font:800 44px var(--sans);overflow:hidden">Enviar mensagem ›<i class="onda" style="position:absolute;left:560px;top:20px;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.45)"></i></div>
  <div style="position:absolute;left:24px;top:660px;display:flex;gap:26px">${['M12 21s-7-4.6-9.5-9C.7 8.5 2.8 4.5 6.5 4.5c2 0 3.6 1.1 5.5 3 1.9-1.9 3.5-3 5.5-3 3.7 0 5.8 4 4 7.5C19 16.4 12 21 12 21z', 'M4 5h16v11H9l-5 4z', 'M3 11l18-8-6 18-3-7z'].map(d => `<svg viewBox="0 0 24 24" width="52" height="52"><path d="${d}" fill="none" stroke="#0b0b0b" stroke-width="2" stroke-linejoin="round"/></svg>`).join('')}</div>`
{
  const T = T7
  const rolo = el('<div style="position:absolute;inset:0"></div>', S7)
  // por baixo: o perfil vivo; por cima: o perfil apagado da cena 3, que vira no bip
  const vivoTopo = el(`<div style="position:absolute;left:0;right:0;top:0;height:270px"><span class="logo-ic cheio" style="position:absolute;left:60px;top:18px;width:44px;height:44px;border-radius:12px;box-shadow:none">${LOGOS.instagram}</span><div class="ig-av" style="left:60px;top:68px;background:conic-gradient(#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)"><span style="width:132px;height:132px;border-radius:50%;background:#e6e4de;border:5px solid #fff;display:grid;place-items:center;font:900 56px var(--sans)">SE</span></div>
    <div class="ig-nome" style="left:238px;top:92px">suaempresa</div><div style="position:absolute;left:238px;top:160px;padding:14px 40px;border-radius:14px;background:#0095f6;color:#fff;font:800 40px/1 var(--sans)">Seguir</div></div>`, rolo)
  const DES = [
    VESTIDO(),
    '<div style="width:100%;height:100%;background:#1b1b1b;display:grid;place-items:center;position:relative"><svg viewBox="0 0 24 24" width="90" height="90"><path d="M8 5l12 7-12 7z" fill="#fff"/></svg><i class="rec" style="position:absolute;left:18px;top:18px;width:24px;height:24px;border-radius:50%;background:#e33"></i></div>',
    '<b style="font:900 52px/1 var(--sans);font-stretch:70%;letter-spacing:.02em">NOVIDADE</b>',
    '<span class="est" style="font-size:44px">★★★★★</span>',
    '<svg viewBox="0 0 100 100" width="200" height="200"><rect x="16" y="40" width="68" height="46" fill="none" stroke="#0b0b0b" stroke-width="3.5"/><path d="M12 40l8-16h60l8 16z" fill="#fff" stroke="#0b0b0b" stroke-width="3.5"/><path d="M28 24l-4 16M44 24l-2 16M60 24l2 16M76 24l4 16" stroke="#0b0b0b" stroke-width="7"/><rect x="42" y="58" width="16" height="28" fill="#0b0b0b"/></svg>',
    '<span style="font:400 64px/1 var(--serif);font-style:italic">sábado</span>',
  ]
  const vivos = DES.map((d, i) => el(`<div class="ig-g" style="left:${60 + (i % 3) * 258}px;top:${278 + Math.floor(i / 3) * 258}px;background:${i === 1 ? '#1b1b1b' : '#f3f2ee'};display:grid;place-items:center">${d}</div>`, rolo))
  const morto = el('<div style="position:absolute;inset:0"></div>', rolo)
  const pm = perfilMorto(morto)
  // o post patrocinado vem logo abaixo do perfil (sobe quando o feed rola)
  const pTela = el(`<div style="position:absolute;left:60px;top:778px;width:776px;height:720px">${post()}</div>`, rolo)
  // a pincelada varre a teia, o véu sai, os blocos viram e a tinta volta
  vai(pm.w, { clipPath: 'inset(0 0% 0 0)' }, { clipPath: 'inset(0 0% 0 100%)', duration: 0.3, ease: 'power2.inOut' }, T); cue(T + 0.05, 'whoosh_desce', 0.3)
  vai([pm.cab, pm.veu], { opacity: 1 }, { opacity: 0, duration: 0.2 }, T + 0.05)
  pm.blocos.forEach((m, i) => vai(m, { scaleX: 1 }, { scaleX: 0, duration: 0.15, ease: 'power2.in' }, T + 0.1 + i * 0.06))
  vivos.forEach((v, i) => vai(v, { scaleX: 0 }, { scaleX: 1, duration: 0.15, ease: 'power2.out' }, T + 0.25 + i * 0.06))
  cue(T + 0.15, 'pop', 0.6)
  const fl = el('<i style="position:absolute;inset:0;background:#fff"></i>', vivos[1])
  gsap.set(fl, { opacity: 0 }); vai(fl, { opacity: 0.9 }, { opacity: 0, duration: 0.25 }, T + 0.45); cue(T + 0.45, 'camera', 0.6)
  vai($('.rec', vivos[1]), { opacity: 1 }, { opacity: 0.2, duration: 0.25, yoyo: true, repeat: 5, ease: 'steps(1)' }, T + 0.5)
  // rolou o feed; o post descola como ficha
  vai(rolo, { y: 0 }, { y: -700, duration: 0.45, ease: 'power3.inOut' }, T + 1.0); cue(T + 1.0, 'whoosh', 0.3)
  const f = el(`<div class="ficha" style="left:152px;top:700px;width:776px;height:720px;overflow:hidden;border-radius:18px">${post()}</div>`, O7)
  gsap.set(f, { opacity: 0 })
  TL.set(f, { opacity: 1 }, T + 1.45); TL.set(pTela, { opacity: 0 }, T + 1.45)
  vai(f, { x: 0, rotate: 0, scale: 1, boxShadow: '0px 0px 0 #0b0b0b' }, { x: -30, rotate: 2, scale: 1.03, boxShadow: '14px 14px 0 #0b0b0b', duration: 0.3, ease: 'back.out(1.6)' }, T + 1.45); cue(T + 1.45, 'pop', 0.5)
  const cora = el('<svg viewBox="0 0 24 24" width="220" height="220" style="position:absolute;left:278px;top:205px"><path d="M12 21s-7-4.6-9.5-9C.7 8.5 2.8 4.5 6.5 4.5c2 0 3.6 1.1 5.5 3 1.9-1.9 3.5-3 5.5-3 3.7 0 5.8 4 4 7.5C19 16.4 12 21 12 21z" fill="#ff3040"/></svg>', f)
  gsap.set(cora, { scale: 0, transformOrigin: '50% 50%' })
  vai(cora, { scale: 0 }, { scale: 1.3, duration: 0.15, ease: 'power2.out' }, T + 2.0)
  vai(cora, { scale: 1.3 }, { scale: 1, duration: 0.15 }, T + 2.15)
  vai(cora, { opacity: 1 }, { opacity: 0, duration: 0.25 }, T + 2.5)
  cue(T + 2.0, 'pop', 0.8)
  const cta = $('.cta', f)
  gsap.set($('.onda', cta), { scale: 0, opacity: 0 })
  vai(cta, { scale: 1 }, { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1 }, T + 2.6)
  vai($('.onda', cta), { scale: 0, opacity: 1 }, { scale: 6, opacity: 0, duration: 0.3, ease: 'power2.out' }, T + 2.6); cue(T + 2.6, 'tique', 0.8)
}
gsap.set([S7, O7], { x: 1080 })
trocaApp([S6, O6], [S7, O7], T7 - 0.3)
cue(T7, 'bip', 0.5)

// 8. Chamou? Resposta na hora. (23–26,5)
const S8 = el('<div class="scr"></div>', tC), O8 = el('<div class="ov"></div>', C)
titulo2(O8, ['Chamou?', '<span class="s" style="font-size:.95em">Resposta na hora.</span>'], 370, 110)
{
  const T = T8
  el('<div class="wa-fundo"></div>', S8)
  const topoM = el(`<div class="wa-topo morto"><span class="wa-av" style="border:4px dashed #c9c6bf"></span><div><b>Sua Empresa</b><small>visto por último há 2 dias</small></div><span class="logo-ic cinza">${LOGOS.whatsapp}</span></div>`, S8)
  const topoV = el(`<div class="wa-topo"><span class="wa-av" style="background:#e6e4de">SE</span><div><b>Sua Empresa</b><small style="color:#1d9d51">online</small></div><span class="logo-ic">${LOGOS.whatsapp}</span></div>`, S8)
  vai(topoV, { opacity: 0 }, { opacity: 1, duration: 0.3 }, T)
  TL.set(topoM, { opacity: 0 }, T + 0.3)
  el('<div class="wb" style="left:40px;top:208px;font-size:44px">Vim pelo anúncio. Tem no M?<small>23:47</small></div>', S8)
  const dig = el('<div class="wb eu" style="right:40px;top:338px;display:flex;gap:10px;padding:26px 30px">' + '<i style="width:18px;height:18px;border-radius:50%;background:#55524d;display:block"></i>'.repeat(3) + '</div>', S8)
  gsap.set(dig, { opacity: 0 }); TL.set(dig, { opacity: 1 }, T + 0.1); TL.set(dig, { opacity: 0 }, T + 0.35)
  $$('i', dig).forEach((b, i) => vai(b, { y: 0 }, { y: -10, duration: 0.06, yoyo: true, repeat: 1 }, T + 0.1 + i * 0.05))
  cue(T + 0.1, 'digita', 0.5)
  const f = el(`<div class="ficha" style="left:330px;top:960px;padding:18px 24px 12px;background:#d9fdd3;font:500 44px/1.2 var(--sans);white-space:nowrap"><span style="display:inline-block;width:40px;height:40px;vertical-align:-6px;margin-right:10px">${icone.ia}</span>Tem sim! Separo pra você?<small style="display:block;text-align:right;font:500 32px/1 var(--sans);color:#556;margin-top:4px">23:47</small></div>`, O8)
  pousa(f, T + 0.35, { rot: -2, dx: 0, dur: 0.2 }); cue(T + 0.35, 'ding', 0.8)
  const m = el('<div class="mao" style="left:470px;top:1240px;font-size:84px;rotate:-6deg">23:47!</div>', O8)
  escreve(m, T + 0.8, 0.35); cue(T + 0.8, 'tique', 0.6)
  risca(O8, 'M720 1250 C 790 1220, 850 1170, 862 1100 M 842 1122 L 862 1096 L 884 1122', T + 0.9, 0.3, { larg: 6 })
  const b3 = el('<div class="wb" style="left:40px;top:488px;font-size:44px">Separa!<small>23:48</small></div>', S8)
  vai(b3, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: 'back.out(1.8)' }, T + 1.2); cue(T + 1.2, 'pop', 0.7)
  vai(celC.c, { y: 0 }, { y: -12, duration: 0.1, yoyo: true, repeat: 1 }, T + 1.3); cue(T + 1.3, 'caixa', 0.7)
}
gsap.set([S8, O8], { x: 1080 })
trocaApp([S7, O7], [S8, O8], T8 - 0.3)
cue(T8, 'bip', 0.5)

// 9. Perguntou pra IA? Aparece você. (26,5–29,5): entre as opções, sem recomendação única
const S9 = el('<div class="scr"></div>', tC), O9 = el('<div class="ov"></div>', C)
titulo2(O9, ['Perguntou pra IA?', '<span class="s" style="font-size:1.16em">Aparece você.</span>'], 370, 100)
{
  const T = T9
  const ic = el(`<span class="logo-ic" style="position:absolute;left:60px;top:68px;width:72px;height:72px;border-radius:20px;box-shadow:none">${icone.ia}</span>`, S9)
  el('<b style="position:absolute;left:152px;top:84px;font:800 46px var(--sans)">Assistente de IA</b>', S9)
  vai(ic, { scale: 0.8 }, { scale: 1, duration: 0.3, ease: 'back.out(2)' }, T)
  el('<div style="position:absolute;right:60px;top:178px;padding:18px 28px;border-radius:28px;background:#e6e4de;font:500 44px/1.2 var(--sans);text-align:right">Onde comprar roupa<br>em Barreiras?</div>', S9)
  const resp = el('<div style="position:absolute;left:60px;top:348px;font:500 48px/1.2 var(--sans)"><span>Algumas</span> <span>opções</span> <span>em</span> <span>Barreiras:</span></div>', S9)
  gsap.set($$(':scope > span', resp), { display: 'inline-block' })
  $$(':scope > span', resp).forEach((w, i) => vai(w, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.08 }, T + 0.1 + i * 0.075))
  cue(T + 0.1, 'digita', 0.5)
  const c1 = el(`<div style="position:absolute;left:60px;top:438px;width:776px;height:110px;border:3px solid #0b0b0b;border-radius:24px;display:flex;align-items:center;gap:22px;padding:0 26px;background:#fff">${logo('googlemaps')}<b style="font:800 46px var(--sans)">Concorrente</b><span class="est" style="font-size:40px">★★★★☆</span></div>`, S9)
  gsap.set($('.logo-ic', c1), { width: 56, height: 56, boxShadow: 'none' })
  vai(c1, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'back.out(1.8)' }, T + 0.2); cue(T + 0.2, 'pop', 0.4)
  const f = el(`<div class="ficha" style="left:112px;top:1195px;width:776px;height:140px;display:flex;align-items:center;gap:22px;padding:0 26px">${logo('googlemaps')}<div><b class="se" style="display:block;font:800 46px/1.1 var(--sans)">Sua Empresa</b><span style="font:500 40px var(--sans);color:#4d5156"><span class="est">★★★★★</span> · aberto agora</span></div></div>`, O9)
  gsap.set($('.logo-ic', f), { width: 56, height: 56, boxShadow: 'none', flex: 'none' })
  pousa(f, T + 0.3, { rot: 2 }); cue(T + 0.3, 'ding', 0.6)
  traco(f, 'circulo', 'left:74px;top:2px;width:350px;height:84px;stroke-width:6', T + 0.8, 0.4); cue(T + 0.8, 'tique', 0.6)
}
gsap.set([S9, O9], { x: 1080 })
trocaApp([S8, O8], [S9, O9], T9 - 0.3)
cue(T9, 'bip', 0.5)

// ════ 10. SÓ O QUE A SUA EMPRESA PRECISA (29,5–33,5): a roda do site para no plano ════
const D = cena('papel2 grao', T10, T11, { eixo: 'y' })
recua(C, T10)
{
  const T = T10
  titulo2(D, ['Só o que a *sua*', 'empresa precisa.'], 370, 110)
  const IC = {
    site: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" fill="#fff" stroke="#0b0b0b" stroke-width="2"/><path d="M2 9h20" stroke="#0b0b0b" stroke-width="2"/></svg>',
    marca: '<svg viewBox="0 0 24 24"><text x="2" y="17.5" font-family="Georgia,serif" font-style="italic" font-size="15" fill="#0b0b0b">Aa</text></svg>',
    rec: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2" fill="#0b0b0b"/><path d="M16 10.5l6-3.2v9.4l-6-3.2z" fill="#0b0b0b"/><circle cx="6" cy="10" r="1.8" fill="#e33"/></svg>',
    lupa: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#0b0b0b" stroke-width="2.6"/><path d="M15.5 15.5L21 21" stroke="#0b0b0b" stroke-width="2.6" stroke-linecap="round"/></svg>',
  }
  // pilha 'sob medida' (por trás do ingresso da frente): abas com logo + nome
  const aba2 = el(`<div class="aba" style="top:625px;rotate:1.5deg">${logo('whatsapp')}<b>IA no WhatsApp</b></div>`, D)
  const aba1 = el(`<div class="aba" style="top:735px;rotate:-1.5deg">${logo('googlemaps')}<b>SEO Local</b></div>`, D)
  gsap.set([aba1, aba2], { opacity: 0 })
  const ARTE = {
    grade: '<div style="display:flex;gap:10px">' + '<span style="flex:1;height:130px;border-radius:12px;background:#e6e4de;border:3px solid #0b0b0b"></span>'.repeat(3) + '</div>',
    anuncio: '<div style="border:3px solid #0b0b0b;border-radius:16px;overflow:hidden"><div style="height:90px;background:#e6e4de"></div><div style="height:56px;background:#0866ff;color:#fff;font:800 30px/56px var(--sans);text-align:center">Enviar mensagem ›</div></div>',
  }
  const r = roda(D, [
    { tag: 'conteúdo', titulo: 'Social Media', texto: 'Post, vídeo e perfil no ritmo certo.', logos: ['instagram', 'facebook', 'tiktok'], arte: ARTE.grade },
    { tag: 'marca', titulo: 'Branding', texto: 'Uma cara própria, do logo à fachada.', logos: [] },
    { tag: 'vídeo', titulo: 'Audiovisual', texto: 'Vídeo que prende e vende.', logos: ['youtube'] },
    { tag: 'site', titulo: 'Sites', texto: 'Site rápido que vira contato.', logos: [] },
    { tag: 'IA', titulo: 'Busca por IA', texto: 'Pronta pra aparecer nas respostas.', logos: [] },
    { tag: 'Google', titulo: 'SEO Local', texto: 'Perfil da Empresa e busca local.', logos: ['google', 'googlemaps'] },
    { tag: 'atendimento', titulo: 'IA no WhatsApp', texto: 'Responde na hora, até de madrugada.', logos: ['whatsapp'] },
    { tag: 'anúncios', titulo: 'Tráfego Pago', texto: '', logos: ['meta', 'googleads', 'tiktok'], arte: ARTE.anuncio },
  ], { cx: 540, cy: 1050, raio: 1500, passo: 30 })
  // ícones próprios nos ingressos sem logo de plataforma
  ;[[1, IC.marca], [3, IC.site], [4, icone.ia + '|' + IC.lupa], [6, 'ia']].forEach(([i, ic]) => {
    const box = $('.ing__logos', r.ings[i]) || el('<div class="ing__logos"></div>', r.ings[i])
    if (ic === 'ia') { box.insertAdjacentHTML('beforeend', `<span class="logo-ic">${icone.ia}</span>`); return }
    ic.split('|').forEach(s => box.insertAdjacentHTML('beforeend', `<span class="logo-ic">${s}</span>`))
  })
  $('p', r.ings[7]).outerHTML = '<p style="font:700 44px/1.1 var(--sans);font-stretch:72%;color:var(--black)">gestor com case de sucesso</p>'
  r.gira(7, T + 0.1, 0.8)
  for (let k = 0; k < 7; k++) cue(T + 0.15 + k * 0.1, 'tique', 0.4)
  cue(T + 0.9, 'pop', 0.7)
  // sob medida: os vizinhos caem, 'Tráfego Pago' desce pra frente da pilha e as abas sobem por trás
  const viz = r.ings.filter((_, i) => i !== 7)
  vai(viz, { y: 0, opacity: 1 }, { y: 500, opacity: 0, duration: 0.35, ease: 'power2.in' }, T + 0.95); cue(T + 0.95, 'whoosh_desce', 0.4)
  vai(r.ings[7], { y: 0 }, { y: 205, duration: 0.35, ease: 'power3.inOut' }, T + 0.95)
  ;[[aba1, 1.05], [aba2, 1.15]].forEach(([a, d]) => { vai(a, { y: 110, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.8)' }, T + d); cue(T + d, 'pop', 0.5) })
}

// ════ 11. PACOTE PRONTO? × O SEU CASE (33,5–40,5) ══════════════════════════
const E = cena('papel grao', T11, T12)
recua(D, T11, 'x')
{
  const T = T11
  const velho = el('<div style="position:absolute;inset:0"></div>', E)
  el('<div class="ti" style="top:370px;font-size:100px">Pacote pronto?</div>', velho)
  traco(velho, 'risco', 'left:70px;top:398px;width:700px;height:60px;stroke-width:9', T + 1.2, 0.25); cue(T + 1.2, 'erro', 0.5)
  const cxs = ['lojinha', 'clínica', 'revenda<br>do agro'].map((n, i) => el(`<div class="cxp" style="left:${90 + i * 295}px;top:680px"><div class="fx">PACOTE<br>PRONTO</div><div class="mao"${i === 2 ? ' style="font-size:56px"' : ''}>${n}</div></div>`, velho))
  const st = el('<div class="carimbo" style="left:118px;top:998px;font-size:96px;border-width:8px">IGUAL PRA TODOS</div>', velho)
  carimba(st, T + 0.1, -7)
  vai(cxs, { scaleY: 1 }, { scaleY: 0.95, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: '50% 100%' }, T + 0.2)
  tremeX(E, T + 0.2, 6, 0.2)
  // push interno: o estado B chega montado
  const novo = el('<div style="position:absolute;inset:0"></div>', E)
  gsap.set(novo, { y: 1920 })
  vai(velho, { y: 0 }, { y: -1920, duration: 0.35, ease: 'power3.inOut' }, T + 2.15)
  vai(novo, { y: 1920 }, { y: 0, duration: 0.35, ease: 'power3.inOut' }, T + 2.15); cue(T + 2.15, 'whoosh', 0.6)
  const b = titulo2(novo, ['Aqui a meta é', 'o <span class="s seu" style="position:relative">seu</span> case', 'de sucesso.'], 370, 100)
  traco($('.seu', b.t), 'sublinha', 'left:0;top:92%;width:100%;height:24px;stroke-width:7', T + 2.6, 0.25)
  ;[['1.', 'A gente escuta.'], ['2.', 'Raio-x.'], ['3.', 'Mão na massa.'], ['4.', 'Número na mesa.']].forEach(([n, txt], i) => {
    const p = el(`<div class="mpc${i % 2 ? ' escuro' : ''}" style="top:${680 + i * 150}px;rotate:${i % 2 ? 1 : -1}deg"><span class="n">${n}</span><b>${txt}</b></div>`, novo)
    vai($('.n', p), { scale: 1.15 }, { scale: 1, duration: 0.2, ease: 'back.out(2)' }, T + 2.6 + i * 0.15)
    cue(T + 2.6 + i * 0.15, 'pop', 0.5)
  })
  const m = el('<div class="mao" style="left:110px;top:1285px;font-size:56px;rotate:-2deg">o que não funciona, a gente troca</div>', novo)
  escreve(m, T + 3.1, 0.4); cue(T + 3.1, 'tique', 0.5)
  vai(novo, { scale: 1 }, { scale: 1.02, duration: 3.2, ease: 'none', transformOrigin: '50% 50%' }, T + 3.5)
  cue(T + 6.0, 'riser', 0.8)
}

// ════ 12. DESDE 2016, PRA TODO O OESTE (40,5–45) ═══════════════════════════
const F = cena('preta grao', T12, T13, { eixo: 'y' })
recua(E, T12)
{
  const T = T12
  cue(T, 'impacto', 0.9)
  titulo2(F, ['Desde 2016,', '<span class="s" style="font-size:1.15em">pra todo o Oeste.</span>'], 350, 100, 'var(--paper)')
  const { m, pinos } = mapaOeste(F, 'left:78px;top:600px;width:925px;height:740px')
  const svg = $('svg', m)
  // rótulos do site legíveis no celular e dentro da zona segura
  const lem = $('text', pinos['luis-eduardo-magalhaes'])
  lem.setAttribute('x', 170); lem.setAttribute('y', 200); lem.innerHTML = '<tspan x="170">Luís Eduardo</tspan><tspan x="170" dy="36">Magalhães</tspan>'
  const smv = $('text', pinos['santa-maria-da-vitoria']); smv.setAttribute('x', 476); smv.setAttribute('y', 596); smv.setAttribute('text-anchor', 'end')
  const bjl = $('text', pinos['bom-jesus-da-lapa']); bjl.setAttribute('x', 737); bjl.setAttribute('y', 454.5); bjl.setAttribute('text-anchor', 'end')
  const hand = $('.hand-t', svg); hand.setAttribute('x', 285)
  const B0 = [309, 301.6 - 45]
  const ORDEM = ['sao-desiderio', 'riachao-das-neves', 'luis-eduardo-magalhaes', 'formosa-do-rio-preto', 'correntina', 'santa-maria-da-vitoria', 'bom-jesus-da-lapa']
  let defs = '', rotas = ''
  ORDEM.forEach((slug, i) => {
    const [x, y] = pinos[slug].dataset.xy.split(',').map(Number), ty = y - 45
    const mx = (B0[0] + x) / 2 + (ty - B0[1]) * 0.18, my = (B0[1] + ty) / 2 - (x - B0[0]) * 0.18
    const d = `M${B0[0]} ${B0[1]} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x} ${ty}`
    defs += `<mask id="mr${i}" maskUnits="userSpaceOnUse" x="0" y="0" width="800" height="640"><path class="mrp" d="${d}" fill="none" stroke="#fff" stroke-width="10"/></mask>`
    rotas += `<path d="${d}" fill="none" stroke="#f3f2ee" stroke-width="3.5" stroke-dasharray="7 9" stroke-linecap="round" mask="url(#mr${i})" opacity=".85"/>`
  })
  svg.insertAdjacentHTML('afterbegin', `<defs>${defs}</defs>`)
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.innerHTML = rotas
  svg.insertBefore(g, $('a[data-city]', svg))
  $$('.mrp', svg).forEach((p, i) => {
    const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: `${L} ${L + 20}`, strokeDashoffset: L + 10 })
    const tt = T + 0.2 + i * 0.1
    vai(p, { strokeDashoffset: L + 10 }, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.inOut' }, tt)
    vai(pinos[ORDEM[i]], { opacity: 0.35 }, { opacity: 1, duration: 0.1 }, tt + 0.3)
    vai($('.pin', pinos[ORDEM[i]]), { scale: 1.4 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, tt + 0.3)
    cue(tt, 'tique', 0.5)
  })
  vai($('.pulse', svg), { scale: 1, opacity: 0.9 }, { scale: 2.4, opacity: 0, duration: 0.5, repeat: 8, ease: 'power1.out', transformOrigin: '50% 50%' }, T)
  gsap.set(hand, { opacity: 0 })
  vai(hand, { opacity: 0 }, { opacity: 1, duration: 0.3 }, T + 1.5); cue(T + 1.5, 'tique', 0.5)
  risca(F, 'M412 1004 C 432 980, 438 960, 432 934 M 418 950 L 432 930 L 448 950', T + 1.6, 0.3, { larg: 5, cor: 'var(--paper)' })
  // a busca do manifesto do site, fora do mapa
  const bm = el(`<div class="busca-m" style="top:1360px">${icone.lupa.replace(/#5f6368/g, '#8f8b84')}loja de roupa LEM<span class="mao">sua empresa aparece?</span></div>`, F)
  vai(bm, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, T + 1.1); cue(T + 1.1, 'pop', 0.6); cue(T + 1.12, 'ding', 0.25)
  escreve($('.mao', bm), T + 1.3, 0.35); cue(T + 1.3, 'tique', 0.4)
}

// ════ 13. ISSO É EMPRESA VIVA (45–49,5) ════════════════════════════════════
const Gc = cena('preta grao', T13, T14, { eixo: 'y' })
recua(F, T13)
{
  const T = T13
  titulo2(Gc, ['Isso é empresa', '<span class="s" style="font-size:1.27em">viva.</span>'], 350, 110, 'var(--paper)')
  const m = el('<div class="mao" style="left:420px;top:490px;font-size:60px;rotate:-4deg;color:var(--paper)">cliente, não curtida</div>', Gc)
  escreve(m, T + 1.3, 0.4); cue(T + 1.3, 'tique', 0.4)
  const { c: cel, tela } = celularG(Gc, { top: 610, escuro: true })
  cel.style.boxShadow = '26px 30px 0 rgba(243,242,238,.06), inset 0 0 0 3px #2a2a2a'
  el('<div style="position:absolute;left:0;right:0;top:640px;text-align:center;font:900 420px/1 var(--sans);font-stretch:70%;color:rgba(255,255,255,.06);letter-spacing:-.02em">VIVA!</div>', tela)
  el('<div class="lock-d" style="top:88px">terça-feira · Barreiras</div>', tela)
  el('<div class="lock-h" style="top:138px">08:12</div>', tela)
  const NS = [
    { logo: 'whatsapp', titulo: 'Cliente novo', texto: 'Oi! Vim pelo anúncio, queria um orçamento' },
    { logo: 'google', titulo: 'Perfil da Empresa', texto: 'Alguém ligou pra você pelo Google Maps.' },
    { logo: 'whatsapp', titulo: 'Nova mensagem', texto: 'Vocês entregam em Luís Eduardo?' },
  ]
  // pilha com a mais nova em cima: no fim n3 900–1076, n2 1090–1266, n1 1280–1456
  const H = [176, 176, 176], GAP = 14, Y0 = 900 - 632
  const cards = NS.map(n => { const k = notifGrande(tela, n, `left:18px;top:${Y0}px;opacity:0`); k.classList.add('n3'); return k })
  cards.forEach((k, i) => {
    const tt = T + [0.05, 0.4, 0.8][i]
    vai(k, { y: -60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)' }, tt)
    for (let j = 0; j < i; j++) {
      const pos = n => cards.slice(j + 1, n + 1).reduce((s, _, q) => s + H[j + 1 + q] + GAP, 0)
      vai(cards[j], { y: pos(i - 1) }, { y: pos(i), duration: 0.35, ease: 'power3.out' }, tt)
    }
    tremeX(cel, tt, 6, 0.25)
    cue(tt, 'vibra', 0.9); cue(tt + 0.05, 'ding', 0.8)
  })
  const v = $('.s', Gc)
  ;[46.5, 47, 47.5, 48, 48.5, 49].forEach(b => pulsa(v, b, 1.04))
}

// ════ 14. CHAMADA E LOOP (49,5–54,5): o quadro 0 com ponto final ════════════
const Hc = cena('papel grao', T14, DUR, { eixo: 'y' })
recua(Gc, T14)
{
  const T = T14
  cue(T, 'bip', 0.5)
  const a = titulo2(Hc, ['Sua empresa', '<span class="s" style="margin:0 .2em 0 .1em">viva</span> no celular', 'de quem compra.'], 420, 120)
  circuloCauda(Hc, { x: 50, y: 520, w: 280, h: 145, base: 820, t: T + 0.2, dur: 0.5 }); cue(T + 0.2, 'tique', 0.6)
  const pm = el('<div class="mao" style="left:400px;top:338px;font-size:56px;rotate:-3deg">pequena, média ou grande</div>', Hc)
  escreve(pm, T + 0.2, 0.4)
  risca(Hc, 'M470 400 C 452 410, 440 420, 432 436', T + 0.5, 0.15, { larg: 5 })
  // pulso: 120 BPM e desacelera pra 72 no fim, com o trilho na mesma fase do quadro 0 (loop)
  const BAT = [47, 47.5, 48, 48.5, 49, 49.5, 50, 50.5, 51, 51.5, 52, 52.83, 53.67]
  ecgT(Hc, 'left:80px;top:765px;color:var(--black)', { w: 920, batidas: BAT, t0: T - 0.3, t1: DUR })
  BAT.filter(b => b >= T).forEach(b => pulsa($('.s', a.t), b))
  cue(53.67, 'coracao', 0.9)
  const TXT = VAR === 'anuncio' ? ['Toca em Enviar mensagem', 'o botão aqui embaixo ↓', 50] : VAR === 'direct' ? ['Manda VIVA no direct', 'a gente responde ↓', 56] : ['Chama no WhatsApp', 'link na bio ↓', 58]
  const btn = el(`<div class="botao" style="left:150px;top:880px;width:780px;height:180px;padding:0 40px;border-radius:90px;flex-direction:column;gap:8px"><div style="display:flex;align-items:center;gap:20px;font-size:${TXT[2]}px">${VAR === 'direct' ? '' : LOGOS.whatsapp.replace('fill="#25d366"', 'fill="currentColor"').replace('<svg', '<svg width="64" height="64"')}${TXT[0]}</div><div style="font:600 40px/1 var(--sans);color:#c9c6bf">${TXT[1]}</div><i class="brilho" style="position:absolute;top:0;bottom:0;width:120px;left:-160px;background:linear-gradient(100deg,transparent,rgba(255,255,255,.35),transparent)"></i></div>`, Hc)
  btn.style.overflow = 'hidden'
  vai(btn, { scale: 1 }, { scale: 1.04, duration: 0.15, yoyo: true, repeat: 1 }, T + 0.9); cue(T + 0.9, 'pop', 0.5)
  vai($('.brilho', btn), { x: 0 }, { x: 1100, duration: 0.5, ease: 'power2.inOut' }, T + 0.9)
  const n = el('<div class="mao" style="left:110px;top:1100px;font-size:56px;line-height:1.05;rotate:-3deg">conta o que vende.<br>a gente diz por onde<br>começar.</div>', Hc)
  escreve(n, T + 0.4, 0.4); cue(T + 0.4, 'tique', 0.4)
  // orgânico: seta pro nome do perfil (embaixo à esquerda); anúncio: seta descendo até o botão nativo 'Enviar mensagem'
  if (VAR === 'anuncio') risca(Hc, 'M522 1075 C 532 1180, 512 1320, 522 1440 M 500 1410 L 522 1446 L 544 1414', T + 1.3, 0.4, { larg: 7 })
  else risca(Hc, 'M170 1300 C 150 1350, 128 1400, 112 1450 M 96 1420 L 110 1454 L 140 1432', T + 1.3, 0.4, { larg: 7 })
  cue(T + 1.3, 'tique', 0.3)
  // selo do site: anel 'FEITO NO OESTE DA BAHIA ·' girando e o centro parado com o logo e DESDE 2016
  const s = el(`<div class="selog" style="left:550px;top:1085px;width:380px;height:380px"><svg viewBox="0 0 120 120"><defs><path id="anelv" d="M60 60m-47 0a47 47 0 1 1 94 0a47 47 0 1 1-94 0"/></defs>
    <circle cx="60" cy="60" r="58" fill="#0b0b0b" stroke="#f3f2ee" stroke-width="1.5"/><circle cx="60" cy="60" r="37" fill="none" stroke="#f3f2ee" stroke-width=".8" stroke-dasharray="1.5 2.5"/>
    <g class="anel"><text style="font:800 13px Archivo;letter-spacing:.06em"><textPath href="#anelv" textLength="290" lengthAdjust="spacingAndGlyphs">FEITO NO OESTE DA BAHIA ·</textPath></text></g>
    <image href="${LOGO_VIVA}" x="36.3" y="36" width="47.4" height="22"/>
    <text x="60" y="76" text-anchor="middle" style="font:900 13.9px Archivo;font-stretch:72%;letter-spacing:.02em">DESDE 2016</text></svg></div>`, Hc)
  const anel = $('.anel', s); gsap.set(anel, { transformOrigin: '60px 60px' })
  carimba(s, T + 1.6, -6)
  vai(anel, { rotate: 0 }, { rotate: 40, duration: 5, ease: 'none' }, T)
  cue(53.0, 'impacto', 0.5)
}

pronto(DUR, { bpm: 120, drop: T5, pre: 'pad', calmo: [[T11, 39.5], [T13, T14]], fim: 53.0, mudo: [[12.9, T5]] })
