import React from 'react'
import { sb, q, dataBR } from '../lib.js'
import { useApp, useRun, Avatar, Select, Empty } from '../ui.jsx'

export default function Equipe() {
  const { equipe, sessao, recarregarBase } = useApp()
  const run = useRun()
  const atualizar = async (p, dados, msg) => { if (await run(() => q(sb.from('perfis').update(dados).eq('id', p.id)), msg) !== undefined) recarregarBase() }
  const pendentes = equipe.filter(p => !p.ativo)
  return (
    <>
      <div className="head"><div><h1><span className="s">Equipe</span></h1><p>Quem cria conta em <b>{location.origin}/crm</b> aparece aqui e só entra depois de aprovado.</p></div></div>
      {pendentes.length > 0 && <div className="ok" style={{ marginBottom: 16 }}>{pendentes.length} {pendentes.length > 1 ? 'pessoas esperando' : 'pessoa esperando'} aprovação.</div>}
      {!equipe.length ? <div className="card"><Empty title="Ninguém ainda" /></div> : (
        <div className="tablewrap"><table className="t">
          <thead><tr><th>Pessoa</th><th>Papel</th><th>Acesso</th><th>Desde</th></tr></thead>
          <tbody>{equipe.map(p => {
            const eu = p.id === sessao.user.id
            return (
              <tr key={p.id} style={{ cursor: 'default' }}>
                <td><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Avatar nome={p.nome} /><div><b>{p.nome}{eu ? ' (você)' : ''}</b><br /><small className="muted">{p.email}</small></div></div></td>
                <td><div style={{ width: 170 }}><Select value={p.papel} disabled={eu} onChange={v => atualizar(p, { papel: v }, 'Papel atualizado.')} options={{ admin: 'Administrador', equipe: 'Equipe' }} /></div></td>
                <td>{eu ? <span className="badge green">Ativo</span> : p.ativo
                  ? <button className="btn btn--ghost btn--sm" onClick={() => atualizar(p, { ativo: false }, 'Acesso bloqueado.')}>Bloquear acesso</button>
                  : <button className="btn btn--sm" onClick={() => atualizar(p, { ativo: true }, 'Acesso liberado!')}>Aprovar acesso</button>}</td>
                <td>{dataBR(p.criado_em)}</td>
              </tr>)
          })}</tbody>
        </table></div>
      )}
      <div className="card" style={{ marginTop: 16 }}>
        <h3>O que cada papel <span className="s">pode</span></h3>
        <p style={{ margin: 0 }}><b>Administrador:</b> tudo, incluindo Financeiro, aprovar pessoas e apagar registros.<br /><b>Equipe:</b> funil, leads, clientes e tarefas (cria e edita). Não acessa Financeiro/cobranças, não aprova pessoas e não apaga leads nem clientes.</p>
      </div>
    </>
  )
}
