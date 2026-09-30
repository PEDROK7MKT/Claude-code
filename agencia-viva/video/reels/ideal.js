// Reels "O método que a agência qualquer pula" (~48,5 s, 120 BPM: 1 tempo = 0,5 s).
// A agência qualquer começa pelo pacote (etapa 03); a Viva começa duas etapas antes. A trilha numerada do site
// (01 Diagnóstico · 02 Plano · 03 Mão na massa · 04 Número na mesa) conta a história; cada quadro de entrada já chega montado.
// Zona segura: textos em x 90–930, y 250–1350. Faixa das cidades + etiqueta com o logo ficam na tela o tempo todo.
KIT.entrada = 'empurra'
KIT.dEntrada = 0.28

el(`<style>
.ti { position: absolute; left: 90px; right: 150px; font-weight: 900; font-stretch: 70%; line-height: .92; letter-spacing: -.02em; }
.ti .s { font-family: var(--serif); font-style: italic; font-weight: 400; font-stretch: 100%; font-size: 1.15em; letter-spacing: -.01em; }
.etq { position: absolute; left: 90px; top: 356px; padding: 14px 28px; border-radius: 99px; background: var(--black); color: var(--paper); font: 800 44px/1 var(--sans); letter-spacing: .04em; }
.cx { position: absolute; width: 250px; height: 320px; background: var(--paper-2); border: 5px solid var(--black); border-radius: 12px; box-shadow: 14px 14px 0 var(--black); overflow: hidden; }
.cx__faixa { background: var(--black); color: var(--paper); font: 900 40px/1 var(--sans); font-stretch: 72%; padding: 18px 16px 14px; text-align: center; }
.cx__qtd { font: 700 34px var(--sans); color: var(--muted); text-align: center; margin-top: 18px; }
.cx__etq { position: absolute; left: 24px; right: 24px; bottom: 30px; padding: 10px 6px; background: var(--white); border: 3px solid var(--black); rotate: -3deg; text-align: center; font: 700 50px/1 var(--hand); }
.carimbo { position: absolute; padding: 18px 30px; border: 9px solid var(--black); border-radius: 16px; font: 900 76px/.92 var(--sans); font-stretch: 70%; text-align: center; letter-spacing: .02em; color: var(--black); background: rgba(243,242,238,.55); }
.tk { position: absolute; display: flex; align-items: center; height: 150px; background: var(--white); border: 5px solid var(--black); border-radius: 18px; box-shadow: 12px 12px 0 var(--black); overflow: hidden; color: var(--black); }
.tk__num { width: 150px; height: 100%; display: grid; place-items: center; font: 900 88px/1 var(--sans); font-stretch: 70%; border-right: 5px dashed var(--black); flex: none; }
.tk__rot { padding: 0 30px; font: 800 60px/1 var(--sans); font-stretch: 78%; position: relative; flex: 1; height: 100%; display: flex; align-items: center; }
.tk.apagado { color: #c9c6bf; border-color: #c9c6bf; box-shadow: 5px 5px 0 #c9c6bf; }
.tk.apagado .tk__num { border-color: #c9c6bf; }
.trilha { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; pointer-events: none; }
.bola { position: absolute; display: grid; place-items: center; border-radius: 50%; font-weight: 900; font-stretch: 70%; }
.card4 { position: absolute; width: 400px; height: 260px; background: var(--white); border: 5px solid var(--black); border-radius: 22px; box-shadow: 12px 12px 0 var(--black); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; color: var(--black); }
.card4 b { font: 800 52px/1 var(--sans); font-stretch: 80%; }
.card4 .logo-ic { width: 110px; height: 110px; border-radius: 28px; box-shadow: 0 0 0 3px var(--black); }
.rt { position: absolute; width: 380px; height: 170px; background: var(--white); border: 5px solid var(--black); border-radius: 18px; box-shadow: 10px 10px 0 var(--black); display: flex; align-items: center; overflow: hidden; color: var(--black); }
.rt__stub { width: 90px; height: 100%; border-right: 5px dashed var(--black); display: grid; place-items: center; font: 400 44px var(--serif); font-style: italic; flex: none; }
.rt__c { padding: 0 20px; display: grid; gap: 10px; }
.rt__c b { font: 800 44px/1 var(--sans); font-stretch: 78%; white-space: nowrap; }
.rt__c .lg { display: flex; gap: 6px; }
.rt__c .logo-ic { width: 56px; height: 56px; border-radius: 14px; box-shadow: 0 0 0 2px var(--black); }
.faixa3 { position: absolute; left: 90px; width: 840px; height: 200px; perspective: 1400px; }
.faixa3 .face { position: absolute; inset: 0; background: var(--white); border: 5px solid var(--black); border-radius: 22px; box-shadow: 12px 12px 0 var(--black); display: flex; align-items: center; gap: 22px; padding: 0 28px; backface-visibility: hidden; color: var(--black); }
.faixa3 .verso { transform: rotateX(180deg); }
.faixa3 .gira { position: absolute; inset: 0; transform-style: preserve-3d; }
.faixa3 .logo-ic { width: 84px; height: 84px; border-radius: 22px; box-shadow: 0 0 0 3px var(--black); flex: none; }
.bal { padding: 10px 18px; border-radius: 18px; font: 600 40px/1.1 var(--sans); border: 3px solid var(--black); white-space: nowrap; }
.folha { position: absolute; background: var(--white); border: 5px solid var(--black); border-radius: 16px; box-shadow: 14px 14px 0 var(--black); color: var(--black); }
.lin { display: flex; align-items: center; gap: 24px; font: 700 50px/1 var(--sans); font-stretch: 85%; position: relative; }
.lin .cxv { width: 60px; height: 60px; border: 5px solid var(--black); border-radius: 12px; flex: none; position: relative; }
.faixa-fixa { position: absolute; left: 0; width: 1080px; top: 1392px; height: 76px; display: flex; align-items: center; white-space: nowrap; overflow: hidden; z-index: 40; }
.faixa-fixa span { font: 900 44px/1 var(--sans); font-stretch: 70%; text-transform: uppercase; letter-spacing: .01em; }
.tag-logo { position: absolute; left: 80px; top: 1368px; width: 230px; height: 118px; background: var(--white); border: 4px solid var(--black); border-radius: 10px; rotate: -4deg; z-index: 41; display: grid; place-items: center; box-shadow: 8px 8px 0 rgba(0,0,0,.85); }
.tag-logo::before { content: ''; position: absolute; top: -16px; left: 50%; width: 110px; height: 32px; translate: -50% 0; rotate: 6deg; background: rgba(210,206,198,.85); }
.tag-logo img { width: 170px; filter: brightness(0); }
</style>`, document.head)

