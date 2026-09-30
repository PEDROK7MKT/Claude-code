// Reels da Viva: "de agência qualquer a máquina de vendas". 1080x1920, ~62 s, 120 BPM (1 tempo = 0,5 s).
// Zona segura: textos entre x 80–930 e y 240–1470.
// Roteiro: dor (0–14.5) → virada Viva (14.5) → diagnóstico e comparação (17–25) → a máquina e as 6 peças (25–44.5)
//          → notificações (44.5) → pequeno/médio/grande no Oeste (49.5) → missão: case de sucesso (53) → logo (56.5) → chamada (59)

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

// ── 2. O QUE A AGÊNCIA QUALQUER ENTREGA (4–8) ──────────────────────────
{
  const c = cena('preta grao', 4, 8)
  const a = titulo(c, ['O que você', '*recebe*:'], { cls: 'l', top: 250 })
  sobeLinhas(a.linhas, 4.05)
  const r = recibo(c, [['12 posts no mês', '✓'], ['Relatório de curtidas', '✓'], ['Stories de "bom dia"', '✓'], ['Vendas novas', '<span class="zero" style="position:relative;font-size:48px">zero</span>']], { top: 590 })
  pula(r, 4.2, { rot: 2, y: 140 })
  $$('.lr', r).forEach((l, i) => { vai(l, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.3 }, 4.7 + i * 0.42); cue(4.7 + i * 0.42, i === 3 ? 'erro' : 'tique', i === 3 ? 0.9 : 1) })
  traco($('.zero', r), 'circulo', 'left:-40px;top:-28px;width:190px;height:110px;color:var(--black);stroke-width:6', 6.2, 0.4)
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
  const m = el('<div class="mao" style="left:250px;top:1360px;rotate:-5deg;color:var(--paper);font-size:56px">ninguém te perguntou nada</div>', c)
  pula(m, 10.2, { y: 20, rot: -5 })
}

// ── 4. SEM DIAGNÓSTICO É CHUTE (11.5–14.5) ─────────────────────────────
{
  const c = cena('preta grao', 11.5, 14.5)
  const a = titulo(c, ['Marketing sem', '*diagnóstico*', 'é chute', 'com seu', 'dinheiro.'], { cls: 'xl', top: 300 })
  sobeLinhas(a.linhas, 11.55, { stagger: 0.12 })
  cue(11.5, 'glitch', 0.8)
  for (let i = 0; i < 9; i++) {
    const n = el(`<div style="position:absolute;left:${80 + (i * 113) % 860}px;top:-200px;width:170px;height:84px;border:4px solid #3a3a3a;border-radius:10px;display:grid;place-items:center;font:900 40px var(--sans);color:#3a3a3a;z-index:0">R$</div>`, c)
    vai(n, { y: 0, rotate: (i % 2 ? 1 : -1) * 20 }, { y: 2300, rotate: (i % 2 ? -1 : 1) * 160, duration: 2.6, ease: 'power1.in' }, 11.6 + (i % 5) * 0.18)
  }
  a.t.style.zIndex = 2
  cue(12.8, 'riser', 0.9)
  treme(a.t, 13.2, 10, 0.3)
}

// ── 5. VIRADA: VIVA! (14.5–17) ─────────────────────────────────────────
{
  const c = cena('papel grao', 14.5, 17)
  cortina(14.5, { cor: 'var(--black)', dur: 0.5 })
  cue(14.5, 'impacto', 1.1)
  flash(14.5, '#fff', 0.6)
  const lg = logoViva(c, 'left:140px;top:330px;width:800px')
  vai(lg, { scale: 1.8, opacity: 0, rotate: -6 }, { scale: 1, opacity: 1, rotate: -2, duration: 0.5, ease: 'back.out(1.8)' }, 14.6)
  cue(14.7, 'carimbo')
  const a = titulo(c, ['Na Viva, a gente', '*não chuta*.'], { cls: 'l', top: 900 })
  sobeLinhas(a.linhas, 15.2)
  traco(c, 'sublinha', 'left:80px;top:1175px;width:560px;height:40px', 15.9, 0.4)
  const { s, anel } = selo(c, 'left:700px;top:1170px;width:230px;height:230px')
  pula(s, 15.5, { y: 60 })
  vai(anel, { rotate: 0 }, { rotate: 100, duration: 2.5, ease: 'none' }, 14.5)
}

