import React, { useEffect, useState } from 'react'
import { sb, q, brl, dataBR, hojeISO, atrasada } from '../lib.js'
import { ORIGENS, TIPOS_TAREFA } from '../config.js'
import { useApp, useRun, Spinner, Empty, Avatar } from '../ui.jsx'
import { TarefaModal } from './detalhes.jsx'

export default function Painel() {
  const { perfil, sessao, etapas, admin, nomeDe } = useApp()
  const run = useRun()
  const [d, setD] = useState(null)
  const [tarefa, setTarefa] = useState(null)

  const carregar = async () => {
    const r = await run(async () => {
      const [leads, clientes, tarefas, fin] = await Promise.all([
        q(sb.from('leads').select('id,nome,empresa,etapa_id,etapa_em,valor_estimado,origem,proximo_contato,responsavel_id,criado_em')),
        q(sb.from('clientes').select('id,status')),
        q(sb.from('tarefas').select('*').neq('status', 'feito').order('prazo', { nullsFirst: false })),
        admin ? q(sb.from('clientes_financeiro').select('cliente_id,valor_mensal')) : [],
      ])
      return { leads, clientes, tarefas, valor: Object.fromEntries(fin.map(x => [x.cliente_id, +x.valor_mensal || 0])) }
    })
    if (r) setD(r)
  }
  useEffect(() => { carregar() }, []) // eslint-disable-line
  if (!d) return <Spinner />

  const tipo = id => etapas.find(e => e.id === id)?.tipo
  const abertos = d.leads.filter(l => tipo(l.etapa_id) === 'aberto')
  // início do mês no fuso de quem está usando (compara instantes, não texto de data)
  const ini = new Date(); ini.setHours(0, 0, 0, 0); ini.setDate(1)
  const noMes = t => t && new Date(t) >= ini
  // fechado/perdido no mês = entrou nessa etapa neste mês (etapa_em), não "foi editado neste mês"
  const ganhosMes = d.leads.filter(l => tipo(l.etapa_id) === 'ganho' && noMes(l.etapa_em)).length
  const perdidosMes = d.leads.filter(l => tipo(l.etapa_id) === 'perdido' && noMes(l.etapa_em)).length
  const novosMes = d.leads.filter(l => noMes(l.criado_em)).length
  const ativos = d.clientes.filter(c => c.status === 'ativo')
  const mrr = ativos.reduce((s, c) => s + (d.valor[c.id] || 0), 0)
  const minhas = d.tarefas.filter(t => t.responsavel_id === sessao.user.id)
  const atrasadas = d.tarefas.filter(atrasada)
  const hoje = hojeISO()
  const contatos = abertos.filter(l => l.proximo_contato && l.proximo_contato <= hoje).sort((a, b) => a.proximo_contato.localeCompare(b.proximo_contato))
  const porEtapa = etapas.filter(e => e.tipo === 'aberto').map(e => ({ e, n: abertos.filter(l => l.etapa_id === e.id).length }))
  const maxEt = Math.max(1, ...porEtapa.map(x => x.n))
  const porOrigem = Object.entries(d.leads.filter(l => noMes(l.criado_em)).reduce((a, l) => ({ ...a, [l.origem]: (a[l.origem] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1])

  return (
    <>
      <div className="head"><div><h1>Oi, <span className="s">{(perfil.nome || '').split(' ')[0]}.</span></h1><p>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div></div>
      <div className="kpis">
        <div className="kpi dark"><span>Negociações abertas</span><b>{abertos.length}</b><small>{brl(abertos.reduce((s, l) => s + (+l.valor_estimado || 0), 0))}/mês no funil</small></div>
        <div className="kpi"><span>Leads novos no mês</span><b>{novosMes}</b><small>{ganhosMes} fechados · {perdidosMes} perdidos</small></div>
        <div className="kpi"><span>Taxa de fechamento</span><b>{ganhosMes + perdidosMes ? Math.round(100 * ganhosMes / (ganhosMes + perdidosMes)) : 0}%</b><small>no mês, entre ganhos e perdidos</small></div>
        <div className="kpi"><span>Clientes ativos</span><b>{ativos.length}</b>{admin && <small>{brl(mrr)} de receita mensal</small>}</div>
        <div className="kpi"><span>Tarefas atrasadas</span><b style={{ color: atrasadas.length ? 'var(--red)' : undefined }}>{atrasadas.length}</b><small>{d.tarefas.length} em aberto na operação</small></div>
      </div>
      <div className="cols2">
        <div className="card">
          <h3>Minhas <span className="s">tarefas</span></h3>
          {!minhas.length ? <Empty title="Tudo em dia 🙌">Nenhuma tarefa aberta com você.</Empty> : (
            <div className="list">{minhas.slice(0, 12).map(t => (
              <div key={t.id} className="row" onClick={() => setTarefa(t)}>
                <div className="grow"><b>{t.titulo}</b><small>{TIPOS_TAREFA[t.tipo]}{t.prazo ? ` · ${dataBR(t.prazo)}` : ''}</small></div>
                {atrasada(t) ? <span className="badge red">Atrasada</span> : t.prazo === hoje ? <span className="badge amber">Hoje</span> : t.prioridade === 'alta' ? <span className="badge black">Alta</span> : null}
              </div>))}
              {minhas.length > 12 && <a className="btn btn--ghost btn--sm" href="#/tarefas" style={{ marginTop: 10 }}>Ver todas ({minhas.length})</a>}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div className="card">
            <h3>Retornos <span className="s">pra hoje</span></h3>
            {!contatos.length ? <p className="muted" style={{ margin: 0 }}>Nenhum retorno marcado pra hoje.</p> : (
              <div className="list">{contatos.slice(0, 8).map(l => (
                <a key={l.id} className="row" href={`#/leads?id=${l.id}`} style={{ textDecoration: 'none' }}>
                  <div className="grow"><b>{l.empresa || l.nome}</b><small>{etapas.find(e => e.id === l.etapa_id)?.nome}</small></div>
                  <span className={`badge ${l.proximo_contato < hoje ? 'red' : 'amber'}`}>{l.proximo_contato < hoje ? `desde ${dataBR(l.proximo_contato)}` : 'hoje'}</span>
                  <Avatar nome={nomeDe(l.responsavel_id)} light />
                </a>))}</div>
            )}
          </div>
          <div className="card">
            <h3>Funil <span className="s">agora</span></h3>
            <div className="bars">{porEtapa.map(({ e, n }) => <div key={e.id} className="bar"><span>{e.nome}</span><i style={{ width: `${(100 * n) / maxEt}%` }} /><em>{n}</em></div>)}</div>
          </div>
          <div className="card">
            <h3>De onde vieram <span className="s">(mês)</span></h3>
            {!porOrigem.length ? <p className="muted" style={{ margin: 0 }}>Nenhum lead novo neste mês ainda.</p> : <div className="bars">{porOrigem.map(([o, n]) => <div key={o} className="bar"><span>{ORIGENS[o]}</span><i style={{ width: `${(100 * n) / porOrigem[0][1]}%` }} /><em>{n}</em></div>)}</div>}
          </div>
        </div>
      </div>
      {tarefa && <TarefaModal tarefa={tarefa} onClose={() => setTarefa(null)} onSaved={carregar} />}
    </>
  )
}