// ── camadas fixas: faixa com as cidades (inverte nas cenas pretas) e etiqueta com o logo ─────
const DUR = 48.5
const FAIXA_TXT = [...CIDADES, 'Desde 2016'].map(c => `${c} <b style="opacity:.55">✱</b>`).join(' ') + ' '
const faixaP = el(`<div class="faixa-fixa" style="background:var(--black);color:var(--paper)"><span>${FAIXA_TXT.repeat(4)}</span></div>`)
const faixaC = el(`<div class="faixa-fixa" style="background:var(--paper);color:var(--black);border-block:4px solid var(--black);visibility:hidden"><span>${FAIXA_TXT.repeat(4)}</span></div>`)
;[faixaP, faixaC].forEach(f => vai($('span', f), { x: 0 }, { x: -2600, duration: DUR, ease: 'none' }, 0))
const faixaClara = (t0, t1) => { TL.set(faixaC, { visibility: 'visible' }, t0); TL.set(faixaC, { visibility: 'hidden' }, t1) }
el(`<div class="tag-logo"><img src="${LOGO_VIVA}" alt="Agência Viva"></div>`)

const titulo2 = (pai, linhas, top, px, cor) => {
  const t = el(`<div class="ti" style="top:${top}px;font-size:${px}px${cor ? ';color:' + cor : ''}">${linhas.map(l => `<span class="linha"><span>${fmt(l)}</span></span>`).join('')}</div>`, pai)
  return { t, linhas: $$('.linha > span', t) }
}
const aparece = (alvo, t, dur = 0.35) => vai(alvo, { opacity: 0 }, { opacity: 1, duration: dur, ease: 'power2.out' }, t)
const escreve = (alvo, t, dur = 0.45) => vai(alvo, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: dur, ease: 'power2.inOut' }, t)
const marca = (pai, tipo, estilo, t, cor = 'var(--black)') => {
  const d = tipo === 'ok' ? 'M8 34 L26 52 L60 12' : 'M10 10 L58 58 M58 10 L10 58'
  const s = el(`<svg class="traco" viewBox="0 0 68 68" style="${estilo};color:${cor};stroke-width:10"><path d="${d}"/></svg>`, pai)
  const p = $('path', s), L = p.getTotalLength()
  gsap.set(p, { strokeDasharray: `${L} ${L + 40}`, strokeDashoffset: L + 20 })
  vai(p, { strokeDashoffset: L + 20 }, { strokeDashoffset: 0, duration: 0.2, ease: 'power2.out' }, t)
  return s
}
const tranco = (alvo, t, f = 6) => { for (let i = 0; i < 4; i++) TL.to(alvo, { x: (i % 2 ? -f : f) * (1 - i / 4), duration: 0.04, ease: 'none', immediateRender: false }, t + i * 0.04); TL.to(alvo, { x: 0, duration: 0.04, immediateRender: false }, t + 0.16) }

// ── 1. GANCHO (0–3): a agência qualquer começa pelo pacote ────────────
{
  const T = 0, c = cena('papel grao', T, 3)
  const a = titulo2(c, ['A agência', 'qualquer começa', '*pelo pacote.*'], 300, 128)
  el('<div style="position:absolute;left:70px;right:70px;top:1180px;height:14px;background:var(--black);border-radius:7px"></div>', c)
  const caixas = ['pizzaria', 'clínica', 'loja de roupa'].map((n, i) => el(`<div class="cx" style="left:${90 + i * 285}px;top:860px"><div class="cx__faixa">PACOTE<br>PRONTO</div><div class="cx__qtd">12 posts/mês</div><div class="cx__etq">${n}</div></div>`, c))
  caixas.forEach((k, i) => vai(k, { y: -10 }, { y: 0, duration: 0.15, ease: 'power2.out' }, T + 0.1 + i * 0.15))
  const st = el('<div class="carimbo" style="left:190px;top:900px;rotate:-7deg">IGUAL PRA<br>TODO MUNDO</div>', c)
  vai(st, { scale: 1.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.14, ease: 'power4.in' }, T + 0.55)
  cue(T + 0.62, 'carimbo', 1.0)
  treme(c, T + 0.7, 6, 0.15)
  traco(c, 'sublinha', 'left:80px;top:676px;width:640px;height:40px', T + 1.2, 0.4)
  cue(T + 1.2, 'pop', 0.4)
  vai(c, { scale: 1 }, { scale: 1.03, duration: 3, ease: 'none', transformOrigin: '50% 40%' }, T)
}

