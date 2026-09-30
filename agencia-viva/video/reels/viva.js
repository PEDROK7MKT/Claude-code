// Reels "Sua empresa tá viva?" (50 s, 120 BPM: 1 tempo = 0,5 s).
// O vídeo mede o pulso da empresa de quem assiste. O palco é um celular gigante, com a pílula da Viva sempre no topo.
// 0–13 s: a empresa sem pulso (Google, Instagram, WhatsApp), o coração desacelerando até a linha reta.
// 13 s: o bip. A Viva religa cada tela, mostra o plano sob medida, o método, o Oeste e fecha no quadro 0 com ponto final.
// Zona segura: textos em x 80–930, y 250–1460.
KIT.entrada = 'empurra'
KIT.dEntrada = 0.3
const DUR = 50

el(`<style>
.ti { position: absolute; left: 80px; right: 150px; font-weight: 900; font-stretch: 72%; line-height: .9; letter-spacing: -.02em; }
.ti .s { display: inline-block; font-family: var(--serif); font-style: italic; font-weight: 400; font-stretch: 100%; letter-spacing: -.01em; }
.pil { position: absolute; left: 80px; top: 250px; height: 84px; padding: 0 32px; border-radius: 42px; background: var(--black); color: var(--paper); display: flex; align-items: center; gap: 20px; z-index: 45; visibility: hidden; white-space: nowrap; }
.pil img { height: 36px; display: block; }
.pil i { width: 3px; height: 40px; background: #55524d; flex: none; }
.pil .rot { height: 44px; overflow: hidden; font: 800 40px/44px var(--sans); letter-spacing: .12em; }
.pil .rot span { display: block; }
.pil.inv { background: var(--paper); color: var(--black); }
.pil.inv img { filter: brightness(0); }
.pil.inv i { background: #c9c6bf; }
.pil .mecg { position: relative; width: 100px; height: 44px; overflow: hidden; color: var(--paper); }
.carimbo { position: absolute; padding: 14px 30px 10px; border: 9px solid var(--black); border-radius: 14px; font: 900 130px/.9 var(--sans); font-stretch: 70%; text-align: center; letter-spacing: .01em; color: var(--black); background: rgba(243,242,238,.5); mix-blend-mode: multiply; white-space: nowrap; }
.scr { position: absolute; inset: 0; }
.sbar { position: absolute; left: 0; right: 0; top: 0; height: 110px; z-index: 6; font: 700 34px/1 var(--sans); color: #8a8680; }
.sbar b { position: absolute; left: 90px; top: 26px; font-weight: 700; }
.sbar u { position: absolute; right: 90px; top: 28px; width: 56px; height: 28px; border: 3px solid #8a8680; border-radius: 8px; text-decoration: none; }
.gw { font: 500 90px/1 Arial, sans-serif; letter-spacing: -3px; }
.gbar { position: absolute; left: 60px; width: 776px; height: 110px; border: 3px solid #dfe1e5; border-radius: 60px; display: flex; align-items: center; gap: 22px; padding: 0 34px; font: 500 46px var(--sans); color: #202124; background: #fff; box-shadow: 0 4px 14px rgba(0,0,0,.08); }
.gbar .cur { width: 3px; height: 50px; background: #202124; }
.gres { position: absolute; left: 60px; width: 776px; height: 120px; padding: 14px 24px; border-bottom: 2px solid #ececec; }
.gres b { display: block; font: 700 46px/1.1 var(--sans); color: #1a0dab; }
.gres span { font: 500 40px/1.2 var(--sans); color: #4d5156; }
.est { color: #fbbc04; letter-spacing: 2px; }
.vaga { position: absolute; left: 60px; width: 776px; height: 160px; border: 4px dashed #c9c6bf; border-radius: 24px; display: grid; place-items: center; font: 600 50px var(--sans); color: #55524d; }
.raiox { position: absolute; left: 0; right: 0; height: 90px; background: linear-gradient(rgba(11,11,11,0), rgba(11,11,11,.14)); border-bottom: 8px solid var(--black); }
.ig-av { position: absolute; width: 150px; height: 150px; border-radius: 50%; display: grid; place-items: center; }
.ig-nome { position: absolute; font: 800 48px/1 var(--sans); }
.ig-bio { position: absolute; height: 22px; border-radius: 11px; background: #e6e4de; }
.ig-g { position: absolute; width: 252px; height: 252px; overflow: hidden; }
.ig-g.morto { background: #e6e4de; display: grid; place-items: center; }
.etq-p { position: absolute; padding: 10px 18px; border-radius: 10px; background: var(--black); color: var(--paper); font: 800 40px/1 var(--sans); white-space: nowrap; }
.wa-topo { position: absolute; left: 0; right: 0; top: 68px; height: 110px; background: #f7f7f5; display: flex; align-items: center; gap: 24px; padding-left: 70px; border-bottom: 2px solid #e2e0da; }
.wa-av { width: 90px; height: 90px; border-radius: 50%; display: grid; place-items: center; font: 900 40px var(--sans); flex: none; }
.wa-topo b { display: block; font: 800 46px/1.05 var(--sans); }
.wa-topo small { display: block; font: 500 40px/1.1 var(--sans); color: #55524d; }
.wa-fundo { position: absolute; left: 0; right: 0; top: 178px; bottom: 0; background: #efeae2; }
.wb { position: absolute; max-width: 660px; padding: 16px 24px 12px; border-radius: 24px; font: 500 46px/1.2 var(--sans); background: #fff; box-shadow: 0 2px 0 rgba(0,0,0,.08); }
.wb small { display: block; text-align: right; font: 500 30px/1 var(--sans); color: #667; margin-top: 4px; }
.wb.eu { background: #d9fdd3; }
.chip { position: absolute; left: 50%; translate: -50% 0; display: flex; align-items: center; gap: 16px; padding: 12px 26px; border-radius: 14px; background: #e6e4de; font: 800 40px/1 var(--sans); letter-spacing: .06em; white-space: nowrap; }
.ingv { position: absolute; left: 0; top: -75px; width: 700px; height: 150px; background: var(--white); border: 4px solid var(--black); border-radius: 22px; box-shadow: 12px 12px 0 var(--black); display: flex; align-items: center; color: var(--black); }
.ingv::before { content: ''; position: absolute; top: -20px; left: 36%; width: 150px; height: 40px; rotate: -3deg; background: rgba(210,206,198,.85); }
.ingv .nm { flex: 0 0 78%; padding: 0 34px; border-right: 4px dashed var(--black); height: 100%; display: flex; flex-direction: column; justify-content: center; gap: 6px; }
.ingv .nm b { font: 900 58px/1 var(--sans); font-stretch: 72%; white-space: nowrap; }
.ingv .nm small { font: 700 40px/1 var(--sans); font-stretch: 85%; color: #55524d; white-space: nowrap; }
.ingv .cn { flex: 1; display: flex; flex-wrap: wrap; justify-content: center; align-content: center; gap: 6px; padding: 0 8px; }
.ingv .logo-ic { width: 56px; height: 56px; border-radius: 14px; box-shadow: 0 0 0 2px var(--black); }
.cxp { position: absolute; width: 230px; height: 300px; background: var(--paper-2); border: 5px solid var(--black); border-radius: 12px; box-shadow: 14px 14px 0 var(--black); }
.cxp .fx { background: var(--black); color: var(--paper); font: 900 40px/1 var(--sans); font-stretch: 72%; padding: 18px 10px 14px; text-align: center; }
.cxp .mao { left: 12px; right: 12px; bottom: 34px; text-align: center; font-size: 48px; rotate: -3deg; background: var(--white); border: 3px solid var(--black); padding: 6px 4px; }
.cxp::before { content: ''; position: absolute; top: -18px; left: 50%; width: 110px; height: 34px; translate: -50% 0; rotate: 4deg; background: rgba(210,206,198,.9); }
.parada { position: absolute; left: 102px; width: 96px; height: 96px; border-radius: 50%; background: var(--black); color: var(--paper); display: grid; place-items: center; font: 900 56px/1 var(--sans); font-stretch: 72%; z-index: 2; }
.cartao { position: absolute; left: 240px; width: 680px; padding: 22px 30px; background: var(--white); border: 4px solid var(--black); border-radius: 18px; box-shadow: 10px 10px 0 var(--black); font: 900 58px/1 var(--sans); font-stretch: 74%; color: var(--black); }
.cartao small { display: block; font: 700 40px/1.1 var(--sans); font-stretch: 85%; color: #55524d; margin-top: 8px; }
.balao { position: absolute; display: flex; align-items: center; gap: 12px; padding: 16px 24px; border-radius: 99px; background: var(--paper); color: var(--black); font: 700 40px/1 var(--sans); box-shadow: 8px 8px 0 #55524d; white-space: nowrap; }
.balao::after { content: ''; position: absolute; width: 26px; height: 26px; background: var(--paper); rotate: 45deg; }
.balao.b-esq::after { left: -10px; top: 50%; margin-top: -13px; }
.balao.b-baixo::after { left: var(--tx, 60px); bottom: -11px; }
.balao.b-cima::after { left: var(--tx, 60px); top: -11px; }
.lock-h { position: absolute; left: 0; right: 0; text-align: center; font: 300 150px/1 var(--sans); color: var(--paper); letter-spacing: -.02em; }
.lock-d { position: absolute; left: 0; right: 0; text-align: center; font: 600 40px/1 var(--sans); color: #d8d6d0; }
.ng.n2 { width: 790px; grid-template-columns: 90px 1fr; gap: 4px 24px; padding: 20px 28px; border-radius: 40px; }
.ng.n2 .ng__topo b { font-size: 38px; }
.ng.n2 .logo-ic { width: 90px; height: 90px; border-radius: 24px; }
.ng.n2 .ng__txt { font-size: 40px; line-height: 1.15; }
.pb { display: inline-flex; align-items: center; gap: 10px; padding: 10px 22px; border: 3px solid #0b0b0b; border-radius: 99px; font: 700 40px/1 var(--sans); background: #fff; }
.pb .logo-ic { width: 44px; height: 44px; border-radius: 10px; box-shadow: none; }
</style>`, document.head)

