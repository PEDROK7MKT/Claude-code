// Reels da Viva: "de agência qualquer a máquina de vendas". 1080x1920, ~60 s, 120 BPM (1 tempo = 0,5 s).
// Zona segura: textos entre x 80–930 e y 240–1470.

// ── 1. GANCHO (0–4): paga agência todo mês… e as vendas? ─────────────
{
  const c = cena('preta grao', 0, 4)
  const a = titulo(c, ['Paga agência', 'todo mês.'], { cls: 'l', top: 260 })
  sobeLinhas(a.linhas, 0.1)
  cue(0, 'impacto')
  const b = el(`<div class="obj" style="left:150px;top:580px;width:720px;padding:36px 40px;border-radius:14px;rotate:-3deg">
    <div style="display:flex;justify-content:space-between;font:800 28px var(--sans);letter-spacing:.14em;color:var(--muted)"><span>BOLETO</span><span>AGÊNCIA QUALQUER</span></div>
    <div style="font:900 64px/1 var(--sans);font-stretch:72%;margin:18px 0 8px">Mensalidade de marketing</div>
    <div style="display:flex;justify-content:space-between;align-items:end;margin-top:22px"><span style="font:600 28px var(--sans);color:var(--muted)">vence todo dia 10</span><b style="font:900 58px var(--sans);font-stretch:80%">R$ <span class="v">0</span></b></div>
    <div class="pago" style="position:absolute;right:40px;top:120px;padding:8px 26px;border:7px solid var(--black);border-radius:12px;font:900 76px/1 var(--sans);font-stretch:70%;letter-spacing:.06em;rotate:-12deg">PAGO</div></div>`, c)
  pula(b, 0.55, { rot: -3 })
  conta($('.v', b), 0, 1500, 0.6, 0.7, n => Math.round(n).toLocaleString('pt-BR') + ',00')
  carimba($('.pago', b), 1.3, -12)
  const d = titulo(c, ['E as vendas,', '*cadê?*'], { cls: 'xl', top: 1040 })
  sobeLinhas(d.linhas, 1.9)
  cue(1.9, 'whoosh', 0.6)
  traco(c, 'circulo', 'left:50px;top:1190px;width:460px;height:200px;color:var(--paper)', 2.5, 0.55)
  vai(c, { scale: 1 }, { scale: 1.05, duration: 4, ease: 'none' }, 0)
}

// ── 2. RECIBO DA AGÊNCIA QUALQUER (4–8) ────────────────────────────────
{
  const c = cena('preta grao', 4, 8)
  const a = titulo(c, ['O que você', '*recebe*:'], { cls: 'l', top: 250 })
  sobeLinhas(a.linhas, 4.05)
  const r = recibo(c, [['12 posts no mês', '✓'], ['Relatório de curtidas', '✓'], ['Stories de "bom dia"', '✓'], ['Vendas novas', 'zero', 'zero']], { top: 590 })
  pula(r, 4.2, { rot: 2, y: 140 })
  $$('.lr', r).forEach((l, i) => { vai(l, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3 }, 4.7 + i * 0.42); cue(4.7 + i * 0.42, i === 3 ? 'erro' : 'tique', i === 3 ? 0.9 : 1) })
  const z = $('.zero', r); gsap.set(z, { fontSize: 44 })
  traco(c, 'circulo', 'left:560px;top:1060px;width:330px;height:130px;color:#e0e0e0', 6.2, 0.4)
  const m = el('<div class="mao" style="left:120px;top:1300px;rotate:-4deg;color:var(--paper)">"culpa do algoritmo…"</div>', c)
  pula(m, 6.5, { y: 30, rot: -4 })
  treme(r, 6.35, 12)
}

// ── 3. PACOTE PRONTO, IGUAL PRA TODO MUNDO (8–11.5) ────────────────────
{
  const c = cena('preta grao', 8, 11.5)
  const a = titulo(c, ['Pacote pronto.', 'Igual pra', '*todo mundo*.'], { cls: 'l', top: 250 })
  sobeLinhas(a.linhas, 8.05)
  ;['Pizzaria', 'Clínica', 'Loja de roupa'].forEach((n, i) => {
    const k = el(`<div class="obj" style="left:${100 + i * 30}px;top:${760 + i * 190}px;width:730px;padding:28px 32px;display:flex;justify-content:space-between;align-items:center;gap:20px;rotate:${[-3, 2, -1][i]}deg">
      <b style="font:900 58px var(--sans);font-stretch:72%;white-space:nowrap">${n}</b><span class="pill" style="font-size:28px;white-space:nowrap">PACOTE BÁSICO</span></div>`, c)
    pula(k, 8.7 + i * 0.35, { rot: [-3, 2, -1][i] }); cue(8.7 + i * 0.35, 'pop')
  })
  const m = el('<div class="mao" style="left:560px;top:1480px;rotate:-5deg;color:var(--paper);font-size:56px">ninguém te perguntou nada</div>', c)
  gsap.set(m, { top: 1360, left: 250 })
  pula(m, 10.2, { y: 20, rot: -5 })
}