// ── 2. O ATALHO (3–8): pula o diagnóstico, pula o plano, te entrega curtida ───
{
  const T = 3, c = cena('papel grao', T, 8, { eixo: 'y' })
  const a = titulo2(c, ['Pula o diagnóstico.', 'Pula o plano.', 'Te entrega *curtida*.'], 260, 88)
  const tks = ['Diagnóstico', 'Plano sob medida', 'Execução', 'Relatório'].map((r, i) =>
    el(`<div class="tk" style="left:180px;top:${620 + i * 180}px;width:700px"><div class="tk__num">0${i + 1}</div><div class="tk__rot"><span class="rot" style="position:relative;display:inline-block"><span class="ra">${r}</span><span class="rb" style="position:absolute;left:0;top:-6px;white-space:nowrap;background:var(--black);color:var(--paper);padding:8px 16px;border-radius:8px;opacity:0">PACOTE PRONTO</span></span></div></div>`, c))
  // seta do atalho: sai do 01 e entra no 03 por fora, pela direita
  const seta = el('<svg class="traco" viewBox="0 0 1080 1920" style="left:0;top:0;width:1080px;height:1920px;stroke-width:9;z-index:3"><path d="M860 600 C 1010 610, 1030 1020, 890 1055 M 915 1030 L 888 1056 L 920 1080"/></svg>', c)
  const ps = $('path', seta), Ls = ps.getTotalLength()
  gsap.set(ps, { strokeDasharray: `${Ls} ${Ls + 40}`, strokeDashoffset: Ls + 20 })
  vai(ps, { strokeDashoffset: Ls + 20 }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, T + 0.35)
  cue(T + 0.35, 'whoosh', 0.6)
  ;[0, 1].forEach(i => {
    const tt = T + [0.55, 1.3][i]
    traco($('.tk__rot', tks[i]), 'risco', 'left:20px;top:55px;width:380px;height:40px', tt, 0.25)
    TL.set(tks[i], { color: '#c9c6bf', borderColor: '#c9c6bf', boxShadow: '5px 5px 0 #c9c6bf' }, tt + 0.2)
    TL.set($('.tk__num', tks[i]), { borderRightColor: '#c9c6bf' }, tt + 0.2)
    cue(tt, 'tique', 0.8)
  })
  // "Execução" vira PACOTE PRONTO
  const rot3 = $('.rot', tks[2])
  vai(rot3, { rotateX: 0 }, { rotateX: 90, duration: 0.15, ease: 'power2.in' }, T + 1.6)
  TL.set($('.ra', rot3), { opacity: 0 }, T + 1.75); TL.set($('.rb', rot3), { opacity: 1 }, T + 1.75)
  vai(rot3, { rotateX: 90 }, { rotateX: 0, duration: 0.15, ease: 'power2.out' }, T + 1.75)
  tranco(tks[2], T + 1.9, 4)
  cue(T + 1.6, 'impacto', 0.6)
  sobeLinhas([a.linhas[1]], T + 1.1, { dur: 0.5 })
  sobeLinhas([a.linhas[2]], T + 2.2, { dur: 0.5 })
  const m = el('<div class="mao" style="left:560px;top:1235px;rotate:-4deg;font-size:58px">de curtida</div>', c)
  escreve(m, T + 2.4, 0.4)
  for (let k = 0; k < 5; k++) {
    const h = el(`<svg viewBox="0 0 24 24" style="position:absolute;left:${700 + (k % 3) * 60}px;top:1190px;width:48px;height:48px"><path d="M12 21s-7-4.6-9.5-9C.7 8.5 2.8 4.5 6.5 4.5c2 0 3.6 1.1 5.5 3 1.9-1.9 3.5-3 5.5-3 3.7 0 5.8 4 4 7.5C19 16.4 12 21 12 21z" fill="none" stroke="#0b0b0b" stroke-width="2"/></svg>`, c)
    const tt = T + (k < 3 ? 2.4 + k * 0.12 : 3.2 + (k - 3) * 0.15)
    vai(h, { y: 0, opacity: 0 }, { y: -220, opacity: 1, duration: 0.25, ease: 'power1.out' }, tt)
    vai(h, { opacity: 1 }, { opacity: 0, duration: 0.9, ease: 'power1.in' }, tt + 0.3)
    if (k < 3) cue(tt, 'pop', 0.45)
  }
  cue(T + 4.0, 'riser', 0.9)
}

