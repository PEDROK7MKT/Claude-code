import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { sb, q, brl, dataBR } from '../lib.js'
import { STATUS_CLIENTE } from '../config.js'
import { useApp, useRun, Avatar, Select, Spinner, Empty } from '../ui.jsx'
import { ClienteDrawer, NovoCliente } from './detalhes.jsx'

export default function Clientes({ params }) {
  const { equipe, nomeDe, admin } = useApp()
  const run = useRun()
  const [clientes, setClientes] = useState(null)
  const [abertas, setAbertas] = useState({})
  const [aberto, setAberto] = useState(params.id || null)
  const [novo, setNovo] = useState(false)
  const [f, setF] = useState({ busca: '', status: 'ativo', resp: null })
  useEffect(() => { if (params.id) setAberto(params.id) }, [params.id])

  const carregar = useCallback(async () => {
    const r = await run(async () => {
      const [c, t, fin] = await Promise.all([
        q(sb.from('clientes').select('*').order('empresa')),
        q(sb.from('tarefas').select('cliente_id').neq('status', 'feito').not('cliente_id', 'is', null)),
        admin ? q(sb.from('clientes_financeiro').select('cliente_id,valor_mensal')) : [],
      ])
      const valor = Object.fromEntries(fin.map(x => [x.cliente_id, x.valor_mensal]))
      return { c: c.map(x => ({ ...x, valor_mensal: valor[x.id] })), t: t.reduce((a, x) => ({ ...a, [x.cliente_id]: (a[x.cliente_id] || 0) + 1 }), {}) }
    })
    if (r) { setClientes(r.c); setAbertas(r.t) }
  }, [run, admin])
  useEffect(() => { carregar() }, [carregar])
  const lista = useMemo(() => (clientes || []).filter(c => (!f.status || c.status === f.status) && (!f.resp || c.responsavel_id === f.resp) &&
    (!f.busca || `${c.nome} ${c.empresa || ''} ${c.cidade || ''} ${c.segmento || ''}`.toLowerCase().includes(f.busca.toLowerCase()))), [clientes, f])

  if (!clientes) return <Spinner />
  const ativos = clientes.filter(c => c.status === 'ativo')
  const fechar = () => { setAberto(null); if (params.id) history.replaceState(null, '', '#/clientes') }
  return (
    <>
      <div className="head">
        <div><h1><span className="s">Clientes</span></h1><p>{ativos.length} ativos{admin ? ` · ${brl(ativos.reduce((s, c) => s + (+c.valor_mensal || 0), 0))}/mês` : ''}</p></div>
        <button className="btn" onClick={() => setNovo(true)}>+ Novo cliente</button>
      </div>
      <div className="toolbar">
        <input className="input search" placeholder="Buscar cliente, cidade ou segmento" value={f.busca} onChange={e => setF({ ...f, busca: e.target.value })} />
        <Select value={f.status} onChange={v => setF({ ...f, status: v })} empty="Todos os status" options={STATUS_CLIENTE} />
        <Select value={f.resp} onChange={v => setF({ ...f, resp: v })} empty="Todos" options={equipe.filter(p => p.ativo).map(p => ({ v: p.id, l: p.nome }))} />
      </div>
      {!lista.length ? <div className="card"><Empty title={clientes.length ? 'Nenhum cliente com esses filtros' : 'Nenhum cliente ainda'}>Converta um lead do funil ou cadastre direto.</Empty></div> : (
        <div className="tablewrap"><table className="t">
          <thead><tr><th>Cliente</th><th>Serviços</th><th>Cidade</th>{admin && <th>Mensal</th>}<th>Desde</th><th>Tarefas</th><th>Status</th><th>Resp.</th></tr></thead>
          <tbody>{lista.map(c => (
            <tr key={c.id} onClick={() => setAberto(c.id)}>
              <td><b>{c.empresa || c.nome}</b><br /><small className="muted">{c.empresa ? c.nome : ''} {c.segmento ? `· ${c.segmento}` : ''}</small></td>
              <td><div className="chips">{(c.servicos || []).map(s => <span key={s} className="badge">{s}</span>)}</div></td>
              <td>{c.cidade || '—'}</td>
              {admin && <td>{brl(c.valor_mensal)}</td>}
              <td>{dataBR(c.inicio_contrato)}</td>
              <td>{abertas[c.id] ? <span className="badge black">{abertas[c.id]} abertas</span> : <span className="muted">—</span>}</td>
              <td><span className={`badge ${c.status === 'ativo' ? 'green' : c.status === 'pausado' ? 'amber' : ''}`}>{STATUS_CLIENTE[c.status]}</span></td>
              <td><Avatar nome={nomeDe(c.responsavel_id)} light /></td>
            </tr>))}</tbody>
        </table></div>
      )}
      {aberto && <ClienteDrawer id={aberto} onClose={fechar} onChanged={carregar} />}
      {novo && <NovoCliente onClose={() => setNovo(false)} onSaved={carregar} />}
    </>
  )
}
