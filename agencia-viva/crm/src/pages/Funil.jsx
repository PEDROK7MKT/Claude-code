import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { sb, q, brl, dataBR, hojeISO } from '../lib.js'
import { ORIGENS } from '../config.js'
import { useApp, useRun, Avatar, Select, Spinner } from '../ui.jsx'
import { LeadDrawer, NovoLead } from './detalhes.jsx'

export default function Funil({ params }) {
  const { etapas, equipe, nomeDe, sessao } = useApp()
  const run = useRun()
  const [leads, setLeads] = useState(null)
  const [aberto, setAberto] = useState(params.id || null)
  const [novo, setNovo] = useState(null)
  const [arrastando, setArrastando] = useState(null)
  const [sobre, setSobre] = useState(null)
  const [filtro, setFiltro] = useState({ resp: null, origem: null, busca: '' })

  const carregar = useCallback(async () => setLeads(await run(() => q(sb.from('leads').select('*').order('atualizado_em', { ascending: false }))) || []), [run])
  useEffect(() => { carregar() }, [carregar])

  const visiveis = useMemo(() => (leads || []).filter(l =>
    (!filtro.resp || (filtro.resp === 'eu' ? l.responsavel_id === sessao.user.id : l.responsavel_id === filtro.resp)) &&
    (!filtro.origem || l.origem === filtro.origem) &&
    (!filtro.busca || `${l.nome} ${l.empresa || ''} ${l.cidade || ''}`.toLowerCase().includes(filtro.busca.toLowerCase()))), [leads, filtro, sessao])

  const mover = async (leadId, etapaId) => {
    const l = leads.find(x => x.id === leadId)
    if (!l || l.etapa_id === etapaId) return
    setLeads(ls => ls.map(x => x.id === leadId ? { ...x, etapa_id: etapaId } : x))
    if (await run(() => q(sb.from('leads').update({ etapa_id: etapaId }).eq('id', leadId)), `Movido para ${etapas.find(e => e.id === etapaId)?.nome}`) === undefined) carregar()
  }

  if (!leads) return <Spinner />
  const abertos = visiveis.filter(l => etapas.find(e => e.id === l.etapa_id)?.tipo === 'aberto')
  return (
    <>
      <div className="head">
        <div><h1>Funil de <span className="s">vendas.</span></h1><p>{abertos.length} negociações abertas · {brl(abertos.reduce((s, l) => s + (+l.valor_estimado || 0), 0))}/mês em jogo. Arraste os cartões entre as etapas.</p></div>
        <button className="btn" onClick={() => setNovo(1)}>+ Novo lead</button>
      </div>
      <div className="toolbar">
        <input className="input search" placeholder="Buscar nome, empresa ou cidade" value={filtro.busca} onChange={e => setFiltro({ ...filtro, busca: e.target.value })} />
        <Select value={filtro.resp} onChange={v => setFiltro({ ...filtro, resp: v })} empty="Todos os responsáveis" options={[{ v: 'eu', l: 'Só os meus' }, ...equipe.filter(p => p.ativo).map(p => ({ v: p.id, l: p.nome }))]} />
        <Select value={filtro.origem} onChange={v => setFiltro({ ...filtro, origem: v })} empty="Todas as origens" options={ORIGENS} />
      </div>
      <div className="board">
        {etapas.map(e => {
          const itens = visiveis.filter(l => l.etapa_id === e.id)
          return (
            <div key={e.id} className={`col${e.tipo === 'ganho' ? ' won' : e.tipo === 'perdido' ? ' lost' : ''}${sobre === e.id ? ' over' : ''}`}
              onDragOver={ev => { ev.preventDefault(); setSobre(e.id) }} onDragLeave={() => setSobre(null)}
              onDrop={ev => { ev.preventDefault(); setSobre(null); mover(ev.dataTransfer.getData('text/plain'), e.id) }}>
              <div className="col__head"><b>{e.nome} <span className="muted">{itens.length}</span></b><small>{brl(itens.reduce((s, l) => s + (+l.valor_estimado || 0), 0))}</small></div>
              {itens.map(l => {
                const late = l.proximo_contato && l.proximo_contato < hojeISO() && e.tipo === 'aberto'
                return (
                  <div key={l.id} className={`kcard${arrastando === l.id ? ' drag' : ''}${late ? ' late' : ''}`} draggable
                    onDragStart={ev => { ev.dataTransfer.setData('text/plain', l.id); setArrastando(l.id) }} onDragEnd={() => setArrastando(null)}
                    onClick={() => setAberto(l.id)} tabIndex={0} onKeyDown={ev => ev.key === 'Enter' && setAberto(l.id)}>
                    <b>{l.empresa || l.nome}</b>
                    <small>{l.empresa ? l.nome : ''}{l.cidade ? `${l.empresa ? ' · ' : ''}${l.cidade}` : ''}</small>
                    <div className="meta">
                      {l.valor_estimado ? <span className="badge black">{brl(l.valor_estimado)}</span> : null}
                      <span className="badge">{ORIGENS[l.origem]}</span>
                      {l.proximo_contato && e.tipo === 'aberto' && <span className={`badge ${late ? 'red' : ''}`}>📅 {dataBR(l.proximo_contato)}</span>}
                      <Avatar nome={nomeDe(l.responsavel_id)} light />
                    </div>
                  </div>
                )
              })}
              {e.tipo === 'aberto' && <button className="btn btn--ghost btn--sm" style={{ width: '100%' }} onClick={() => setNovo(e.id)}>+ Adicionar</button>}
            </div>
          )
        })}
      </div>
      {aberto && <LeadDrawer id={aberto} onClose={() => setAberto(null)} onChanged={carregar} />}
      {novo && <NovoLead etapaInicial={novo} onClose={() => setNovo(null)} onSaved={carregar} />}
    </>
  )
}