// ── 3. A VIRADA (8–11.5): a Viva começa duas etapas antes ──────────────
const BOLA_G = [170, 390, 610, 830], BOLA_P = [150, 390, 630, 870]
{
  const T = 8, c = cena('preta grao', T, 11.5, { eixo: 'y' })
  faixaClara(T, 11.5)
  cue(T, 'impacto', 1.0); flash(T, '#fff', 0.35)
  const a = titulo2(c, ['A <span class="s" style="margin:0 .2em">Viva</span> começa', 'duas etapas', 'antes.'], 420, 120, 'var(--paper)')
  traco(c, 'circulo', 'left:163px;top:401px;width:300px;height:165px;color:var(--paper);stroke-width:8', T + 0.3, 0.5)
  cue(T + 0.8, 'pop', 0.5)
  const barra = el('<div style="position:absolute;left:170px;top:1074px;width:660px;height:12px;background:var(--paper)"></div>', c)
  const bolas = BOLA_G.map((x, i) => el(`<div class="bola" style="left:${x - 75}px;top:1005px;width:150px;height:150px;border:6px solid var(--paper);background:var(--black);color:var(--paper);font-size:64px">0${i + 1}</div>`, c))
  const mk = el('<div style="position:absolute;left:0;top:1180px;display:flex;flex-direction:column;align-items:center;width:190px;translate:-95px 0"><div style="width:0;height:0;border:18px solid transparent;border-bottom:24px solid var(--paper);border-top:0"></div><div style="background:var(--paper);color:var(--black);font:900 44px/1 var(--sans);font-stretch:72%;padding:10px 18px;border-radius:8px">COMEÇO</div></div>', c)
  gsap.set(mk, { x: BOLA_G[2] })
  vai(mk, { x: BOLA_G[2] }, { x: BOLA_G[1], duration: 0.25, ease: 'back.out(1.4)' }, T + 1.0); cue(T + 1.0, 'tique', 0.9)
  vai(mk, { x: BOLA_G[1] }, { x: BOLA_G[0], duration: 0.25, ease: 'back.out(1.4)' }, T + 1.5); cue(T + 1.5, 'tique', 0.9)
  TL.set(bolas[0], { background: 'var(--paper)', color: 'var(--black)' }, T + 2.0)
  const anel = el(`<div style="position:absolute;left:${BOLA_G[0] - 75}px;top:1005px;width:150px;height:150px;border-radius:50%;border:6px solid var(--paper)"></div>`, c)
  vai(anel, { scale: 1, opacity: 0.6 }, { scale: 1.6, opacity: 0, duration: 0.5, ease: 'power2.out' }, T + 2.0)
  cue(T + 2.0, 'impacto', 0.7)
  // a trilha grande sobe e vira a trilha pequena do topo
  const grupo = [barra, ...bolas]
  vai(grupo, { y: 0, scale: 1, opacity: 1 }, { y: -760, scale: 0.55, opacity: 0, duration: 0.3, ease: 'power3.in' }, T + 3.2)
}

// trilha pequena fixa (cenas 4–7): 4 bolinhas no topo
const trilha = el('<div class="trilha" style="z-index:30;visibility:hidden"></div>')
el('<div style="position:absolute;left:150px;top:284px;width:720px;height:8px;background:#c9c6bf"></div>', trilha)
const barraCheia = el('<div style="position:absolute;left:150px;top:284px;width:720px;height:8px;background:var(--black);transform-origin:0 50%"></div>', trilha)
const bolasP = BOLA_P.map((x, i) => el(`<div class="bola" style="left:${x - 38}px;top:250px;width:76px;height:76px;border:5px solid var(--black);background:var(--paper);color:var(--black);font-size:40px">0${i + 1}</div>`, trilha))
TL.set(trilha, { visibility: 'visible' }, 11.5); TL.set(trilha, { visibility: 'hidden' }, 30.5)
gsap.set(barraCheia, { scaleX: 0 })
const etapa = (i, t) => {
  vai(barraCheia, { scaleX: i ? (i - 1) / 3 : 0 }, { scaleX: i / 3, duration: 0.3, ease: 'power2.out' }, t)
  bolasP.forEach((b, k) => TL.set(b, k <= i ? { background: 'var(--black)', color: 'var(--paper)', scale: k === i ? 1.12 : 1 } : { background: 'var(--paper)', color: 'var(--black)', scale: 1 }, t))
  cue(t, 'tique', 0.6)
}
const pilula = (c, txt) => el(`<div class="etq">${txt}</div>`, c)

