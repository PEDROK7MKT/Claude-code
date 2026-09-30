// teste das peças novas: celular gigante e ECG
const c = cena('papel grao', 0, 4)
const { e, tr, passo } = ecg(c, 'left:80px;top:780px;width:850px', { plano: i => i >= 8, alto: i => (i === 7 ? 0.4 : 1) })
vai(tr, { x: 0 }, { x: -passo * 6, duration: 4, ease: 'none' }, 0)
const { c: cel, tela } = celularG(c, { top: 900 })
el('<div style="position:absolute;left:60px;top:100px;font:600 48px var(--sans)">pizzaria em Barreiras</div>', tela)
pronto(4, { bpm: 120, drop: 1, fim: 3 })
