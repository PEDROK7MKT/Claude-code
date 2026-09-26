import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { sb, q, dataBR, hojeISO, atrasada } from '../lib.js'
import { TIPOS_TAREFA, STATUS_TAREFA, PRIORIDADES } from '../config.js'
import { useApp, useRun, Avatar, Select, Spinner } from '../ui.jsx'
import { TarefaModal } from './detalhes.jsx'

export default function Tarefas() {
  const { equipe, nomeDe, sessao } = useApp()
  const run = useRun()
  const [tarefas, setTarefas] = useState(null)
  const [clientes, setClientes] = useState({})
  const [aberta, setAberta] = useState(null)
  const [arrastando, setArrastando] = useState(null)
  const [sobre, setSobre] = useState(null)
  const [f, setF] = useState({ resp: 'eu', cliente: null, tipo: null, busca: '', feitas: false })

  const carregar = useCallback(async () => {
    const r = await run(async () => {
      let t = sb.from('tarefas').select('*').order('prazo', { nullsFirst: false }).order('criado_em')
      if (!f.feitas) t = t.or(`status.neq.feito,concluida_em.gte.${new Date(Date.now() - 7 * 864e5).toISOString()}`)
      const [tt, cc] = await Promise.all([q(t), q(sb.from('clientes').select('id,nome,empresa'))])
      return { tt, cc: Object.fromEntries(cc.map(c => [c.id, c.empresa || c.nome])) }
    })
    if (r) { setTarefas(r.tt); setClientes(r.cc) }
  }, [run, f.feitas])
  useEffect(() => { carregar() }, [carregar])

  const lista = useMemo(() => (tarefas || []).filter(t =>
    (!f.resp || (f.resp === 'eu' ? t.responsavel_id === sessao.user.id : t.responsavel_id === f.resp)) &&
    (!f.cliente || t.cliente_id === f.cliente) && (!f.tipo || t.tipo === f.tipo) &&
    (!f.busca || t.titulo.toLowerCase().includes(f.busca.toLowerCase()))), [tarefas, f, sessao])

  const mover = async (id, status) => {
    const t = tarefas.find(x => x.id === id)
    if (!t || t.status === status) return
    setTarefas(ts => ts.map(x => x.id === id ? { ...x, status } : x))
    if (await run(() => q(sb.from('tarefas').update({ status }).eq('id', id))) === undefined) carregar()
  }

  if (!tarefas) return <Spinner />
  const hoje = hojeISO()
  return (
    <>
      <div className="head">
        <div><h1>Tarefas da <span className="s">operação.</span></h1><p>{lista.filter(t => t.status !== 'feito').length} abertas · {lista.filter(atrasada).length} atrasadas · arraste entre as colunas</p></div>
        <button className="btn" onClick={() => setAberta({})}>+ Nova tarefa</button>
      </div>
      <div className="toolbar">
        <input className="input search" placeholder="Buscar tarefa" value={f.busca} onChange={e => setF({ ...f, busca: e.target.value })} />
        <Select value={f.resp} onChange={v => setF({ ...f, resp: v })} empty="Toda a equipe" options={[{ v: 'eu', l: 'Minhas tarefas' }, ...equipe.filter(p => p.ativo).map(p => ({ v: p.id, l: p.nome }))]} />
        <Select value={f.cliente} onChange={v => setF({ ...f, cliente: v })} empty="Todos os clientes" options={Object.entries(clientes).map(([v, l]) => ({ v, l })).sort((a, b) => a.l.localeCompare(b.l))} />
        <Select value={f.tipo} onChange={v => setF({ ...f, tipo: v })} empty="Todos os tipos" options={TIPOS_TAREFA} />
        <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 14 }}><input type="checkbox" checked={f.feitas} onChange={e => setF({ ...f, feitas: e.target.checked })} /> Mostrar concluídas antigas</label>
      </div>
      <div className="board" style={{ gridAutoColumns: 'minmax(270px, 1fr)' }}>
        {Object.entries(STATUS_TAREFA).map(([st, nome]) => {
          const itens = lista.filter(t => t.status === st)
          return (
            <div key={st} className={`col${st === 'feito' ? ' won' : ''}${sobre === st ? ' over' : ''}`}
              onDragOver={e => { e.preventDefault(); setSobre(st) }} onDragLeave={() => setSobre(null)}
              onDrop={e => { e.preventDefault(); setSobre(null); mover(e.dataTransfer.getData('text/plain'), st) }}>
              <div className="col__head"><b>{nome} <span className="muted">{itens.length}</span></b></div>
              {itens.map(t => {
                const late = atrasada(t)
                return (
                  <div key={t.id} className={`kcard${late ? ' late' : ''}${arrastando === t.id ? ' drag' : ''}`} draggable
                    onDragStart={e => { e.dataTransfer.setData('text/plain', t.id); setArrastando(t.id) }} onDragEnd={() => setArrastando(null)}
                    onClick={() => setAberta(t)} tabIndex={0} onKeyDown={e => e.key === 'Enter' && setAberta(t)}>
                    <b>{t.titulo}</b>
                    {t.cliente_id && <small>{clientes[t.cliente_id]}</small>}
                    <div className="meta">
                      <span className="badge">{TIPOS_TAREFA[t.tipo]}</span>
                      {t.prioridade === 'alta' && <span className="badge black">{PRIORIDADES.alta}</span>}
                      {t.prazo && <span className={`badge ${late ? 'red' : t.prazo === hoje ? 'amber' : ''}`}>{t.prazo === hoje ? 'Hoje' : dataBR(t.prazo)}</span>}
                      <Avatar nome={nomeDe(t.responsavel_id)} light />
                    </div>
                  </div>
                )
              })}
              {st === 'a_fazer' && <button className="btn btn--ghost btn--sm" style={{ width: '100%' }} onClick={() => setAberta({})}>+ Adicionar</button>}
            </div>
          )
        })}
      </div>
      {aberta && <TarefaModal tarefa={aberta} onClose={() => setAberta(null)} onSaved={carregar} />}
    </>
  )
}