// ── 4. 01 · DIAGNÓSTICO (11.5–16) ──────────────────────────────────────
{
  const T = 11.5, c = cena('papel grao', T, 16)
  etapa(0, T)
  pilula(c, '01 · DIAGNÓSTICO')
  titulo2(c, ['Quem compra de você', 'e onde a venda *trava*.'], 456, 90)
  const itens = [['Instagram', logo('instagram', 'cheio')], ['Google Maps', logo('googlemaps')], ['WhatsApp', logo('whatsapp')], ['Anúncios', logo('meta') + logo('googleads')]]
  const cards = itens.map(([n, lg], i) => el(`<div class="card4" style="left:${90 + (i % 2) * 440}px;top:${720 + Math.floor(i / 2) * 360}px"><div style="display:flex;gap:10px">${lg}</div><b>${n}</b></div>`, c))
  const lupa = el('<svg viewBox="0 0 300 300" style="position:absolute;left:0;top:0;width:300px;height:300px;z-index:5;overflow:visible"><circle cx="120" cy="120" r="100" fill="rgba(201,198,191,.18)" stroke="#0b0b0b" stroke-width="14"/><path d="M192 192 L285 285" stroke="#0b0b0b" stroke-width="30" stroke-linecap="round"/></svg>', c)
  const pos = cards.map((k, i) => [90 + (i % 2) * 440 + 80, 720 + Math.floor(i / 2) * 360 + 20])
  gsap.set(lupa, { x: 1150, y: 1500 })
  cue(T + 0.2, 'whoosh', 0.4)
  let px = 1150, py = 1500
  pos.forEach(([x, y], i) => { vai(lupa, { x: px, y: py }, { x, y, duration: 0.4, ease: 'sine.inOut' }, T + 0.2 + i * 0.5); px = x; py = y })
  vai(lupa, { x: px, y: py }, { x: 1150, y: 1500, duration: 0.3, ease: 'power2.in' }, T + 2.5)
  ;['ok', 'x', 'x', 'x'].forEach((m, i) => {
    const tt = T + 0.75 + i * 0.5
    marca(cards[i], m, 'left:300px;top:14px;width:80px;height:80px', tt)
    cue(tt, m === 'ok' ? 'pop' : 'erro', m === 'ok' ? 0.6 : 0.45)
    if (m === 'x') tranco(cards[i], tt, 5)
  })
  const f = el('<div class="mao" style="left:320px;top:995px;rotate:-3deg;font-size:60px">faltam 3 peças</div>', c)
  escreve(f, T + 2.4, 0.45)
  vai(cards[0], { opacity: 1 }, { opacity: 0.55, duration: 0.3 }, T + 2.6)
}

// ── 5. 02 · PLANO SOB MEDIDA (16–21): a roda escolhe só as peças que faltam ───
{
  const T = 16, c = cena('papel grao', T, 21)
  etapa(1, T)
  pilula(c, '02 · PLANO SOB MEDIDA')
  titulo2(c, ['Só as peças que', '*a sua* empresa precisa.'], 456, 90)
  const IC = {
    site: '<svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" fill="#fff" stroke="#0b0b0b" stroke-width="2"/><path d="M2 9h20" stroke="#0b0b0b" stroke-width="2"/><circle cx="5" cy="6.5" r=".9" fill="#0b0b0b"/><circle cx="8" cy="6.5" r=".9" fill="#0b0b0b"/></svg>',
    marca: '<svg viewBox="0 0 24 24"><text x="2.5" y="17.5" font-family="Georgia,serif" font-style="italic" font-size="15" fill="#0b0b0b">Aa</text></svg>',
    video: '<svg viewBox="0 0 24 24"><rect x="2" y="6" width="14" height="12" rx="2" fill="#0b0b0b"/><path d="M16 10.5l6-3.2v9.4l-6-3.2z" fill="#0b0b0b"/><circle cx="6" cy="10" r="1.7" fill="#e33"/></svg>',
  }
  const PECAS = [['IA no WhatsApp', icone.ia, 'whatsapp'], ['Google e IAs', 'google', 'googlemaps', icone.ia], ['Audiovisual', IC.video, 'youtube'], ['Marca', IC.marca], ['Conteúdo', 'instagram', IC.video], ['Site', IC.site], ['Social media', 'instagram', 'facebook', 'tiktok'], ['Tráfego pago', 'meta', 'googleads', 'tiktok']]
  const lgs = ls => ls.filter(Boolean).map(n => n.startsWith('<svg') ? `<span class="logo-ic">${n}</span>` : logo(n, n === 'tiktok' || n === 'instagram' ? 'cheio' : '')).join('')
  const mask = el('<div style="position:absolute;left:0;top:690px;width:1080px;height:680px;overflow:hidden"></div>', c)
  const rodaEl = el('<div style="position:absolute;left:540px;top:870px;width:0;height:0"></div>', mask) // centro em y 1560 (690+870)
  PECAS.forEach(([nome, ...ls], i) => {
    const g = el(`<div style="position:absolute;left:0;top:0;width:0;height:0;transform:rotate(${i * 45}deg)"></div>`, rodaEl)
    el(`<div class="rt" style="left:-190px;top:-645px"><div class="rt__stub">${String(i + 1).padStart(2, '0')}</div><div class="rt__c"><b>${nome}</b><div class="lg">${lgs(ls)}</div></div></div>`, g)
  })
  gsap.set(rodaEl, { rotate: 585 })
  vai(rodaEl, { rotate: 585 }, { rotate: 360, duration: 1.4, ease: 'power3.out' }, T + 0.2)
  cue(T + 0.2, 'whoosh', 0.5)
  ;[0.1, 0.22, 0.36, 0.52, 0.72, 0.96, 1.25, 1.42].forEach(d => cue(T + 0.2 + d, 'tique', 0.55))
  // escolhidas: IA no WhatsApp (topo), Tráfego pago (esquerda), Google e IAs (direita)
  const escolhidas = [0, 7, 1].map(i => $$('.rt', rodaEl)[i])
  escolhidas.forEach((e, k) => { vai(e, { y: 0, scale: 1 }, { y: -30, scale: 1.06, duration: 0.2, ease: 'back.out(2)' }, T + 1.65 + k * 0.1); cue(T + 1.65 + k * 0.1, 'pop', 0.55) })
  $$('.rt', rodaEl).forEach((e, i) => { if (![0, 7, 1].includes(i)) vai(e, { opacity: 1 }, { opacity: 0.3, duration: 0.25 }, T + 1.7) })
  vai(rodaEl, { y: 0 }, { y: 900, duration: 0.45, ease: 'power2.in' }, T + 2.0)
  cue(T + 2.0, 'whoosh_desce', 0.6)
  const plano = el(`<div class="folha" style="left:150px;top:720px;width:780px;height:620px;background:var(--paper-2);rotate:-1deg"><div style="font:900 56px/1 var(--sans);font-stretch:72%;padding:30px 40px 0">SEU PLANO</div></div>`, c)
  vai(plano, { y: 1300 }, { y: 0, duration: 0.45, ease: 'power3.out' }, T + 2.0)
  ;[['IA no WhatsApp', [icone.ia, 'whatsapp']], ['Tráfego pago', ['meta', 'googleads', 'tiktok']], ['Google e IAs', ['google', 'googlemaps', icone.ia]]].forEach(([n, ls], k) => {
    const e = el(`<div class="rt" style="left:${70 + (k % 2) * 30}px;top:${110 + k * 165}px;width:640px;rotate:${[-2, 1.5, -1][k]}deg"><div class="rt__stub">${['01', '08', '02'][k]}</div><div class="rt__c" style="grid-template-columns:auto auto;align-items:center;gap:26px"><b>${n}</b><div class="lg">${lgs(ls)}</div></div></div>`, plano)
    vai(e, { y: -140, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'back.out(1.8)' }, T + 2.45 + k * 0.15)
    cue(T + 2.45 + k * 0.15, 'pop', 0.5)
  })
}