// ── 6. DIAGNÓSTICO PERSONALIZADO (17–20.5) ─────────────────────────────
{
  const c = cena('papel grao', 17, 20.5)
  const a = titulo(c, ['Começa pelo', '*diagnóstico*.'], { cls: 'l', top: 250 })
  sobeLinhas(a.linhas, 17.05)
  cue(17, 'whoosh', 0.7)
  const p = prancheta(c, ['Quem compra de você', 'Onde a venda trava', 'Sua cidade e seu concorrente', 'Quanto dá pra investir'], { top: 640, left: 130, largura: 790 })
  pula(p, 17.3, { rot: -1.5, y: 160 })
  $$('.ok', p).forEach((o, i) => { gsap.set(o, { scale: 0 }); vai(o, { scale: 0 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, 18.0 + i * 0.42); cue(18.0 + i * 0.42, 'tique') })
  const m = el('<div class="mao" style="left:470px;top:1330px;rotate:-4deg;font-size:58px">a gente escuta antes</div>', c)
  pula(m, 19.7, { y: 20, rot: -4 })
}

// ── 7. O PROCESSO: AGÊNCIA QUALQUER × VIVA (20.5–25) ───────────────────
{
  const c = cena('papel grao', 20.5, 25)
  const a = titulo(c, ['Dor de cabeça', 'ou *plano*?'], { cls: 'l', top: 250 })
  sobeLinhas(a.linhas, 20.55)
  cue(20.5, 'whoosh', 0.7)
  const esq = el('<div style="position:absolute;left:0;top:560px;width:540px;height:960px;background:var(--black);color:var(--paper)"></div>', c)
  const dir = el('<div style="position:absolute;left:540px;top:560px;width:540px;height:960px;background:var(--white);border-top:4px solid var(--black)"></div>', c)
  vai(esq, { xPercent: -100 }, { xPercent: 0, duration: 0.45, ease: 'power3.out' }, 20.7)
  vai(dir, { xPercent: 100 }, { xPercent: 0, duration: 0.45, ease: 'power3.out' }, 20.7)
  el('<div style="position:absolute;left:60px;top:44px;font:800 28px var(--sans);letter-spacing:.14em;color:#aaa">AGÊNCIA QUALQUER</div>', esq)
  logoViva(dir, 'left:50px;top:30px;width:190px')
  const linhas = [['Pacote pronto', 'Diagnóstico'], ['Post pra cumprir tabela', 'Plano com meta de venda'], ['Some no fim do mês', 'Relatório e ajuste todo mês']]
  linhas.forEach(([x, v], i) => {
    const y = 150 + i * 250
    const lx = el(`<div style="position:absolute;left:60px;top:${y}px;width:440px;display:flex;gap:18px;font:800 44px/1.08 var(--sans);font-stretch:80%"><span style="flex:none;width:52px;height:52px;border-radius:50%;background:#e23b2e;color:#fff;display:grid;place-items:center;padding:12px">${icone.x}</span><span style="opacity:.9">${x}</span></div>`, esq)
    const lv = el(`<div style="position:absolute;left:50px;top:${y}px;width:340px;display:flex;gap:18px;font:900 44px/1.08 var(--sans);font-stretch:80%"><span style="flex:none;width:52px;height:52px;border-radius:50%;background:var(--black);color:#fff;display:grid;place-items:center;padding:12px">${icone.check}</span><span>${v}</span></div>`, dir)
    pula(lx, 21.3 + i * 0.9, { y: 30 }); cue(21.3 + i * 0.9, 'erro', 0.45)
    pula(lv, 21.7 + i * 0.9, { y: 30 }); cue(21.7 + i * 0.9, 'ding', 0.5)
  })
}

// ── 8. NÃO É SÓ SOCIAL MEDIA: É UMA MÁQUINA (25–27) ────────────────────
{
  const c = cena('preta grao', 25, 27)
  cortina(25, { cor: 'var(--paper)', dur: 0.4 })
  const g1 = engrenagem(c, { r: 330, estilo: 'left:-160px;top:1120px', cor: '#2c2c2c', larg: 14 })
  const g2 = engrenagem(c, { r: 220, dentes: 10, estilo: 'left:640px;top:1000px', cor: '#2c2c2c', larg: 14 })
  vai(g1, { rotate: 0 }, { rotate: 60, duration: 2, ease: 'none' }, 25)
  vai(g2, { rotate: 0 }, { rotate: -84, duration: 2, ease: 'none' }, 25)
  const a = titulo(c, ['Não é só', '*social media*.'], { cls: 'm', top: 280 })
  sobeLinhas(a.linhas, 25.05)
  traco(c, 'risco', 'left:70px;top:420px;width:600px;height:60px;color:#e23b2e', 25.5, 0.25)
  const b = titulo(c, ['É uma', '*máquina*', 'de vendas.'], { cls: 'xl', top: 560 })
  sobeLinhas(b.linhas, 25.75, { stagger: 0.1 })
  cue(25.75, 'impacto', 0.8)
  faixa(c, ['IA no WhatsApp', 'Tráfego pago', 'Site', 'Branding', 'Audiovisual', 'Google e IAs'], { top: 1210, rot: -4, clara: true, vel: 260, t0: 25, t1: 27 })
}

// ── 9. PEÇA 1: IA NO WHATSAPP (27–30) ──────────────────────────────────
{
  const c = cena('papel grao', 27, 30)
  peca(c, 1, 'IA no WhatsApp', ['Responde até', 'de *madrugada*.'], 27.05)
  const cel = celular(c, { left: 110, top: 560, tela: 'chat' })
  gsap.set(cel, { scale: 0.74, transformOrigin: '0 0' })
  const corpo = chat(cel, { nome: 'Sua Empresa', status: 'online · atendimento com IA' })
  pula(cel, 27.2, { y: 200 })
  const b1 = bolha(corpo, 'in', 'Oi! Vocês entregam em Luís Eduardo?', '23:47')
  pula(b1, 27.8, { y: 30 }); cue(27.8, 'pop')
  const dg = el('<div class="digitando"><i></i><i></i><i></i></div>', corpo)
  vai(dg, { opacity: 0 }, { opacity: 1, duration: 0.15 }, 28.2)
  $$('i', dg).forEach((d, i) => vai(d, { y: 0 }, { y: -10, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 28.2 + i * 0.08))
  vai(dg, { opacity: 1 }, { opacity: 0, duration: 0.1 }, 28.75)
  const b2 = bolha(corpo, 'out', 'Entregamos sim! Te mando o catálogo agora?', '23:47', 'ia')
  pula(b2, 28.8, { y: 30 }); cue(28.8, 'pop')
  const lw = el(`<div style="position:absolute;left:640px;top:600px">${logo('whatsapp', 'grande')}</div>`, c)
  pula(lw, 27.4, { y: 60, rot: 8 })
  const tag = el(`<div class="pill" style="position:absolute;left:560px;top:1180px;rotate:-4deg;gap:12px;font-size:34px"><span style="width:44px;height:44px;display:inline-block">${icone.ia}</span>respondeu em 3 s</div>`, c)
  carimba(tag, 29.1, -4)
}

// ── 10. PEÇA 2: TRÁFEGO PAGO COM GESTORES DE CASE (30–33) ──────────────
{
  const c = cena('papel2 grao', 30, 33)
  peca(c, 2, 'Tráfego pago', ['Gestores com', '*case de sucesso*.'], 30.05)
  const ls = el(`<div style="position:absolute;left:90px;top:560px;display:flex;gap:26px">${logo('meta')}${logo('googleads')}${logo('tiktok', 'cheio')}</div>`, c)
  $$('.logo-ic', ls).forEach((l, i) => { pula(l, 30.3 + i * 0.12, { y: 50, rot: [-6, 4, -3][i] }); cue(30.3 + i * 0.12, 'pop', 0.7) })
  const { g, desenha } = graficoSobe(c, { top: 730, left: 90, largura: 850, altura: 420, titulo: 'Clientes pelo anúncio' })
  pula(g, 30.4, { y: 120, rot: 1 })
  desenha(30.8, 1.2)
  cue(30.8, 'whoosh', 0.5)
  const selo2 = el(`<div style="position:absolute;left:520px;top:1190px;padding:18px 28px;border:6px solid var(--black);border-radius:14px;background:var(--paper);font:900 44px/1 var(--sans);font-stretch:72%;letter-spacing:.04em;display:flex;align-items:center;gap:14px"><span style="width:44px;height:44px;display:block">${icone.check}</span>GESTOR COM CASE</div>`, c)
  carimba(selo2, 32.0, -5)
}

// ── 11. PEÇA 3: SITE (33–35) ───────────────────────────────────────────
{
  const c = cena('papel grao', 33, 35)
  peca(c, 3, 'Site', ['Site que', '*vende*.'], 33.05)
  const s = siteMock(c, { top: 560, left: 100, largura: 830 })
  pula(s, 33.2, { y: 160 })
  $$('.sb', s).forEach((b, i) => vai(b, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.3 }, 33.45 + i * 0.1))
  const n = el(`<div class="n" style="position:absolute;left:170px;top:1290px;width:720px">${logo('whatsapp')}<div class="n__topo"><b>WhatsApp</b>agora</div><div>Nova mensagem pelo site: quero um orçamento</div></div>`, c)
  pula(n, 34.2, { y: -60 }); cue(34.2, 'ding')
}

// ── 12. PEÇA 4: BRANDING (35–37) ───────────────────────────────────────
{
  const c = cena('papel2 grao', 35, 37)
  peca(c, 4, 'Branding', ['Marca com', '*cara própria*.'], 35.05)
  const m = marcaBoard(c, { top: 560, left: 100, largura: 840 })
  pula(m, 35.2, { y: 160, rot: -1 })
  $$('.mb', m).forEach((b, i) => vai(b, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, 35.45 + i * 0.09))
  cue(36.1, 'carimbo', 0.6)
}

// ── 13. PEÇA 5: AUDIOVISUAL (37–39) ────────────────────────────────────
{
  const c = cena('preta grao', 37, 39)
  peca(c, 5, 'Audiovisual', ['Vídeo que', '*prende*.'], 37.05, { cor: 'var(--paper)' })
  const r = recFrame(c, { top: 600, left: 90, largura: 860, altura: 760 })
  pula(r, 37.2, { y: 160 })
  cue(37.5, 'camera'); flash(37.5, '#fff', 0.5)
  const dot = $('.rec-dot', r)
  for (let k = 0; k < 4; k++) TL.set(dot, { opacity: k % 2 ? 1 : 0.2 }, 37.3 + k * 0.4)
  conta($('.rec-tc', r), 14, 17, 37.2, 1.8, n => '00:00:' + String(Math.floor(n)).padStart(2, '0'))
}

// ── 14. PEÇA 6: GOOGLE E IAs (39–44.5) ─────────────────────────────────
{
  const c = cena('papel grao', 39, 44.5)
  const a = peca(c, 6, 'Google e IAs', ['Quem procura,', '*acha você*.'], 39.05)
  const gg = el(`<div style="position:absolute;left:740px;top:250px">${logo('google', 'grande')}</div>`, c)
  pula(gg, 39.2, { y: 60, rot: 8 }); cue(39.2, 'pop')
  const g = googleBusca(c, { top: 570, left: 90, largura: 850, resultados: [
    { top: true, url: 'suaempresa.com.br', titulo: 'Sua Empresa · Ótica em Barreiras', nota: '4,9 · Aberto agora' },
    { url: '', titulo: '<i style="display:block;height:26px;width:62%;background:#e3e3e3;border-radius:6px"></i>', desc: '<i style="display:block;height:18px;width:80%;background:#eee;border-radius:6px;margin-top:10px"></i>' },
  ] })
  pula(g, 39.3, { y: 140 })
  const fim = digita($('.termo', g), 'ótica em barreiras', 39.7, 24)
  const res = $$('.res', g)
  res.forEach((r, i) => vai(r, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, fim + 0.1 + i * 0.12))
  cue(fim + 0.1, 'ding', 0.7)
  const m = el('<div class="mao" style="left:640px;top:1110px;rotate:-6deg;font-size:62px">1º lugar!</div>', c)
  pula(m, fim + 0.4, { y: 20, rot: -6 })
  // …e nas IAs
  desceLinhas(a.linhas, 42.0)
  const b = titulo(c, ['E recomendado', 'nas *IAs*.'], { cls: 'm', top: 320 })
  sobeLinhas(b.linhas, 42.15)
  cue(42.0, 'whoosh', 0.6)
  const ia = respostaIA(c, { top: 900, left: 90, largura: 850, pergunta: 'Qual a melhor ótica em Barreiras?', resposta: '<span class="ia-txt"></span>' })
  pula(ia, 42.2, { y: 200 })
  digita($('.ia-txt', ia), 'Recomendo a Sua Empresa: bem avaliada no Google, aberta agora e entrega em LEM.', 42.6, 38)
  vai(m, { opacity: 1 }, { opacity: 0, duration: 0.2 }, 42.1)
}

// ── 15. MÁQUINA LIGADA: AS NOTIFICAÇÕES (44.5–49.5) ────────────────────
{
  const c = cena('preta grao', 44.5, 49.5)
  cortina(44.5, { cor: 'var(--paper)', dur: 0.4 })
  const a = titulo(c, ['Máquina *ligada*.', 'O celular não para.'], { cls: 'm', top: 250 })
  sobeLinhas(a.linhas, 44.55)
  cue(44.5, 'impacto', 0.8)
  const cel = celular(c, { left: 175, top: 520, hora: '08:12', data: 'terça-feira · Barreiras' })
  gsap.set(cel, { scale: 0.82, transformOrigin: '0 0' })
  pula(cel, 44.7, { y: 260 })
  const lista = $('.lock__lista', cel)
  const ns = [
    { logo: 'whatsapp', titulo: 'Cliente novo', texto: 'Oi! Vim pelo anúncio, queria um orçamento.' },
    { logo: 'google', titulo: 'Perfil da Empresa', quando: '2 min', texto: 'Alguém ligou pra você pelo Google Maps.' },
    { logo: 'instagram', titulo: 'Instagram', quando: '9 min', texto: 'Seu Reels tá bombando. Chegou em muita gente nova!' },
    { logo: 'googlemaps', titulo: 'Google Maps', quando: '1 h', texto: 'Pediram rota até a sua loja.' },
    { logo: 'whatsapp', titulo: 'Pedido', quando: '1 h', texto: 'Vocês entregam em Luís Eduardo?' },
  ]
  ns.slice().reverse().forEach(n => notificacao(lista, n)) // a mais nova fica em cima
  $$('.n', lista).reverse().forEach((n, i) => { pula(n, 45.2 + i * 0.6, { y: -40 }); cue(45.2 + i * 0.6, i % 2 ? 'vibra' : 'ding', 0.9) })
  const il = el('<div style="position:absolute;left:80px;top:1440px;font:600 24px var(--sans);color:#8a8680">*ilustração</div>', c)
  pula(il, 45.2, { y: 0 })
}

// ── 16. PEQUENO, MÉDIO OU GRANDE · TODO O OESTE (49.5–53) ──────────────
{
  const c = cena('papel grao', 49.5, 53)
  const a = titulo(c, ['Pequeno, médio', 'ou *grande*.'], { cls: 'l', top: 250 })
  sobeLinhas(a.linhas, 49.55)
  cue(49.5, 'whoosh', 0.7)
  ;[['Pequeno comércio', 'do bairro'], ['Média empresa', 'da cidade'], ['Grande empresa', 'do agro à indústria']].forEach(([n, sub], i) => {
    const k = el(`<div class="obj" style="left:${90 + i * 26}px;top:${590 + i * 205}px;width:${720 + i * 40}px;padding:26px 32px;display:flex;justify-content:space-between;align-items:center;gap:20px;rotate:${[-2, 1.5, -1][i]}deg">
      <div><b style="display:block;font:900 ${58 + i * 6}px/1 var(--sans);font-stretch:72%">${n}</b><small style="font:600 26px var(--sans);color:var(--muted)">${sub}</small></div><span class="pill" style="font-size:26px;white-space:nowrap">plano próprio</span></div>`, c)
    pula(k, 50.0 + i * 0.35, { rot: [-2, 1.5, -1][i] }); cue(50.0 + i * 0.35, 'pop')
  })
  const m = el('<div class="mao" style="left:430px;top:1150px;rotate:-4deg;font-size:56px">cada um com seu plano</div>', c)
  pula(m, 51.3, { y: 20, rot: -4 })
  const o = el('<div class="label" style="left:80px;top:1262px;font-size:32px">Todo o Oeste da Bahia</div>', c)
  pula(o, 51.0, { y: 20 })
  faixa(c, CIDADES, { top: 1340, rot: -3, vel: 200, t0: 49.5, t1: 53 })
}

// ── 17. A MISSÃO: CONSTRUIR SEU CASE DE SUCESSO (53–56.5) ──────────────
{
  const c = cena('papel2 grao', 53, 56.5)
  const a = titulo(c, ['Agência comum', '*empurra* serviço.'], { cls: 'm', top: 260 })
  sobeLinhas(a.linhas, 53.05)
  const ps = ['+ PACOTE', '+ POST', '+ ANÚNCIO'].map((t, i) => {
    const p = el(`<span class="pill" style="position:absolute;left:${160 + i * 170}px;top:${560 + i * 110}px;font-size:40px;padding:18px 30px;background:#fff;color:var(--black);border:4px solid var(--black)">${t}</span>`, c)
    vai(p, { x: 700, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, 53.3 + i * 0.2); cue(53.3 + i * 0.2, 'pop', 0.6)
    vai(p, { y: 0, rotate: 0 }, { y: 1400, rotate: (i - 1) * 40, duration: 0.6, ease: 'power2.in' }, 54.5 + i * 0.05)
    return p
  })
  desceLinhas(a.linhas, 54.5)
  cue(54.5, 'whoosh_desce', 0.7)
  const b = titulo(c, ['A Viva constrói', 'seu *case de sucesso*.'], { cls: 'm', top: 260 })
  sobeLinhas(b.linhas, 54.7)
  const k = el(`<div class="obj" style="left:120px;top:600px;width:820px;padding:44px;border-radius:24px">
    <div style="font:800 28px var(--sans);letter-spacing:.16em;color:var(--muted)">CASE DE SUCESSO</div>
    <div style="font:900 110px/.9 var(--sans);font-stretch:70%;margin:14px 0">Sua empresa</div>
    <div style="font:600 32px var(--sans)">Oeste da Bahia · diagnóstico → plano → resultado</div>
    <div class="n1" style="position:absolute;right:36px;top:30px;padding:8px 22px;border:6px solid var(--black);border-radius:12px;font:900 54px/1 var(--sans);font-stretch:70%;rotate:-8deg">Nº 001</div></div>`, c)
  pula(k, 54.9, { y: 160, rot: -1 })
  carimba($('.n1', k), 55.5, -8)
  const m = el('<div class="mao" style="left:360px;top:1120px;rotate:-4deg;font-size:60px">essa é a nossa missão</div>', c)
  pula(m, 55.7, { y: 20, rot: -4 })
}

// ── 18. LOGO EM DESTAQUE (56.5–59) ─────────────────────────────────────
{
  const c = cena('preta grao', 56.5, 59)
  cortina(56.5, { cor: 'var(--paper)', dur: 0.4 })
  const lg = logoViva(c, 'left:100px;top:560px;width:880px', { preto: false })
  vai(lg, { clipPath: 'inset(100% 0 0 0)', y: 60 }, { clipPath: 'inset(0% 0 0 0)', y: 0, duration: 0.55, ease: 'power4.out' }, 56.55)
  vai(lg, { scale: 1.15 }, { scale: 1, duration: 1.2, ease: 'power2.out' }, 56.55)
  cue(56.55, 'impacto', 1.1)
  flash(56.6, '#fff', 0.35)
  const a = titulo(c, ['Máquina de vendas', 'e *crescimento*.'], { cls: 'm', top: 1060, align: 'center', left: 80 })
  a.t.style.right = '80px'
  sobeLinhas(a.linhas, 57.2)
  const { s, anel } = selo(c, 'left:80px;top:250px;width:220px;height:220px')
  pula(s, 57.4, { y: 40 })
  vai(anel, { rotate: 0 }, { rotate: 110, duration: 2.5, ease: 'none' }, 56.5)
  faixa(c, CIDADES, { top: 1330, rot: -3, clara: true, t0: 56.5, t1: 59 })
}

// ── 19. CHAMADA FINAL (59–62.5) ────────────────────────────────────────
{
  const c = cena('papel grao', 59, 62.5)
  cortina(59, { cor: 'var(--black)', dur: 0.4 })
  const a = titulo(c, ['Chega de', 'marketing', 'no *chute*.'], { cls: 'xl', top: 250 })
  sobeLinhas(a.linhas, 59.05)
  const btn = el(`<div style="position:absolute;left:100px;top:880px;width:800px;padding:40px 0;border-radius:99px;background:var(--wa);border:5px solid var(--black);box-shadow:12px 12px 0 var(--black);display:flex;align-items:center;justify-content:center;gap:22px;color:#fff;font:900 58px var(--sans);font-stretch:80%">${LOGOS.whatsapp.replace('fill="#25d366"', 'fill="#fff"').replace('<svg', '<svg width="72" height="72"')} Quero meu diagnóstico</div>`, c)
  pula(btn, 59.9, { y: 120 }); cue(59.9, 'pop')
  vai(btn, { scale: 1 }, { scale: 1.04, duration: 0.25, yoyo: true, repeat: 5, ease: 'sine.inOut' }, 60.6)
  const h = el('<div style="position:absolute;left:100px;width:800px;top:1100px;text-align:center;font:800 44px/1.3 var(--sans)">@agenciaviva_ · link na bio<br><span style="font:600 32px var(--sans);color:var(--muted)">Barreiras · LEM · todo o Oeste da Bahia</span></div>', c)
  pula(h, 60.3, { y: 30 })
  const m = el('<div class="mao" style="left:520px;top:780px;rotate:-6deg;font-size:60px">chama agora!</div>', c)
  pula(m, 60.6, { y: 20, rot: -6 })
  const l = logoViva(c, 'left:370px;top:1290px;width:340px')
  pula(l, 60.4, { y: 30 })
  cue(62.0, 'impacto', 0.7)
}

pronto(62.5, { bpm: 120, drop: 14.5, calmo: [[53, 56.5]], fim: 61.5 })
