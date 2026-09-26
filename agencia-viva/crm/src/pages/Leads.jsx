import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { sb, q, brl, dataBR, hojeISO } from '../lib.js'
import { ORIGENS } from '../config.js'
import { useApp, useRun, Avatar, Select, Spinner, Empty } from '../ui.jsx'
import { LeadDrawer, NovoLead } from './detalhes.jsx'

export default function Leads({ params }) {
  const { etapas, equipe, nomeDe } = useApp()
  const run = useRun()
  const [leads, setLeads] = useState(null)
  const [aberto, setAberto] = useState(params.id || null)
  const [novo, setNovo] = useState(false)
  const [f, setF] = useState({ busca: '', etapa: null, origem: null, resp: null, cidade: null })
  useEffect(() => { if (params.id) setAberto(params.id) }, [params.id])

  const carregar = useCallback(async () => setLeads(await run(() => q(sb.from('leads').select('*').order('criado_em', { ascending: false }))) || []), [run])
  useEffect(() => { carregar() }, [carregar])
  const cidades = useMemo(() => [...new Set((leads || []).map(l => l.cidade).filter(Boolean))].sort(), [leads])
  const lista = useMemo(() => (leads || []).filter(l =>
    (!f.etapa || l.etapa_id === +f.etapa) && (!f.origem || l.origem === f.origem) && (!f.resp || l.responsavel_id === f.resp) && (!f.cidade || l.cidade === f.cidade) &&
    (!f.busca || `${l.nome} ${l.empresa || ''} ${l.telefone || ''} ${l.instagram || ''}`.toLowerCase().includes(f.busca.toLowerCase()))), [leads, f])

  const exportar = () => {
    const cols = ['nome', 'empresa', 'telefone', 'email', 'instagram', 'cidade', 'segmento', 'origem', 'valor_estimado', 'criado_em']
    const csv = [['etapa', ...cols].join(';'), ...lista.map(l => [etapas.find(e => e.id === l.etapa_id)?.nome, ...cols.map(c => l[c] ?? '')].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = `leads-viva-${hojeISO()}.csv`; a.click()
  }

  if (!leads) return <Spinner />
  const fechar = () => { setAberto(null); if (params.id) history.replaceState(null, '', '#/leads') }
  return (
    <>
      <div className="head">
        <div><h1><span className="s">Leads</span></h1><p>{leads.length} no total · {lista.length} nesta lista</p></div>
        <div style={{ display: 'flex', gap: 8 }}><button className="btn btn--ghost" onClick={exportar}>Exportar CSV</button><button className="btn" onClick={() => setNovo(true)}>+ Novo lead</button></div>
      </div>
      <div className="toolbar">
        <input className="input search" placeholder="Buscar nome, empresa, telefone ou @" value={f.busca} onChange={e => setF({ ...f, busca: e.target.value })} />
        <Select value={f.etapa} onChange={v => setF({ ...f, etapa: v })} empty="Todas as etapas" options={etapas.map(e => ({ v: e.id, l: e.nome }))} />
        <Select value={f.origem} onChange={v => setF({ ...f, origem: v })} empty="Todas as origens" options={ORIGENS} />
        <Select value={f.cidade} onChange={v => setF({ ...f, cidade: v })} empty="Todas as cidades" options={cidades} />
        <Select value={f.resp} onChange={v => setF({ ...f, resp: v })} empty="Todos" options={equipe.filter(p => p.ativo).map(p => ({ v: p.id, l: p.nome }))} />
      </div>
      {!lista.length ? <div className="card"><Empty title={leads.length ? 'Nenhum lead com esses filtros' : 'Nenhum lead ainda'}>{leads.length ? 'Limpe os filtros para ver todos.' : 'Cadastre o primeiro ou espere chegar pelo formulário do site.'}</Empty></div> : (
        <div className="tablewrap"><table className="t">
          <thead><tr><th>Lead</th><th>Etapa</th><th>Origem</th><th>Cidade</th><th>Valor</th><th>Retorno</th><th>Resp.</th></tr></thead>
          <tbody>{lista.map(l => {
            const et = etapas.find(e => e.id === l.etapa_id)
            return (
              <tr key={l.id} onClick={() => setAberto(l.id)}>
                <td><b>{l.empresa || l.nome}</b><br /><small className="muted">{l.empresa ? l.nome : ''} {l.telefone || ''}</small></td>
                <td><span className={`badge ${et?.tipo === 'ganho' ? 'green' : et?.tipo === 'perdido' ? 'red' : ''}`}>{et?.nome}</span></td>
                <td>{ORIGENS[l.origem]}</td>
                <td>{l.cidade || '—'}</td>
                <td>{brl(l.valor_estimado)}</td>
                <td>{l.proximo_contato ? <span className={`badge ${l.proximo_contato < hojeISO() && et?.tipo === 'aberto' ? 'red' : ''}`}>{dataBR(l.proximo_contato)}</span> : '—'}</td>
                <td><Avatar nome={nomeDe(l.responsavel_id)} light /></td>
              </tr>)
          })}</tbody>
        </table></div>
      )}
      {aberto && <LeadDrawer id={aberto} onClose={fechar} onChanged={carregar} />}
      {novo && <NovoLead onClose={() => setNovo(false)} onSaved={carregar} />}
    </>
  )
}