// ── 6. 03 · MÃO NA MASSA (21–26): as peças escolhidas viram e funcionam ─────
{
  const T = 21, c = cena('papel grao', T, 26)
  etapa(2, T)
  pilula(c, '03 · MÃO NA MASSA')
  titulo2(c, ['Tudo rodando', '*no ritmo certo.*'], 456, 96)
  const face = (html, verso) => `<div class="face${verso ? ' verso' : ''}">${html}</div>`
  const FR = [['IA no WhatsApp', [icone.ia, 'whatsapp']], ['Tráfego pago', ['meta', 'googleads', 'tiktok']], ['Google e IAs', ['google', 'googlemaps', icone.ia]]]
  const lgs = ls => ls.map(n => n.startsWith('<svg') ? `<span class="logo-ic">${n}</span>` : logo(n, n === 'tiktok' ? 'cheio' : '')).join('')
  const VERSO = [
    `${lgs([icone.ia, 'whatsapp'])}<div style="display:grid;gap:10px;margin-left:auto;justify-items:end"><span class="bal b1" style="background:#fff">Tem horário sábado? <small style="font-size:30px;color:#55524d">23:47</small></span><span class="bal b2" style="background:#d9fdd3">Tem sim! 9h ou 10h30? <b style="background:#0b0b0b;color:#f3f2ee;border-radius:8px;padding:2px 10px;font-size:30px">IA</b></span></div>`,
    `${lgs(['meta', 'googleads'])}<b style="font:800 44px/1.05 var(--sans);font-stretch:80%;flex:1">Anúncio que faz o<br>WhatsApp tocar</b><span class="wa-vib">${logo('whatsapp')}</span>`,
    `${lgs(['google'])}<div style="flex:1;display:grid;gap:6px"><b style="display:block;font:900 54px/1 var(--sans);font-stretch:72%">Sua empresa</b><span style="font:600 38px/1 var(--sans)"><span class="est" style="color:#fbbc04;letter-spacing:2px;display:inline-block">★★★★★</span> · aberto agora</span><span class="ia-ind" style="font:700 38px/1 var(--sans);font-stretch:85%;display:flex;align-items:center;gap:10px"><b style="background:#0b0b0b;color:#f3f2ee;border-radius:8px;padding:4px 10px;font-size:30px">IA</b>“recomendo a Sua empresa”</span></div>`,
  ]
  FR.forEach(([n, ls], k) => {
    const f = el(`<div class="faixa3" style="top:${700 + k * 220}px"><div class="gira">${face(`<div class="rt__stub" style="border-right:5px dashed #0b0b0b;height:100%;margin-left:-28px;width:110px">${['01', '08', '02'][k]}</div><b style="font:800 60px/1 var(--sans);font-stretch:78%;flex:1">${n}</b>${lgs(ls)}`)}${face(VERSO[k], true)}</div></div>`, c)
    const g = $('.gira', f), tt = T + [0.25, 1.4, 2.2][k]
    vai(g, { rotateX: 0 }, { rotateX: 180, duration: 0.35, ease: 'power2.inOut' }, tt)
    cue(tt, 'whoosh', 0.4)
    if (k === 0) {
      vai($('.b1', f), { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.2, ease: 'back.out(2)' }, T + 0.45); cue(T + 0.45, 'pop', 0.6)
      cue(T + 0.7, 'digita', 0.6)
      vai($('.b2', f), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2 }, T + 1.0); cue(T + 1.0, 'ding', 0.8)
    }
    if (k === 1) { tranco($('.wa-vib', f), T + 1.9, 6); cue(T + 1.9, 'vibra', 0.9) }
    if (k === 2) { escreve($('.est', f), T + 2.4, 0.3); for (let e = 0; e < 5; e++) cue(T + 2.4 + e * 0.06, 'tique', 0.4); escreve($('.ia-ind', f), T + 2.9, 0.4); cue(T + 2.9, 'digita', 0.5); cue(T + 3.35, 'ding', 0.6) }
  })
}