// ── ajudantes ──────────────────────────────────────────────
const titulo2 = (pai, linhas, top, px, cor) => {
  const t = el(`<div class="ti" style="top:${top}px;font-size:${px}px${cor ? ';color:' + cor : ''}">${linhas.map(l => `<span class="linha"><span>${fmt(l)}</span></span>`).join('')}</div>`, pai)
  return { t, linhas: $$('.linha > span', t) }
}
const escreve = (alvo, t, dur = 0.4) => vai(alvo, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: dur, ease: 'power2.inOut' }, t)
// traço livre (path em coordenadas do quadro 1080x1920 ou de um viewBox próprio) que se desenha
function risca(pai, d, t, dur = 0.35, { vb = '0 0 1080 1920', estilo = 'left:0;top:0;width:1080px;height:1920px', larg = 8, cor = 'currentColor' } = {}) {
  const s = el(`<svg class="traco" viewBox="${vb}" style="${estilo};stroke-width:${larg};color:${cor}"><path d="${d}"/></svg>`, pai)
  const p = $('path', s), L = p.getTotalLength()
  gsap.set(p, { strokeDasharray: `${L} ${L + 40}`, strokeDashoffset: L + 20 })
  vai(p, { strokeDashoffset: L + 20 }, { strokeDashoffset: 0, duration: dur, ease: 'power2.inOut' }, t)
  return s
}
const tranco = (alvo, t, f = 6) => { for (let i = 0; i < 4; i++) TL.to(alvo, { x: (i % 2 ? -f : f) * (1 - i / 4), duration: 0.04, ease: 'none', immediateRender: false }, t + i * 0.04); TL.to(alvo, { x: 0, duration: 0.04, immediateRender: false }, t + 0.16) }
const tremeX = (alvo, t, f = 10, dur = 0.3) => { const n = 6; for (let i = 0; i < n; i++) TL.to(alvo, { x: (i % 2 ? -f : f) * (1 - i / n), rotation: (i % 2 ? -0.6 : 0.6) * (1 - i / n), duration: dur / n, ease: 'none', immediateRender: false }, t + i * dur / n); TL.to(alvo, { x: 0, rotation: 0, duration: 0.04, immediateRender: false }, t + dur) }
const pulsa = (alvo, t, s = 1.06) => vai(alvo, { scale: 1 }, { scale: s, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.out' }, t)
const cor = (alvo, t, dur = 0.3) => vai(alvo, { filter: 'grayscale(1)' }, { filter: 'grayscale(0)', duration: dur, ease: 'none' }, t)
const aparece = (alvo, t, dur = 0.3) => vai(alvo, { opacity: 0 }, { opacity: 1, duration: dur, ease: 'power2.out' }, t)
// troca de app: a tela e o título atuais saem pra esquerda, os novos entram montados da direita
function trocaApp(sai, entra, t, d = 0.3) {
  sai.forEach(e => vai(e, { x: 0 }, { x: -1080, duration: d, ease: 'power3.inOut' }, t))
  entra.forEach(e => { gsap.set(e, { x: 1080 }); vai(e, { x: 1080 }, { x: 0, duration: d, ease: 'power3.inOut' }, t) })
  cue(t, 'whoosh', 0.45)
}

// ECG no tempo: o traço corre pra esquerda e cada batida aparece na borda direita no instante do som.
function ecgT(pai, estilo, { w, batidas, t0, t1, vel = 340, larg = 5, k = 1, alto = () => 1, cls = '' }) {
  const y0 = 55 * k, tb = t0 - w / vel, X = t => (t - tb) * vel
  let d = `M0 ${y0}`
  batidas.filter(b => b > tb - 1 && b < t1 + 1).sort((a, b) => a - b).forEach((b, i) => {
    const x = X(b), a = alto(b) * k, p = dx => (x + dx * k).toFixed(1)
    d += ` L${p(-70)} ${y0} Q${p(-55)} ${y0 - 9 * a} ${p(-40)} ${y0} L${p(-14)} ${y0} L${p(-8)} ${y0 + 12 * a} L${p(0)} ${y0 - 50 * a} L${p(8)} ${y0 + 22 * a} L${p(16)} ${y0} L${p(55)} ${y0} Q${p(78)} ${y0 - 14 * a} ${p(100)} ${y0}`
  })
  d += ` L${X(t1 + 1).toFixed(1)} ${y0}`
  const W = Math.ceil(X(t1 + 1))
  const e = el(`<div class="${cls}" style="position:absolute;overflow:hidden;height:${110 * k}px;width:${w}px;${estilo}"><svg viewBox="0 0 ${W} ${110 * k}" style="position:absolute;left:0;top:0;width:${W}px;height:${110 * k}px;overflow:visible"><path d="${d}" fill="none" stroke="currentColor" stroke-width="${larg}" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`, pai)
  const tr = $('svg', e)
  vai(tr, { x: 0 }, { x: -(t1 - t0) * vel, duration: t1 - t0, ease: 'none' }, t0)
  return e
}

// ── o coração (som + ECG): 72 BPM, depois 60, depois duas batidas fracas e para ──
const BAT1 = [0, 0.83, 1.67, 2.5, 3.33, 4.17, 5.0, 5.83, 6.67, 7.5, 8.5, 9.5, 10.9, 11.9]
const FORCA = { 10.9: 0.7, 11.9: 0.4 }
BAT1.forEach(b => cue(b, 'coracao', FORCA[b] || 0.9))
const antes = n => Array.from({ length: n }, (_, i) => -(i + 1) * 0.83)

// ── pílula da marca (camada fixa): um rótulo por cena, rolando na troca ──
const PILULAS = [
  [0, 'OESTE DA BAHIA'], [4.3, 'RAIO-X · 1/3', 'ecg'], [7.1, 'RAIO-X · 2/3', 'ecg'], [9.7, 'RAIO-X · 3/3', 'ecg'],
  [16.0, 'GOOGLE E MAPS'], [18.5, 'SOCIAL + TRÁFEGO'], [21.5, 'IA NO WHATSAPP'], [24.5, 'BUSCA POR IA'],
  [27.5, 'O QUE A GENTE FAZ'], [31.5, 'COMO TRABALHAMOS'], [36.5, 'ONDE A GENTE ATUA', 'inv'], [40.5, 'O QUE MUDA', 'inv'], [45.0, 'OESTE DA BAHIA'],
]
const FIM_PIL = { 9.7: 12.65 } // some no zoom da tela apagada e volta com o Google vivo
PILULAS.forEach(([t, rot, extra], i) => {
  const p = el(`<div class="pil${extra === 'inv' ? ' inv' : ''}"><img src="${LOGO_VIVA}" alt="Agência Viva"><i></i><div class="rot"><span>${rot}</span></div></div>`)
  if (extra === 'ecg') ecgT(p, 'position:relative;flex:none', { w: 100, batidas: BAT1, t0: 4.3, t1: 13, vel: 90, larg: 4, k: 0.4, alto: b => FORCA[b] || 1 })
  const t0 = t > 0 ? t - 0.2 : 0, prox = PILULAS[i + 1] ? PILULAS[i + 1][0] - 0.2 : DUR + 1
  if (t <= 0) gsap.set(p, { visibility: 'visible' }); else TL.set(p, { visibility: 'visible' }, t0)
  TL.set(p, { visibility: 'hidden' }, FIM_PIL[t] ?? prox)
  if (t > 0) vai($('.rot span', p), { yPercent: 100 }, { yPercent: 0, duration: 0.25, ease: 'power3.out' }, t0)
})

// ── ÁTO 1 (0–13): a empresa sem pulso, no mesmo celular ──────────────
const A = cena('papel grao', 0, 13)
const celA = celularG(A, { top: 900 })
const tA = celA.tela
// quadro 0: a frase-mãe do site virada em pergunta, com o círculo já desenhado
const t1 = titulo2(A, ['Sua empresa tá', '<span class="s" style="margin:0 .2em 0 .1em">viva</span> no celular', 'de quem compra?'], 420, 120)
const circ1 = el(`<svg class="traco" viewBox="${TRACOS.circulo[0]}" preserveAspectRatio="none" style="left:50px;top:520px;width:280px;height:145px;stroke-width:8"><path d="${TRACOS.circulo[1]}"/></svg>`, A)
const ecg1 = ecgT(A, 'left:80px;top:778px;color:var(--black)', { w: 850, batidas: [...antes(4), ...BAT1.slice(0, 7)], t0: 0, t1: 4.3, larg: 5 })
;[0, 0.83, 1.67, 2.5, 3.33].forEach(b => { pulsa($('.s', t1.t), b); pulsa(circ1, b) })
vai(A, { scale: 1 }, { scale: 1.03, duration: 4.0, ease: 'none', transformOrigin: '50% 40%' }, 0)
vai(A, { scale: 1.03 }, { scale: 1, duration: 0.3, ease: 'power2.inOut' }, 4.0)

// tela do Google (quadro 0 → cena 2): logo, barra e, depois do enter, a lista
const G = el('<div class="scr"></div>', tA)
const gLogo = el('<div class="gw" style="position:absolute;left:0;right:0;top:40px;text-align:center"><span style="color:#4285f4">G</span><span style="color:#ea4335">o</span><span style="color:#fbbc05">o</span><span style="color:#4285f4">g</span><span style="color:#34a853">l</span><span style="color:#ea4335">e</span></div>', G)
const gBar = el(`<div class="gbar" style="top:188px">${icone.lupa.replace('width="40" height="40"', 'width="46" height="46"')}<span class="termo">pizzaria em Barreiras</span><span class="cur"></span></div>`, G)
const termo = $('.termo', gBar)
vai(termo, { backgroundColor: 'rgba(210,227,252,0)' }, { backgroundColor: 'rgba(210,227,252,1)', duration: 0.05 }, 0.9)
TL.set(termo, { backgroundColor: 'rgba(210,227,252,0)' }, 1.04)
{
  const texto = t => t < 1.04 ? 'pizzaria em Barreiras' : t < 1.05 ? '' : t < 2.3 ? 'peças agrícolas LEM'.slice(0, Math.round((t - 1.05) * 26))
    : t < 2.45 ? '' : 'loja de roupa em Barreiras'.slice(0, Math.round((t - 2.45) * 26))
  const o = { p: 0 }
  vai(o, { p: 0 }, { p: 1, duration: 2.7, ease: 'none', onUpdate: () => { termo.textContent = texto(0.9 + o.p * 2.7) } }, 0.9)
  cue(0.9, 'digita', 0.3); cue(1.05, 'digita', 0.9); cue(2.3, 'digita', 0.3); cue(2.45, 'digita', 0.9)
}
vai(gBar, { scale: 1 }, { scale: 0.97, duration: 0.07, yoyo: true, repeat: 1 }, 3.6); cue(3.6, 'tique', 0.8)
vai($('.cur', gBar), { opacity: 1 }, { opacity: 0, duration: 0.1 }, 3.6)
vai(gLogo, { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: -60, scale: 0.6, duration: 0.3, ease: 'power2.in' }, 3.65)
vai(gBar, { y: 0 }, { y: -110, duration: 0.35, ease: 'power3.inOut' }, 3.65)
const lista = el('<div style="position:absolute;inset:0"></div>', G)
const RES = [['Concorrente', '★★★★★', 'aberto agora'], ['Outro concorrente', '★★★★☆', 'aberto agora'], ['Mais um concorrente', '★★★★★', 'fecha às 18h']]
const res = RES.map(([n, e, s], i) => el(`<div class="gres" style="top:${208 + i * 130}px"><b>${n}</b><span><span class="est">${e}</span> · ${s}</span></div>`, lista))
const vaga = el('<div class="vaga" style="top:618px">sua empresa?</div>', lista)
vai(lista, { y: 500, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' }, 3.65)

// saída do quadro 0: título e ECG sobem, o celular sobe e o título da cena 2 vem preso nele
vai([t1.t, circ1, ecg1], { y: 0, opacity: 1 }, { y: -900, opacity: 0, duration: 0.3, ease: 'power2.in' }, 4.0)
vai(celA.c, { y: 0 }, { y: -300, duration: 0.3, ease: 'power3.inOut' }, 4.0)
cue(4.0, 'whoosh', 0.45)

// ── 2. RAIO-X 1/3: só aparece o concorrente (4.3–7.1) ──
const t2 = titulo2(A, ['Só aparece', '*o concorrente.*'], 370, 104)
vai(t2.t, { y: 300, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power3.inOut' }, 4.0)
TL.set(tA, { filter: 'grayscale(1)' }, 4.3)
{
  const rx = el('<div class="raiox" style="top:0"></div>', G)
  gsap.set(rx, { opacity: 0 })
  TL.set(rx, { opacity: 1 }, 4.4)
  vai(rx, { y: 0 }, { y: 700, duration: 0.6, ease: 'power1.inOut' }, 4.4)
  TL.set(rx, { opacity: 0 }, 5.0)
  cue(4.4, 'whoosh_desce', 0.4)
  res.forEach((r, i) => { vai(r, { backgroundColor: 'rgba(230,228,222,0)' }, { backgroundColor: 'rgba(230,228,222,1)', duration: 0.06 }, 4.52 + i * 0.12); vai(r, { backgroundColor: 'rgba(230,228,222,1)' }, { backgroundColor: 'rgba(230,228,222,0)', duration: 0.12 }, 4.6 + i * 0.12) })
  vai(vaga, { borderColor: '#c9c6bf' }, { borderColor: '#f3f2ee', duration: 0.1, yoyo: true, repeat: 3 }, 5.1); cue(5.1, 'tique', 0.6)
  risca(G, 'M150 650 L740 760', 5.4, 0.15, { larg: 9 }); risca(G, 'M740 650 L150 760', 5.55, 0.15, { larg: 9 }); cue(5.4, 'erro', 0.5)
  const st = el('<div class="carimbo" style="left:198px;top:608px">SUMIDA</div>', G)
  carimba(st, 5.8, -9)
  tremeX(celA.c, 5.85, 8, 0.3)
}

// ── 3. RAIO-X 2/3: Instagram parado (7.1–9.7) ──
const teia = (estilo) => {
  const cx = 252, cy = 0, raios = [95, 110, 125, 140, 155, 170].map(a => a * Math.PI / 180)
  let d = raios.map(a => `M${cx} ${cy} L${(cx + Math.cos(a) * 250).toFixed(1)} ${(cy + Math.sin(a) * 250).toFixed(1)}`).join(' ')
  ;[55, 105, 155, 205].forEach(r => { d += ' M' + raios.map((a, i) => `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}${i < raios.length - 1 ? ` Q${(cx + Math.cos(a + 0.13) * r * 0.9).toFixed(1)} ${(cy + Math.sin(a + 0.13) * r * 0.9).toFixed(1)}` : ''}`).join(' ') })
  return `<svg class="traco" viewBox="0 0 252 252" style="${estilo};stroke-width:4;color:#0b0b0b"><path d="${d}"/></svg>`
}
const ICONE_IMG = '<svg viewBox="0 0 24 24" width="80" height="80"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="#c9c6bf" stroke-width="2"/><circle cx="9" cy="10" r="1.8" fill="#c9c6bf"/><path d="M4 18l5-5 4 4 3-3 4 4" fill="none" stroke="#c9c6bf" stroke-width="2"/></svg>'
const perfilMorto = pai => {
  el(`<div class="ig-av" style="left:60px;top:68px;border:5px dashed #c9c6bf"><svg viewBox="0 0 24 24" width="80" height="80"><circle cx="12" cy="9" r="4" fill="#d8d6d0"/><path d="M4 21c1-5 5-7 8-7s7 2 8 7" fill="#d8d6d0"/></svg></div>`, pai)
  el('<div class="ig-nome" style="left:238px;top:92px">suaempresa</div>', pai)
  el('<div class="ig-bio" style="left:238px;top:166px;width:420px"></div>', pai); el('<div class="ig-bio" style="left:238px;top:204px;width:300px"></div>', pai)
  return [0, 1, 2, 3, 4, 5].map(i => el(`<div class="ig-g morto" style="left:${60 + (i % 3) * 258}px;top:${278 + Math.floor(i / 3) * 258}px">${ICONE_IMG}</div>`, pai))
}
const I3 = el('<div class="scr"></div>', tA)
const t3 = titulo2(A, ['Último post:', '*há 4 meses.*'], 370, 104)
{
  const blocos = perfilMorto(I3)
  const tg = el('<div class="etq-p" style="left:80px;top:300px">há 4 meses</div>', I3)
  const w = el(teia('left:576px;top:278px;width:252px;height:252px'), I3)
  const p = $('path', w), L = p.getTotalLength()
  gsap.set(p, { strokeDasharray: `${L} ${L + 40}`, strokeDashoffset: L * 0.5 })
  vai(p, { strokeDashoffset: L * 0.5 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut' }, 7.7)
  const rx = el('<div class="raiox" style="top:0"></div>', I3); gsap.set(rx, { opacity: 0 })
  TL.set(rx, { opacity: 1 }, 7.2); vai(rx, { y: 0 }, { y: 760, duration: 0.6, ease: 'power1.inOut' }, 7.2); TL.set(rx, { opacity: 0 }, 7.8)
  cue(7.2, 'whoosh_desce', 0.4)
  vai(tg, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 7.4)
  ;[7.4, 7.8, 8.2].forEach((t, k) => { vai(blocos, { filter: `brightness(${1 - k * 0.07})` }, { filter: `brightness(${0.93 - k * 0.07})`, duration: 0.08 }, t); cue(t, 'tique', 0.7) })
  const st = el('<div class="carimbo" style="left:190px;top:470px">PARADA</div>', I3)
  carimba(st, 8.5, -7)
}
gsap.set([I3, t3.t], { x: 1080 })
trocaApp([G, t2.t], [I3, t3.t], 6.8)

// ── 4. RAIO-X 3/3: WhatsApp respondendo 2 dias depois (9.7–13) ──
const W4 = el('<div class="scr"></div>', tA)
const t4 = titulo2(A, ['Respondeu', '*2 dias depois.*'], 370, 104)
{
  el('<div class="wa-fundo"></div>', W4)
  el('<div class="wa-topo"><span class="wa-av" style="background:#d8d6d0"></span><div><b>Sua Empresa</b><small>visto por último há 2 dias</small></div></div>', W4)
  el('<div class="wb" style="left:40px;top:208px">Oi! Tem esse vestido no M?<small>seg 09:12</small></div>', W4)
  const chip = el('<div class="chip" style="top:340px"><svg viewBox="0 0 24 24" width="44" height="44"><circle cx="12" cy="12" r="9.5" fill="none" stroke="#0b0b0b" stroke-width="2.4"/><path class="pont" d="M12 12V6" stroke="#0b0b0b" stroke-width="2.4" stroke-linecap="round"/></svg>2 DIAS DEPOIS</div>', W4)
  const b2 = el('<div class="wb eu" style="right:40px;top:438px">Oi, tem sim!<small>qua 10:40</small></div>', W4)
  const b3 = el('<div class="wb" style="left:40px;top:568px">Já comprei no concorrente.<small>qua 10:41</small></div>', W4)
  vai(chip, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' }, 10.0)
  vai($('.pont', chip), { rotate: 0 }, { rotate: 720, duration: 0.6, ease: 'power1.inOut', svgOrigin: '12 12' }, 10.0)
  for (let i = 0; i < 6; i++) cue(10.0 + i * 0.1, 'tique', 0.6)
  vai(b2, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: 'back.out(1.8)' }, 10.3); cue(10.3, 'pop', 0.7)
  vai(b3, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: 'back.out(1.8)' }, 10.6); cue(10.6, 'erro', 0.8)
  tremeX(celA.c, 10.65, 10, 0.3)
  const st = el('<div class="carimbo" style="left:84px;top:310px;font-size:110px">VENDA PERDIDA</div>', W4)
  carimba(st, 11.4, -8)
}
gsap.set([W4, t4.t], { x: 1080 })
trocaApp([I3, t3.t], [W4, t4.t], 9.4)
// a tela apaga e o monitor vira linha reta; depois o celular engole o quadro
{
  const veu = el('<div style="position:absolute;inset:0;background:#000;opacity:0;z-index:20"></div>', tA)
  vai(veu, { opacity: 0 }, { opacity: 0.85, duration: 0.3, ease: 'power2.in' }, 12.3)
  risca(A, 'M0 1080 L300 1080 L330 1068 L350 1080 L372 1086 L382 1052 L394 1092 L406 1080 L1080 1080', 12.3, 0.3, { larg: 7, cor: 'var(--paper)' }).style.zIndex = 30
  cue(12.3, 'flatline', 1.0)
  vai(celA.c, { scale: 1 }, { scale: 3.4, duration: 0.35, ease: 'power3.in', transformOrigin: '470px 480px' }, 12.65)
  vai(t4.t, { opacity: 1 }, { opacity: 0, duration: 0.2 }, 12.65)
}

// ── 5. A VIRADA (13–16): o bip. A Viva deixa a sua empresa viva ──────────
{
  const T = 13, c = cena('preta grao', T, 16, { entra: 'corte' })
  cue(T, 'bip', 1.0); cue(T, 'impacto', 1.0)
  flash(T, '#fff', 0.5)
  const lg = logoViva(c, 'position:absolute;left:80px;top:300px;width:520px', { preto: false })
  vai(lg, { scale: 1.15, rotate: -4 }, { scale: 1, rotate: -2, duration: 0.45, ease: 'back.out(1.8)', transformOrigin: '0% 50%' }, T)
  const a = titulo2(c, ['A Viva deixa', 'sua empresa', '<span class="s" style="font-size:150px">viva.</span>'], 590, 130, 'var(--paper)')
  traco(c, 'circulo', 'left:40px;top:828px;width:350px;height:170px;color:var(--paper);stroke-width:8', T + 0.3, 0.5); cue(T + 0.3, 'tique', 0.8)
  ecgT(c, 'left:80px;top:1025px;color:var(--paper)', { w: 850, batidas: [13, 13.5, 14, 14.5, 15, 15.5, 16], t0: T, t1: 16, vel: 340, larg: 7, alto: b => (b === 13 ? 1.4 : 1) })
  const LG = ['google', 'googlemaps', 'instagram', 'whatsapp', 'ia']
  LG.forEach((n, i) => {
    const e = el(`<span class="logo-ic${n === 'instagram' ? ' cheio' : ''}" style="position:absolute;left:${150 + i * 165}px;top:1240px;width:120px;height:120px;border-radius:30px">${n === 'ia' ? icone.ia : LOGOS[n]}</span>`, c)
    gsap.set(e, { filter: 'grayscale(1)' })
    vai(e, { y: 0 }, { y: -20, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' }, T + 1.1 + i * 0.1)
    cor(e, T + 1.1 + i * 0.1)
    cue(T + 1.1 + i * 0.1, 'pop', 0.5)
  })
}

// ── ATO 2 (16–27.5): cada tela revive no mesmo celular ─────────────────
const C = cena('papel grao', 16, 27.5, { eixo: 'y' })
const celC = celularG(C, { top: 600 })
const tC = celC.tela
const sbar = pai => el('<div class="sbar"><b>*ilustração</b><u></u></div>', pai)

// 6. Procurou? Achou você. (16–18.5)
const S6 = el('<div class="scr"></div>', tC)
const t6 = titulo2(C, ['Procurou?', '*Achou você.*'], 370, 110)
{
  sbar(S6)
  el(`<div class="gbar" style="top:78px">${icone.lupa.replace('width="40" height="40"', 'width="46" height="46"')}<span>loja de roupa em Barreiras</span></div>`, S6)
  const card = el(`<div style="position:absolute;left:60px;top:208px;width:776px;height:280px;background:#fff;border:4px solid #0b0b0b;border-radius:24px;box-shadow:10px 10px 0 #0b0b0b;overflow:hidden">
    <div style="position:absolute;left:24px;top:24px;width:150px;height:150px;border-radius:16px;background:#e6e4de;overflow:hidden"><svg viewBox="0 0 150 150" width="150" height="150"><path d="M0 95 L150 70 M60 0 L85 150 M0 30 L150 45" stroke="#fff" stroke-width="12"/></svg><span class="anel" style="position:absolute;left:55px;top:43px;width:40px;height:40px;border-radius:50%;border:4px solid #0b0b0b"></span><svg viewBox="-16 -50 32 52" width="38" height="60" style="position:absolute;left:56px;top:20px"><path d="M0 0C-11-17-16-25-16-33a16 16 0 1 1 32 0C16-25 11-17 0 0Z" fill="#0b0b0b"/><circle cy="-33" r="5" fill="#fff"/></svg></div>
    <div style="position:absolute;left:200px;top:26px"><b class="se" style="font:800 50px/1.1 var(--sans);position:relative">Sua Empresa</b><div style="font:500 40px/1.3 var(--sans);color:#4d5156"><span class="est">★★★★★</span> · <span style="color:#188038">Aberto agora</span></div></div>
    <div style="position:absolute;left:24px;top:192px;display:flex;gap:14px"><span class="pb"><svg viewBox="0 0 24 24" width="36" height="36"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="#0b0b0b"/></svg>Ligar</span><span class="pb"><svg viewBox="0 0 24 24" width="36" height="36"><path d="M12 2l9 9-9 9-9-9z" fill="#0b0b0b"/><path d="M9 13v-2.5h5V8l3 3-3 3v-1.5h-3V13z" fill="#fff"/></svg>Rota</span><span class="pb">${logo('whatsapp')}WhatsApp</span></div>
    <i class="brilho" style="position:absolute;top:0;bottom:0;width:120px;left:-160px;background:linear-gradient(100deg,transparent,rgba(255,255,255,.7),transparent)"></i></div>`, S6)
  el('<div class="gres" style="top:518px;opacity:.55"><b>Concorrente</b><span><span class="est">★★★★☆</span> · aberto agora</span></div>', S6)
  el('<div class="gres" style="top:648px;opacity:.55"><b>Outro concorrente</b><span><span class="est">★★★☆☆</span> · fecha às 18h</span></div>', S6)
  vai(card, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.6)' }, 16.1); cue(16.1, 'pop', 0.7)
  vai($('.brilho', card), { x: 0 }, { x: 1100, duration: 0.5, ease: 'power2.inOut' }, 16.3)
  vai($('.anel', card), { scale: 1, opacity: 1 }, { scale: 2.2, opacity: 0, duration: 0.5, repeat: 4, ease: 'power1.out' }, 16.2)
  traco(S6, 'circulo', 'left:228px;top:212px;width:400px;height:100px;stroke-width:6', 16.5, 0.4); cue(16.5, 'tique', 0.6)
}
TL.set(tC, { filter: 'grayscale(1)' }, 15.7)
cor(tC, 16.0); cue(16.0, 'bip', 0.5)

// 7. Rolou o feed? Viu você. (18.5–21.5)
const S7 = el('<div class="scr"></div>', tC)
const t7 = titulo2(C, ['Rolou o feed?', '*Viu você.*'], 370, 110)
{
  sbar(S7)
  const rolo = el('<div style="position:absolute;inset:0"></div>', S7)
  // perfil morto por cima (igual à cena 3) e o vivo por baixo
  const vivoTopo = el(`<div style="position:absolute;inset:0"><div class="ig-av" style="left:60px;top:68px;background:conic-gradient(#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5,#feda75)"><span style="width:132px;height:132px;border-radius:50%;background:#e6e4de;border:5px solid #fff;display:grid;place-items:center;font:900 56px var(--sans)">SE</span></div>
    <div class="ig-nome" style="left:238px;top:92px">suaempresa</div><div style="position:absolute;left:238px;top:160px;padding:14px 40px;border-radius:14px;background:#0095f6;color:#fff;font:800 40px/1 var(--sans)">Seguir</div></div>`, rolo)
  const DESENHOS = [
    '<svg viewBox="0 0 100 100" width="200" height="200"><path d="M50 12v8M38 26c0-7 24-7 24 0l-12 8zM30 34l20 -6 20 6-4 20 12 34H22l12-34z" fill="none" stroke="#0b0b0b" stroke-width="3.5" stroke-linejoin="round"/></svg>',
    '<div style="width:100%;height:100%;background:#1b1b1b;display:grid;place-items:center;position:relative"><svg viewBox="0 0 24 24" width="90" height="90"><path d="M8 5l12 7-12 7z" fill="#fff"/></svg><span style="position:absolute;left:16px;top:14px;display:flex;align-items:center;gap:8px;color:#fff;font:800 40px var(--sans)"><i class="rec" style="width:20px;height:20px;border-radius:50%;background:#e33"></i>REC</span></div>',
    '<b style="font:900 52px/1 var(--sans);font-stretch:70%;letter-spacing:.02em">NOVIDADE</b>',
    '<span class="est" style="font-size:44px">★★★★★</span>',
    '<svg viewBox="0 0 100 100" width="200" height="200"><rect x="16" y="40" width="68" height="46" fill="none" stroke="#0b0b0b" stroke-width="3.5"/><path d="M12 40l8-16h60l8 16z" fill="#fff" stroke="#0b0b0b" stroke-width="3.5"/><path d="M28 24l-4 16M44 24l-2 16M60 24l2 16M76 24l4 16" stroke="#0b0b0b" stroke-width="7"/><rect x="42" y="58" width="16" height="28" fill="#0b0b0b"/></svg>',
    '<span style="font:400 64px/1 var(--serif);font-style:italic">sábado</span>',
  ]
  const vivos = DESENHOS.map((d, i) => el(`<div class="ig-g" style="left:${60 + (i % 3) * 258}px;top:${278 + Math.floor(i / 3) * 258}px;background:${i === 1 ? '#1b1b1b' : '#f3f2ee'};display:grid;place-items:center">${d}</div>`, rolo))
  const morto = el('<div style="position:absolute;inset:0"></div>', rolo)
  el('<div class="mh" style="position:absolute;left:0;right:0;top:60px;height:210px;background:#fff"></div>', morto)
  const mortos = perfilMorto(morto)
  const w = el(teia('left:576px;top:278px;width:252px;height:252px'), morto)
  // post patrocinado, logo abaixo do perfil (entra quando o feed rola)
  el(`<div style="position:absolute;left:60px;top:800px;width:776px;display:flex;align-items:center;gap:20px"><span style="width:76px;height:76px;border-radius:50%;background:#e6e4de;border:3px solid #d62976;display:grid;place-items:center;font:900 32px var(--sans)">SE</span><div><b style="display:block;font:800 44px/1 var(--sans)">suaempresa</b><span style="font:500 40px/1.1 var(--sans);color:#55524d">Patrocinado</span></div></div>`, rolo)
  const arte = el(`<div style="position:absolute;left:0;right:0;top:900px;height:430px;background:#e6e4de;display:flex;align-items:center;justify-content:center;gap:30px">${DESENHOS[0].replace('width="200" height="200"', 'width="300" height="300"')}<span style="font:400 96px/1 var(--serif);font-style:italic">Novidade</span></div>`, rolo)
  const cora = el('<svg viewBox="0 0 24 24" width="220" height="220" style="position:absolute;left:338px;top:1005px"><path d="M12 21s-7-4.6-9.5-9C.7 8.5 2.8 4.5 6.5 4.5c2 0 3.6 1.1 5.5 3 1.9-1.9 3.5-3 5.5-3 3.7 0 5.8 4 4 7.5C19 16.4 12 21 12 21z" fill="#ff3040"/></svg>', rolo)
  const btn = el('<div style="position:absolute;left:60px;top:1350px;width:776px;height:90px;border-radius:45px;background:#0b0b0b;color:#f3f2ee;display:flex;align-items:center;justify-content:center;gap:12px;font:800 44px var(--sans);overflow:hidden">Enviar mensagem ›<i class="onda" style="position:absolute;left:560px;top:20px;width:50px;height:50px;border-radius:50%;background:rgba(255,255,255,.45)"></i></div>', rolo)
  gsap.set(cora, { scale: 0, transformOrigin: '50% 50%' }); gsap.set($('.onda', btn), { scale: 0, opacity: 0 })
  // revive: a pincelada varre a teia, os blocos viram, a cor volta
  vai(w, { clipPath: 'inset(0 0% 0 0)' }, { clipPath: 'inset(0 0% 0 100%)', duration: 0.3, ease: 'power2.inOut' }, 18.5); cue(18.55, 'whoosh_desce', 0.3)
  vai($$('.mh, .ig-av, .ig-nome, .ig-bio', morto), { opacity: 1 }, { opacity: 0, duration: 0.15 }, 18.6)
  mortos.forEach((m, i) => vai(m, { scaleX: 1 }, { scaleX: 0, duration: 0.15, ease: 'power2.in' }, 18.6 + i * 0.06))
  vivos.forEach((v, i) => vai(v, { scaleX: 0 }, { scaleX: 1, duration: 0.15, ease: 'power2.out' }, 18.75 + i * 0.06))
  cue(18.65, 'pop', 0.6)
  vai($('.rec', vivos[1]), { opacity: 1 }, { opacity: 0.2, duration: 0.25, yoyo: true, repeat: 5, ease: 'steps(1)' }, 19.0)
  const fl = el('<i style="position:absolute;inset:0;background:#fff;opacity:0"></i>', vivos[1])
  vai(fl, { opacity: 0.9 }, { opacity: 0, duration: 0.25 }, 18.95); gsap.set(fl, { opacity: 0 }); cue(18.95, 'camera', 0.6)
  // rolou o feed
  vai(rolo, { y: 0 }, { y: -700, duration: 0.45, ease: 'power3.inOut' }, 19.8); cue(19.8, 'whoosh', 0.3)
  vai(cora, { scale: 0 }, { scale: 1.3, duration: 0.15, ease: 'power2.out' }, 20.4)
  vai(cora, { scale: 1.3 }, { scale: 1, duration: 0.15 }, 20.55)
  vai(cora, { opacity: 1 }, { opacity: 0, duration: 0.25 }, 20.9)
  cue(20.4, 'pop', 0.8)
  vai(btn, { scale: 1 }, { scale: 0.96, duration: 0.08, yoyo: true, repeat: 1 }, 20.7)
  vai($('.onda', btn), { scale: 0, opacity: 1 }, { scale: 6, opacity: 0, duration: 0.3, ease: 'power2.out' }, 20.7); cue(20.7, 'tique', 0.8)
}
gsap.set([S7, t7.t], { x: 1080 }); cor(S7, 18.5)
trocaApp([S6, t6.t], [S7, t7.t], 18.2)
cue(18.5, 'bip', 0.5)

// 8. Chamou? Resposta na hora. (21.5–24.5)
const S8 = el('<div class="scr"></div>', tC)
const t8 = titulo2(C, ['Chamou?', '<span class="s" style="font-size:.95em">Resposta na hora.</span>'], 370, 110)
{
  el('<div class="wa-fundo"></div>', S8); sbar(S8)
  el('<div class="wa-topo"><span class="wa-av" style="background:#e6e4de">SE</span><div><b>Sua Empresa</b><small style="color:#1d9d51">online</small></div></div>', S8)
  el('<div class="wb" style="left:40px;top:208px;font-size:44px;max-width:620px">Oi! Vim pelo anúncio. Tem esse vestido no M?<small>23:47</small></div>', S8)
  const dig = el('<div class="wb eu" style="right:40px;top:378px;display:flex;gap:10px;padding:26px 30px">' + '<i style="width:18px;height:18px;border-radius:50%;background:#55524d;display:block"></i>'.repeat(3) + '</div>', S8)
  const ia = el(`<div class="wb eu" style="right:40px;top:378px;font-size:44px;border:3px solid #0b0b0b"><span style="display:inline-block;width:40px;height:40px;vertical-align:-6px;margin-right:10px">${icone.ia}</span>Tem sim! Separo pra você?<small>23:47</small></div>`, S8)
  const b3 = el('<div class="wb" style="left:40px;top:508px;font-size:44px">Separa! Passo às 18h.<small>23:48</small></div>', S8)
  gsap.set(dig, { opacity: 0 }); TL.set(dig, { opacity: 1 }, 21.65); TL.set(dig, { opacity: 0 }, 21.95)
  $$('i', dig).forEach((b, i) => vai(b, { y: 0 }, { y: -10, duration: 0.1, yoyo: true, repeat: 1 }, 21.65 + i * 0.08))
  cue(21.65, 'digita', 0.5)
  vai(ia, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: 'back.out(1.8)' }, 21.95); cue(21.95, 'ding', 0.8)
  const m = el('<div class="mao" style="left:480px;top:660px;font-size:84px;rotate:-6deg">23:47!</div>', S8)
  escreve(m, 22.4, 0.35); cue(22.4, 'tique', 0.6)
  risca(S8, 'M700 665 C 760 640, 790 600, 770 540 M 748 560 L 770 536 L 792 560', 22.5, 0.3, { larg: 6 })
  vai(b3, { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.25, ease: 'back.out(1.8)' }, 22.8); cue(22.8, 'pop', 0.7)
  vai(celC.c, { y: 0 }, { y: -12, duration: 0.1, yoyo: true, repeat: 1 }, 22.95); cue(22.95, 'caixa', 0.7)
}
gsap.set([S8, t8.t], { x: 1080 }); cor(S8, 21.5)
trocaApp([S7, t7.t], [S8, t8.t], 21.2)
cue(21.5, 'bip', 0.5)

// 9. Perguntou pra IA? Aparece você. (24.5–27.5)
const S9 = el('<div class="scr"></div>', tC)
const t9 = titulo2(C, ['<span style="font-size:.91em">Perguntou pra IA?</span>', '<span class="s" style="font-size:1.05em">Aparece você.</span>'], 370, 110)
{
  sbar(S9)
  el(`<div style="position:absolute;left:60px;top:78px;display:flex;align-items:center;gap:20px"><span class="logo-ic" style="width:72px;height:72px;border-radius:20px;box-shadow:none">${icone.ia}</span><b style="font:800 46px var(--sans)">Assistente de IA</b></div>`, S9)
  el('<div style="position:absolute;right:60px;top:188px;padding:18px 28px;border-radius:28px;background:#e6e4de;font:500 44px/1.2 var(--sans)">Onde comprar roupa em Barreiras?</div>', S9)
  const resp = el('<div style="position:absolute;left:60px;top:330px;font:500 48px/1.2 var(--sans)"><span>Recomendo</span> <span>a</span> <b class="hl" style="position:relative;background:#e6e4de;padding:0 8px">Sua Empresa</b><span>:</span></div>', S9)
  gsap.set($$(':scope > *', resp), { display: 'inline-block' })
  $$(':scope > *', resp).forEach((w, i) => vai(w, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.1 }, 24.6 + i * 0.08))
  cue(24.6, 'digita', 0.5)
  const card = el(`<div style="position:absolute;left:60px;top:420px;width:776px;height:160px;border:3px solid #0b0b0b;border-radius:24px;display:flex;align-items:center;gap:24px;padding:0 28px;background:#fff">${logo('googlemaps')}<div><b style="display:block;font:800 46px/1.1 var(--sans)">Sua Empresa</b><span style="font:500 40px var(--sans);color:#4d5156"><span class="est">★★★★★</span> · aberto agora</span></div></div>`, S9)
  gsap.set($('.logo-ic', card), { width: 90, height: 90, boxShadow: 'none' })
  vai(card, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.8)' }, 25.05); cue(25.05, 'ding', 0.6)
  const fontes = el(`<div style="position:absolute;left:60px;top:620px;display:flex;gap:16px"><span class="pb">${logo('google')}Google</span><span class="pb">${logo('instagram', 'cheio')}Instagram</span><span class="pb"><svg viewBox="0 0 24 24" width="40" height="40"><rect x="2" y="4" width="20" height="16" rx="3" fill="#fff" stroke="#0b0b0b" stroke-width="2"/><path d="M2 9h20" stroke="#0b0b0b" stroke-width="2"/></svg>site</span></div>`, S9)
  $$('.pb', fontes).forEach((p, i) => { vai(p, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'back.out(2)' }, 25.4 + i * 0.08); cue(25.4 + i * 0.08, 'pop', 0.4) })
  traco(S9, 'circulo', 'left:343px;top:309px;width:390px;height:100px;stroke-width:6', 25.7, 0.4); cue(25.7, 'tique', 0.6)
}
gsap.set([S9, t9.t], { x: 1080 }); cor(S9, 24.5)
trocaApp([S8, t8.t], [S9, t9.t], 24.2)
cue(24.5, 'bip', 0.5)

// ── 10. SÓ O QUE A SUA EMPRESA PRECISA (27.5–31.5): a roda de ingressos para no plano ──
{
  const T = 27.5, c = cena('papel2 grao', T, 31.5, { eixo: 'y' })
  titulo2(c, ['Só o que a *sua*', 'empresa precisa.'], 370, 110)
  const IC = {
    site: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" fill="#fff" stroke="#0b0b0b" stroke-width="2"/><path d="M2 9h20" stroke="#0b0b0b" stroke-width="2"/></svg>',
    marca: '<svg viewBox="0 0 24 24"><text x="2" y="17.5" font-family="Georgia,serif" font-style="italic" font-size="15" fill="#0b0b0b">Aa</text></svg>',
    rec: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2" fill="#0b0b0b"/><path d="M16 10.5l6-3.2v9.4l-6-3.2z" fill="#0b0b0b"/><circle cx="6" cy="10" r="1.8" fill="#e33"/></svg>',
    lupa: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#0b0b0b" stroke-width="2.6"/><path d="M15.5 15.5L21 21" stroke="#0b0b0b" stroke-width="2.6" stroke-linecap="round"/></svg>',
  }
  const lg = ls => ls.map(n => n.startsWith('<svg') ? `<span class="logo-ic">${n}</span>` : logo(n, n === 'tiktok' || n === 'instagram' ? 'cheio' : '')).join('')
  const ITENS = [
    ['Sites', '', [IC.site]], ['IA no WhatsApp', '', ['whatsapp', icone.ia]], ['Tráfego pago', 'gestor com case de sucesso', ['meta', 'googleads', 'tiktok']],
    ['Google Meu Negócio', '', ['googlemaps', 'google']], ['Audiovisual', '', [IC.rec, 'youtube']], ['Social Media', '', ['instagram', 'facebook', 'tiktok']],
    ['Branding', '', [IC.marca]], ['Busca por IA', '', [icone.ia, IC.lupa]],
  ]
  const mask = el('<div style="position:absolute;left:0;top:640px;width:1080px;height:810px;overflow:hidden"></div>', c)
  const PASSO = 8, R = 1300
  const roda = el(`<div style="position:absolute;left:-1150px;top:${1040 - 640}px;width:0;height:0"></div>`, mask)
  const ings = ITENS.map(([n, sub, ls], i) => {
    const g = el(`<div style="position:absolute;left:0;top:0;width:0;height:0;transform:rotate(${i * PASSO}deg)"></div>`, roda)
    return el(`<div class="ingv" style="left:${R}px"><div class="nm"><b>${n}</b>${sub ? `<small>${sub}</small>` : ''}</div><div class="cn">${lg(ls)}</div></div>`, g)
  })
  gsap.set(roda, { rotate: -5 * PASSO })
  vai(roda, { rotate: -5 * PASSO }, { rotate: -2 * PASSO, duration: 1.0, ease: 'power3.inOut' }, T + 0.3)
  cue(T + 0.3, 'whoosh', 0.4); [0.55, 0.85, 1.15].forEach(d => cue(T + d, 'tique', 0.7)); cue(T + 1.3, 'pop', 0.7)
  ;[1, 2, 3].forEach((i, k) => {
    vai(ings[i], { x: 0, scale: 1, boxShadow: '12px 12px 0 #0b0b0b' }, { x: 30, scale: 1.04, boxShadow: '18px 18px 0 #0b0b0b', duration: 0.3, ease: 'back.out(2)' }, T + 1.4 + k * 0.1)
    cue(T + 1.4 + k * 0.1, 'pop', 0.5)
  })
  ings.forEach((e, i) => { if (![1, 2, 3].includes(i)) vai(e, { opacity: 1 }, { opacity: 0.3, duration: 0.3 }, T + 1.45) })
}

// ── 11. PACOTE PRONTO? AQUI NÃO. SOB MEDIDA. (31.5–36.5) ─────────────────
{
  const T = 31.5, c = cena('papel grao', T, 36.5)
  el('<div class="ti" style="top:370px;font-size:100px">Pacote pronto?</div>', c)
  traco(c, 'risco', 'left:70px;top:398px;width:700px;height:60px;stroke-width:9', T + 0.9, 0.25); cue(T + 0.9, 'erro', 0.5)
  const velho = el('<div style="position:absolute;inset:0"></div>', c)
  const cxs = ['pizzaria', 'clínica', 'loja de roupa'].map((n, i) => el(`<div class="cxp" style="left:${90 + i * 270}px;top:700px"><div class="fx">PACOTE<br>PRONTO</div><div class="mao">${n}</div></div>`, velho))
  const st = el('<div class="carimbo" style="left:170px;top:760px;font-size:76px;border-width:8px">IGUAL PRA<br>TODO MUNDO</div>', velho)
  carimba(st, T + 0.15, -7)
  vai(cxs, { scaleY: 1 }, { scaleY: 0.95, duration: 0.1, yoyo: true, repeat: 1, transformOrigin: '50% 100%' }, T + 0.3)
  treme(c, T + 0.3, 6, 0.2)
  vai(velho, { y: 0, rotate: 0, opacity: 1 }, { y: 1300, rotate: 6, opacity: 0, duration: 0.35, ease: 'power2.in' }, T + 1.2); cue(T + 1.2, 'whoosh_desce', 0.6)
  const b = titulo2(c, ['*Sob medida.*'], 470, 130)
  sobeLinhas(b.linhas, T + 1.2, { dur: 0.5 })
  const novo = el('<div style="position:absolute;inset:0"></div>', c)
  const linha = risca(novo, 'M150 690 L150 1300', T + 1.6, 0.9, { larg: 6 })
  const PAR = [['Raio-x do negócio.', '', 720], ['Plano pra sua meta.', '', 885], ['Mão na massa.', '', 1050], ['Relatório todo mês.', 'contatos, custo e ajuste', 1230]]
  PAR.forEach(([txt, sub, y], i) => {
    const bola = el(`<div class="parada" style="top:${y - 48}px">${i + 1}</div>`, novo)
    const card = el(`<div class="cartao" style="top:${y - 60}px;rotate:${[-1.5, 1, -1, 1.5][i]}deg">${txt}${sub ? `<small>${sub}</small>` : ''}</div>`, novo)
    const tt = T + 1.6 + i * 0.25
    vai(bola, { scale: 1.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(2)' }, tt)
    vai(card, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.6)' }, tt)
    cue(tt, 'pop', 0.6)
  })
  const m = el('<div class="mao" style="left:240px;top:1352px;font-size:60px;rotate:-3deg">meta: o <u style="text-decoration:none;position:relative">seu</u> case de sucesso</div>', c)
  escreve(m, T + 2.7, 0.45); cue(T + 2.7, 'tique', 0.6)
  vai(c, { scale: 1 }, { scale: 1.02, duration: 1.5, ease: 'none', transformOrigin: '50% 50%' }, T + 3.2)
  cue(T + 4.0, 'riser', 0.8)
}

// ── 12. DESDE 2016, EM 8 CIDADES DO OESTE (36.5–40.5) ────────────────────
{
  const T = 36.5, c = cena('preta grao', T, 40.5, { eixo: 'y' })
  cue(T, 'impacto', 0.9)
  titulo2(c, ['Desde 2016, em', '*8 cidades* do Oeste.'], 360, 100, 'var(--paper)')
  const { m, pinos } = mapaOeste(c, 'left:78px;top:600px;width:925px;height:740px')
  const svg = $('svg', m)
  $$('text:not(.main):not(.hand-t)', m).forEach(t => gsap.set(t, { opacity: 0 }))
  const B = [309, 301.6 - 45]
  const ORDEM = ['sao-desiderio', 'riachao-das-neves', 'luis-eduardo-magalhaes', 'formosa-do-rio-preto', 'correntina', 'santa-maria-da-vitoria', 'bom-jesus-da-lapa']
  let defs = '', rotas = ''
  ORDEM.forEach((slug, i) => {
    const [x, y] = pinos[slug].dataset.xy.split(',').map(Number), ty = y - 45
    const mx = (B[0] + x) / 2 + (ty - B[1]) * 0.18, my = (B[1] + ty) / 2 - (x - B[0]) * 0.18
    const d = `M${B[0]} ${B[1]} Q${mx.toFixed(1)} ${my.toFixed(1)} ${x} ${ty}`
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
    const pin = $('.pin', pinos[ORDEM[i]])
    vai(pinos[ORDEM[i]], { opacity: 0.35 }, { opacity: 1, duration: 0.1 }, tt + 0.3)
    vai(pin, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, tt + 0.3)
    cue(tt, 'tique', 0.5)
  })
  const pulse = $('.pulse', svg)
  vai(pulse, { scale: 1, opacity: 0.9 }, { scale: 2.4, opacity: 0, duration: 0.5, repeat: 7, ease: 'power1.out', transformOrigin: '50% 50%' }, T)
  const BAL = [['mecânico em Formosa', 'left:398px;top:632px', 'b-esq'], ['peças em LEM', 'left:60px;top:968px;--tx:140px', 'b-cima'], ['pousada em Correntina', 'left:340px;top:1250px;--tx:178px', 'b-cima']]
  BAL.forEach(([txt, pos, cls], i) => {
    const b = el(`<div class="balao ${cls}" style="${pos}">${icone.lupa.replace(/#5f6368/g, '#0b0b0b')}${txt}</div>`, c)
    const tt = T + 1.1 + i * 0.35
    vai(b, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)', transformOrigin: '20% 50%' }, tt)
    cue(tt, 'pop', 0.6); cue(tt + 0.02, 'ding', 0.25)
  })
  gsap.set($('.hand-t', svg), { opacity: 0 })
  const aqui = el('<div class="mao" style="left:610px;top:1000px;font-size:58px;rotate:-4deg;color:var(--paper)">a gente tá aqui!</div>', c)
  escreve(aqui, T + 2.1, 0.4); cue(T + 2.1, 'tique', 0.5)
  risca(c, 'M622 1008 C 600 992, 588 978, 578 960 M 562 974 L 577 957 L 595 968', T + 2.4, 0.3, { larg: 5, cor: 'var(--paper)' })
  faixa(c, [...CIDADES], { top: 1352, rot: -3, clara: true, vel: 160, t0: T - 0.3, t1: 40.8 })
}

// ── 13. ISSO É EMPRESA VIVA (40.5–45) ────────────────────────────────────
{
  const T = 40.5, c = cena('preta grao', T, 45, { eixo: 'y' })
  titulo2(c, ['Isso é empresa', '<span class="s" style="font-size:1.27em">viva.</span>'], 350, 110, 'var(--paper)')
  const m = el('<div class="mao" style="left:430px;top:480px;font-size:60px;rotate:-4deg;color:var(--paper)">cliente, não curtida</div>', c)
  escreve(m, T + 2.2, 0.4); cue(T + 2.2, 'tique', 0.4)
  const { c: cel, tela } = celularG(c, { top: 610, escuro: true })
  cel.style.boxShadow = '0 0 0 3px #2a2a2a, 0 50px 120px rgba(0,0,0,.5)'
  el('<div class="sbar" style="color:#bdbab3"><b>*ilustração</b><u style="border-color:#bdbab3"></u></div>', tela)
  el('<div class="lock-d" style="top:112px">terça-feira · Barreiras</div>', tela)
  el('<div class="lock-h" style="top:160px;font-size:112px">08:12</div>', tela)
  const NS = [
    { logo: 'whatsapp', titulo: 'Cliente novo', texto: 'Oi! Vim pelo anúncio, queria um orçamento.' },
    { logo: 'googlemaps', titulo: 'Perfil da Empresa', texto: 'Alguém ligou pelo Google Maps.' },
    { logo: 'whatsapp', titulo: 'Nova mensagem', texto: 'Vocês entregam em Luís Eduardo?' },
  ]
  const Y = [910, 1092, 1274].map(y => y - 632)
  const cards = NS.map(n => notifGrande(tela, n, `left:38px;top:${Y[0]}px;opacity:0`))
  cards.forEach(k => k.classList.add('n2'))
  cards.forEach((k, i) => {
    const tt = T + 0.2 + i * 0.7
    vai(k, { y: -60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)' }, tt)
    for (let j = 0; j < i; j++) {
      const de = Y[i - 1 - j] - Y[0], para = Y[i - j] - Y[0]
      vai(cards[j], { y: de }, { y: para, duration: 0.35, ease: 'power3.out' }, tt)
    }
    tremeX(cel, tt, 6, 0.25)
    cue(tt, 'vibra', 0.9); cue(tt + 0.05, 'ding', 0.8)
  })
  const v = $('.s', c)
  ;[43, 43.5, 44, 44.5].forEach(b => pulsa(v, b, 1.04))
}

// ── 14. CHAMADA E LOOP (45–50): o quadro 0 com ponto final ───────────────
{
  const T = 45, c = cena('papel grao', T, DUR, { eixo: 'y' })
  const a = titulo2(c, ['Sua empresa', '<span class="s" style="margin:0 .2em 0 .1em">viva</span> no celular', 'de quem compra.'], 420, 120)
  traco(c, 'circulo', 'left:50px;top:520px;width:280px;height:145px;stroke-width:8', T + 0.2, 0.5); cue(T + 0.2, 'tique', 0.6)
  const pm = el('<div class="mao" style="left:400px;top:345px;font-size:52px;rotate:-3deg">pequena, média ou grande</div>', c)
  escreve(pm, T + 1.0, 0.4); cue(T + 1.0, 'tique', 0.4)
  const BAT = [42.5, 43, 43.5, 44, 44.5, 45, 45.5, 46, 46.5, 47, 47.5, 48.33, 49.17]
  ecgT(c, 'left:80px;top:778px;color:var(--black)', { w: 850, batidas: BAT, t0: T - 0.3, t1: DUR, larg: 5 })
  ;[45, 45.5, 46, 46.5, 47, 47.5, 48.33, 49.17].forEach(b => pulsa($('.s', a.t), b))
  cue(49.17, 'coracao', 0.9)
  const btn = botaoSite(c, 'Chamar no WhatsApp', 'left:150px;top:880px;width:780px;height:140px;padding:0;font-size:58px')
  vai(btn, { scale: 1 }, { scale: 1.04, duration: 0.15, yoyo: true, repeat: 1 }, T + 0.8); cue(T + 0.8, 'pop', 0.5)
  const m = el('<div class="mao" style="left:110px;top:1070px;font-size:70px;rotate:-4deg">tá no link da bio</div>', c)
  escreve(m, T + 1.4, 0.45)
  risca(c, 'M190 1160 C 170 1250, 140 1330, 118 1430 M 96 1400 L 116 1434 L 146 1410', T + 1.8, 0.4, { larg: 7 }); cue(T + 1.8, 'whoosh', 0.3)
  const { s, anel } = seloGrande(c, 'left:560px;top:1060px;width:370px;height:370px')
  carimba(s, T + 2.1, -6)
  vai(anel, { rotate: 0 }, { rotate: 100, duration: 5, ease: 'none' }, T)
  cue(48.5, 'impacto', 0.5)
}

pronto(DUR, { bpm: 120, drop: 13.0, pre: 'pad', calmo: [[31.5, 35.5], [40.5, 45.0]], fim: 48.5, mudo: [[12.25, 13.0]] })