// ── 4. SEM DIAGNÓSTICO É CHUTE (11.5–14.5) ─────────────────────────────
{
  const c = cena('preta grao', 11.5, 14.5)
  const a = titulo(c, ['Marketing sem', '*diagnóstico*', 'é chute', 'com seu', 'dinheiro.'], { cls: 'xl', top: 300 })
  sobeLinhas(a.linhas, 11.55, { stagger: 0.12 })
  cue(11.5, 'glitch', 0.8)
  // notas de dinheiro caindo ao fundo
  for (let i = 0; i < 9; i++) {
    const n = el(`<div style="position:absolute;left:${80 + (i * 113) % 860}px;top:-200px;width:170px;height:84px;border:4px solid #3a3a3a;border-radius:10px;display:grid;place-items:center;font:900 40px var(--sans);color:#3a3a3a;z-index:0">R$</div>`, c)
    vai(n, { y: 0, rotate: (i % 2 ? 1 : -1) * 20 }, { y: 2300, rotate: (i % 2 ? -1 : 1) * 160, duration: 2.6, ease: 'power1.in' }, 11.6 + (i % 5) * 0.18)
  }
  a.t.style.zIndex = 2
  cue(12.8, 'riser', 0.9)
  treme(a.t, 13.2, 10, 0.3)
}

// ── 5. VIRADA: VIVA! (14.5–17.5) ───────────────────────────────────────
{
  const c = cena('papel grao', 14.5, 17.5)
  cortina(14.5, { cor: 'var(--black)', dur: 0.5 })
  cue(14.5, 'impacto', 1.1)
  flash(14.5, '#fff', 0.6)
  const lg = logoViva(c, 'left:140px;top:330px;width:800px')
  vai(lg, { scale: 1.8, opacity: 0, rotate: -6 }, { scale: 1, opacity: 1, rotate: -2, duration: 0.5, ease: 'back.out(1.8)' }, 14.6)
  cue(14.7, 'carimbo')
  const a = titulo(c, ['Na Viva, a gente', '*não chuta*.'], { cls: 'l', top: 900 })
  sobeLinhas(a.linhas, 15.3)
  traco(c, 'sublinha', 'left:80px;top:1175px;width:560px;height:40px', 16.1, 0.4)
  const { s, anel } = selo(c, 'left:700px;top:1170px;width:250px;height:250px')
  pula(s, 15.6, { y: 60 })
  vai(anel, { rotate: 0 }, { rotate: 120, duration: 3, ease: 'none' }, 14.5)
}

// ── (prévia) FIM: LOGO + CHAMADA (17.5–25) ─────────────────────────────
{
  const c = cena('preta grao', 17.5, 21)
  cortina(17.5, { cor: 'var(--paper)', dur: 0.5 })
  const lg = logoViva(c, 'left:120px;top:520px;width:840px', { preto: false })
  vai(lg, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.6)' }, 17.6)
  cue(17.6, 'impacto')
  const a = titulo(c, ['Máquina de vendas', 'e *crescimento*.'], { cls: 'm', top: 1050, align: 'center', left: 80 })
  a.t.style.right = '80px'
  sobeLinhas(a.linhas, 18.3)
  const { s, anel } = selo(c, 'left:780px;top:300px;width:220px;height:220px')
  pula(s, 18.6, { y: 40 })
  vai(anel, { rotate: 0 }, { rotate: 150, duration: 3.5, ease: 'none' }, 17.5)
  faixa(c, CIDADES, { top: 1560, rot: -3, clara: true, t0: 17.5, t1: 21 })
}
{
  const c = cena('papel grao', 21, 25)
  cortina(21, { cor: 'var(--black)', dur: 0.5 })
  const a = titulo(c, ['Chega de', 'marketing', 'no *chute*.'], { cls: 'xl', top: 260 })
  sobeLinhas(a.linhas, 21.05)
  const btn = el(`<div style="position:absolute;left:110px;top:980px;width:760px;padding:40px 0;border-radius:99px;background:var(--wa);border:5px solid var(--black);box-shadow:12px 12px 0 var(--black);display:flex;align-items:center;justify-content:center;gap:22px;color:#fff;font:900 56px var(--sans);font-stretch:80%">${LOGOS.whatsapp.replace('fill="#25d366"', 'fill="#fff"').replace('<svg', '<svg width="70" height="70"')} Quero meu diagnóstico</div>`, c)
  pula(btn, 22.2, { y: 120 }); cue(22.2, 'pop')
  vai(btn, { scale: 1 }, { scale: 1.04, duration: 0.25, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 23)
  const h = el('<div style="position:absolute;left:110px;right:150px;top:1190px;text-align:center;font:800 44px var(--sans)">@agenciaviva_ · link na bio</div>', c)
  pula(h, 22.6, { y: 30 })
  const m = el('<div class="mao" style="left:560px;top:880px;rotate:-6deg;font-size:60px">chama agora!</div>', c)
  pula(m, 23.0, { y: 20, rot: -6 })
  traco(c, 'seta', 'left:470px;top:860px;width:90px;height:70px;rotate:30deg', 23.1, 0.35)
  logoViva(c, 'left:380px;top:1330px;width:320px')
}

pronto(25, { bpm: 120, drop: 14.5, calmo: [], fim: 24 })
