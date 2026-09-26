import React, { useEffect, useState, useCallback } from 'react'
import { sb, q, brl, dataBR, hojeISO } from '../lib.js'
import { STATUS_COBRANCA } from '../config.js'
import { useRun, Spinner, Empty, Select } from '../ui.jsx'

const mesISO = d => d.slice(0, 7) + '-01'
const nomeMes = m => new Date(m + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

export default function Financeiro() {
  const run = useRun()
  const [mes, setMes] = useState(mesISO(hojeISO()))
  const [dados, setDados] = useState(null)

  const carregar = useCallback(async () => {
    const r = await run(async () => {
      const [cob, cli] = await Promise.all([
        q(sb.from('cobrancas').select('*').eq('competencia', mes)),
        q(sb.from('clientes').select('id,nome,empresa,valor_mensal,dia_vencimento,status')),
      ])
      return { cob, cli }
    })
    if (r) setDados(r)
  }, [mes, run])
  useEffect(() => { carregar() }, [carregar])

  const gerar = async () => {
    const [y, m] = mes.split('-').map(Number)
    const ultimo = new Date(y, m, 0).getDate()
    const linhas = dados.cli.filter(c => c.status === 'ativo' && +c.valor_mensal > 0).map(c => ({
      cliente_id: c.id, competencia: mes, valor: c.valor_mensal,
      vencimento: `${mes.slice(0, 8)}${String(Math.min(c.dia_vencimento || 10, ultimo)).padStart(2, '0')}`,
    }))
    if (!linhas.length) return run(async () => { throw new Error('Nenhum cliente ativo com valor mensal preenchido.') })
    await run(() => q(sb.from('cobrancas').upsert(linhas, { onConflict: 'cliente_id,competencia', ignoreDuplicates: true })), 'Cobranças do mês geradas!')
    carregar()
  }
  const alternar = async c => { await run(() => q(sb.from('cobrancas').update(c.status === 'pago' ? { status: 'pendente', pago_em: null } : { status: 'pago', pago_em: hojeISO() }).eq('id', c.id))); carregar() }
  const mudar = async (c, status) => { await run(() => q(sb.from('cobrancas').update({ status, pago_em: status === 'pago' ? hojeISO() : null }).eq('id', c.id))); carregar() }

  if (!dados) return <Spinner />
  const hoje = hojeISO()
  const nome = id => { const c = dados.cli.find(x => x.id === id); return c ? c.empresa || c.nome : '—' }
  const validas = dados.cob.filter(c => c.status !== 'cancelado')
  const soma = arr => arr.reduce((s, c) => s + +c.valor, 0)
  const pagas = validas.filter(c => c.status === 'pago')
  const atras = validas.filter(c => c.status !== 'pago' && c.vencimento && c.vencimento < hoje)
  const ativos = dados.cli.filter(c => c.status === 'ativo')
  const mrr = soma(ativos.map(c => ({ valor: c.valor_mensal || 0 })))
  const meses = Array.from({ length: 13 }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 9 + i); return mesISO(d.toISOString()) })

  return (
    <>
      <div className="head">
        <div><h1><span className="s">Financeiro</span></h1><p>Mensalidades dos clientes. Só administradores veem esta área.</p></div>
        <div style={{ display: 'flex', gap: 8 }}><div style={{ width: 200 }}><Select value={mes} onChange={setMes} options={meses.map(m => ({ v: m, l: nomeMes(m) }))} /></div><button className="btn" onClick={gerar}>Gerar cobranças do mês</button></div>
      </div>
      <div className="kpis">
        <div className="kpi dark"><span>Receita mensal (ativos)</span><b>{brl(mrr)}</b><small>{ativos.length} clientes · ticket médio {brl(ativos.length ? mrr / ativos.length : 0)}</small></div>
        <div className="kpi"><span>Previsto em {nomeMes(mes).split(' ')[0]}</span><b>{brl(soma(validas))}</b><small>{validas.length} cobranças</small></div>
        <div className="kpi"><span>Recebido</span><b style={{ color: 'var(--green)' }}>{brl(soma(pagas))}</b><small>{pagas.length} pagas</small></div>
        <div className="kpi"><span>Em atraso</span><b style={{ color: atras.length ? 'var(--red)' : undefined }}>{brl(soma(atras))}</b><small>{atras.length} cobranças</small></div>
      </div>
      {!dados.cob.length ? <div className="card"><Empty title={`Sem cobranças em ${nomeMes(mes)}`}>Clique em "Gerar cobranças do mês" para criar as mensalidades dos clientes ativos (usa o valor mensal e o dia de vencimento de cada um).</Empty></div> : (
        <div className="tablewrap"><table className="t">
          <thead><tr><th>Cliente</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Pago em</th><th></th></tr></thead>
          <tbody>{dados.cob.sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || '')).map(c => {
            const late = c.status !== 'pago' && c.status !== 'cancelado' && c.vencimento && c.vencimento < hoje
            return (
              <tr key={c.id} onClick={() => alternar(c)} title="Clique para marcar como pago / pendente">
                <td><b>{nome(c.cliente_id)}</b></td>
                <td>{brl(c.valor)}</td>
                <td>{dataBR(c.vencimento)}</td>
                <td><span className={`badge ${c.status === 'pago' ? 'green' : late ? 'red' : c.status === 'cancelado' ? '' : 'amber'}`}>{late ? 'Atrasado' : STATUS_COBRANCA[c.status]}</span></td>
                <td>{dataBR(c.pago_em)}</td>
                <td onClick={e => e.stopPropagation()}><div style={{ width: 140 }}><Select value={c.status} onChange={v => mudar(c, v)} options={STATUS_COBRANCA} /></div></td>
              </tr>)
          })}</tbody>
        </table></div>
      )}
    </>
  )
}