// ── 7. 04 · NÚMERO NA MESA (26–30.5): relatório claro e ajuste todo mês ─────
{
  const T = 26, c = cena('papel grao', T, 30.5)
  etapa(3, T)
  pilula(c, '04 · NÚMERO NA MESA')
  titulo2(c, ['Relatório claro.', 'E ajuste <span class="s" style="margin-left:.25em">todo mês.</span>'], 456, 96)
  const folha = el('<div class="folha" style="left:130px;top:700px;width:760px;height:600px;rotate:-1.5deg;padding:40px 44px"><div style="font:900 56px/1 var(--sans);font-stretch:72%;border-bottom:4px solid var(--black);padding-bottom:16px;margin-bottom:40px">RELATÓRIO DO MÊS</div></div>', c)
  const LIN = ['Quantos contatos vieram', 'Quanto custou cada um', 'O que ajustar']
  LIN.forEach((t, i) => {
    const l = el(`<div class="lin" style="margin-bottom:46px"><span class="cxv"></span><span class="txl" style="position:relative;padding:4px 8px">${t}</span></div>`, folha)
    const hl = el('<i style="position:absolute;inset:6px 0;background:var(--paper-2);z-index:-1;transform-origin:0 50%"></i>', $('.txl', l))
    vai(hl, { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: 'power2.out' }, T + 0.3 + i * 0.3)
    marca($('.cxv', l), 'ok', 'left:-6px;top:-10px;width:70px;height:70px', T + 0.3 + i * 0.3)
    cue(T + 0.3 + i * 0.3, 'pop', 0.6)
  })
  const m = el('<div class="mao" style="left:300px;top:1190px;rotate:-3deg;font-size:58px">não funcionou? a gente troca.</div>', c)
  escreve(m, T + 1.1, 0.4)
  traco(c, 'circulo', 'left:366px;top:527px;width:455px;height:150px', T + 2.4, 0.6)
  cue(T + 2.4, 'whoosh', 0.5)
  // fecha o ciclo: 4 bolinhas cheias e a barra volta pro 01
  TL.set(bolasP, { background: 'var(--black)', color: 'var(--paper)', scale: 1 }, T + 3.6)
  vai(bolasP[0], { scale: 1 }, { scale: 1.25, duration: 0.2, yoyo: true, repeat: 1, ease: 'sine.inOut' }, T + 3.8)
  cue(T + 3.6, 'tique', 0.7); cue(T + 3.8, 'tique', 0.7)
}

