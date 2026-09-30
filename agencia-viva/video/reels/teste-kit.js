// vitrine das peças novas (só pra conferir o visual)
KIT.entrada = 'empurra'
{
  const c = cena('preta grao', 0, 1)
  notifGrande(c, { logo: 'whatsapp', titulo: 'Cliente novo', texto: 'Oi! Vim pelo anúncio, queria um orçamento.' }, 'left:110px;top:400px')
  notifGrande(c, { logo: 'googlemaps', titulo: 'Google Maps', quando: '2 min', texto: '14 pessoas pediram rota até a sua loja.' }, 'left:110px;top:680px')
  botaoSite(c, 'Quero meu diagnóstico', 'left:120px;top:1100px;width:840px')
}
{
  const c = cena('papel grao', 1, 2)
  const r = roda(c, [
    { tag: 'anúncios', titulo: 'Tráfego *pago*', texto: 'Gestor com case, verba no lugar certo.', logos: ['meta', 'googleads', 'tiktok'] },
    { tag: 'atendimento', titulo: 'IA no *WhatsApp*', texto: 'Responde na hora, até de madrugada.', logos: ['whatsapp'] },
    { tag: 'Google', titulo: 'Seu nome no *mapa*', texto: 'Perfil da Empresa e busca local.', logos: ['google', 'googlemaps'] },
  ], { cy: 1000 })
  r.gira(1, 1.2, 0.01)
}
{
  const c = cena('preta grao', 2, 3)
  const { m, pinos } = mapaOeste(c, 'left:60px;top:380px;width:960px;height:768px')
  const { s } = seloGrande(c, 'left:560px;top:1080px;width:400px;height:400px')
}
{
  const c = cena('papel grao', 3, 4)
  painel(c, { num: '01', titulo: '*Diagnóstico*', texto: 'Quem compra de você, onde a venda trava, quanto dá pra investir.', mao: 'antes de vender, escutar' }, 'left:160px;top:420px')
}
pronto(4, { bpm: 120, drop: 1, calmo: [], fim: 3.5 })