// ── 8. RESULTADO (30.5–35.5): é pra isso que serve o método ─────────────
{
  const T = 30.5, c = cena('preta grao', T, 35.5)
  faixaClara(T, 35.5)
  titulo2(c, ['É pra isso que', 'serve o *método*.'], 260, 96, 'var(--paper)')
  el(`<div style="position:absolute;left:90px;top:500px;display:flex;align-items:center;gap:14px;font:600 44px var(--sans);color:#c9c6bf"><svg viewBox="0 0 24 24" width="40" height="40"><rect x="5" y="10" width="14" height="10" rx="2" fill="#c9c6bf"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#c9c6bf" stroke-width="2.2"/></svg>08:12 · terça-feira · Barreiras</div>`, c)
  const ns = [
    [{ logo: 'whatsapp', titulo: 'Cliente novo', texto: 'Oi! Vim pelo anúncio, queria um orçamento.' }, 575],
    [{ logo: 'googlemaps', titulo: 'Perfil da Empresa', quando: '2 min', texto: 'Alguém ligou pra você pelo Google Maps.' }, 835],
    [{ logo: 'whatsapp', titulo: 'Cliente novo', quando: 'agora', texto: 'Fechado! Me manda a chave do Pix?' }, 1080],
  ]
  ns.forEach(([n, y], i) => {
    const e = notifGrande(c, n, `left:90px;top:${y}px;width:840px`)
    const tt = T + 0.4 + i * 0.8
    vai(e, { y: -60, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.6)' }, tt)
    tranco(e, tt + 0.35, 3)
    cue(tt, 'vibra', 0.9); cue(tt + 0.05, 'ding', 0.85)
  })
  cue(T + 2.8, 'caixa', 0.5)
  el('<div style="position:absolute;left:90px;top:1300px;font:600 36px var(--sans);color:#8a8680">Ilustração.</div>', c)
  traco(c, 'sublinha', 'left:420px;top:440px;width:420px;height:36px;color:var(--paper)', T + 3.2, 0.4)
}

// ── 9. PROVA DE ESTRADA (35.5–39.5): desde 2016, em 8 cidades ────────────
{
  const T = 35.5, c = cena('papel grao', T, 39.5, { eixo: 'y' })
  titulo2(c, ['Desde 2016', '<span style="font-size:.74em">em *8 cidades* do Oeste.</span>'], 250, 124)
  el('<div style="position:absolute;left:90px;top:480px;font:700 46px var(--sans);font-stretch:85%;color:var(--muted)">Do pequeno comércio à grande empresa.</div>', c)
  const { m, pinos } = mapaOeste(c, 'left:90px;top:570px;width:700px;height:560px;box-shadow:14px 14px 0 var(--black);border-color:var(--black)')
  $$('text:not(.main):not(.hand-t)', m).forEach(t => gsap.set(t, { opacity: 0 }))
  Object.entries(pinos).forEach(([slug, a], i) => {
    if (slug === 'barreiras') return
    const p = $('.pin', a)
    vai(a, { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(2)' }, T + 0.2 + i * 0.12)
    cue(T + 0.2 + i * 0.12, 'pop', 0.45)
  })
  const { s, anel } = seloGrande(c, 'left:620px;top:1010px;width:300px;height:300px')
  vai(s, { scale: 2.2, rotate: -25, opacity: 0 }, { scale: 1, rotate: -8, opacity: 1, duration: 0.18, ease: 'power4.in' }, T + 1.6)
  cue(T + 1.62, 'carimbo', 1.0); cue(T + 1.62, 'impacto', 0.5)
  treme(c, T + 1.8, 6, 0.15)
  vai(anel, { rotate: 0 }, { rotate: 100, duration: 4, ease: 'none' }, T)
  traco(c, 'sublinha', 'left:210px;top:448px;width:330px;height:30px', T + 2.0, 0.35)
}

// ── 10. A MISSÃO (39.5–43.5): pacote pronto? não. A Viva constrói o seu case ──
{
  const T = 39.5, c = cena('papel2 grao', T, 43.5)
  el('<div style="position:absolute;left:0;top:900px;width:1080px;height:1020px;background:var(--black)"></div>', c)
  el('<div style="position:absolute;left:90px;top:290px;font:700 56px var(--sans);color:var(--muted)">Agência qualquer:</div>', c)
  el('<div class="ti" style="top:370px;font-size:124px">pacote pronto.</div>', c)
  const mini = ['', '', ''].map((_, i) => el(`<div class="cx" style="left:${250 + i * 210}px;top:560px;width:180px;height:200px;box-shadow:8px 8px 0 var(--black)"><div class="cx__faixa" style="font-size:28px">PACOTE</div></div>`, c))
  traco(c, 'risco', 'left:80px;top:410px;width:760px;height:60px;stroke-width:12', T + 0.3, 0.3)
  cue(T + 0.3, 'erro', 0.4)
  mini.forEach(k => vai(k, { opacity: 1 }, { opacity: 0.45, duration: 0.3 }, T + 0.5))
  el('<div class="ti" style="top:960px;font-size:104px;color:var(--paper)">A Viva constrói</div>', c)
  const b = titulo2(c, ['o *seu case.*'], 1080, 140, 'var(--paper)')
  sobeLinhas(b.linhas, T + 0.5, { dur: 0.55 })
  cue(T + 0.5, 'impacto', 0.9)
  traco(c, 'sublinha', 'left:220px;top:1255px;width:520px;height:40px;color:var(--paper)', T + 1.4, 0.4)
  cue(T + 1.4, 'pop', 0.5)
}

// ── 11. CHAMADA (43.5–48.5): sua empresa viva no celular de quem compra ─────
{
  const T = 43.5, c = cena('papel grao', T, DUR, { eixo: 'y' })
  logoViva(c, 'left:300px;top:250px;width:480px')
  el('<div style="position:absolute;left:90px;right:90px;top:492px;text-align:center;font:600 44px var(--sans);color:var(--muted)">Barreiras - BA · desde 2016</div>', c)
  titulo2(c, ['Sua empresa', '<span class="s" style="margin:0 .3em 0 .12em">viva</span> no celular', 'de quem compra.'], 590, 104)
  traco(c, 'circulo', 'left:76px;top:678px;width:250px;height:140px;stroke-width:8', T + 0.3, 0.6)
  cue(T + 0.9, 'pop', 0.5)
  const btn = el(`<div class="botao" style="left:130px;top:985px;width:780px;height:150px;padding:0;box-shadow:12px 12px 0 #55524d">${logo('whatsapp')}Chamar no WhatsApp</div>`, c)
  gsap.set($('.logo-ic', btn), { width: 84, height: 84 })
  vai($('.logo-ic', btn), { y: 0 }, { y: -8, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out' }, T + 2.5)
  cue(T + 2.5, 'pop', 0.4)
  const m = el('<div class="mao" style="left:330px;top:1165px;rotate:-3deg;font-size:64px">tá no link da bio</div>', c)
  escreve(m, T + 1.0, 0.5)
  const seta = el('<svg class="traco" viewBox="0 0 1080 1920" style="left:0;top:0;width:1080px;height:1920px;stroke-width:8"><path d="M320 1215 C 220 1230, 150 1280, 135 1345 M 110 1318 L 134 1348 L 162 1322"/></svg>', c)
  const ps = $('path', seta), Ls = ps.getTotalLength()
  gsap.set(ps, { strokeDasharray: `${Ls} ${Ls + 40}`, strokeDashoffset: Ls + 20 })
  vai(ps, { strokeDashoffset: Ls + 20 }, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.inOut' }, T + 1.4)
  cue(T + 1.4, 'whoosh', 0.3)
  cue(T + 2.5, 'impacto', 0.6)
}

pronto(DUR, { bpm: 120, drop: 8.0, calmo: [[30.5, 35.5]], fim: 46.0 })
