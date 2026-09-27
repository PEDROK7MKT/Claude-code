import React, { useEffect, useState, useCallback } from 'react'
import { sb, q, brl, dataBR, dataHora, linkWhats, atrasada, hojeISO } from '../lib.js'
import { SERVICOS, ORIGENS, CIDADES, TIPOS_TAREFA, STATUS_TAREFA, PRIORIDADES, STATUS_CLIENTE, STATUS_COBRANCA, TIPOS_ATIVIDADE } from '../config.js'
import { useApp, useRun, Drawer, Modal, Field, Input, Text, Select, Chips, EquipeSelect, Avatar, Empty, Spinner, confirmar } from '../ui.jsx'

const vazioLead = { nome: '', empresa: '', telefone: '', email: '', instagram: '', cidade: 'Barreiras', segmento: '', origem: 'whatsapp', servicos: [], valor_estimado: null, etapa_id: 1, responsavel_id: null, proximo_contato: null, observacoes: '', motivo_perda: '' }
const limpa = o => { const r = {}; for (const [k, v] of Object.entries(o)) r[k] = v === '' ? null : v; return r }
const CAMPOS_LEAD = Object.keys(vazioLead)
const CAMPOS_CLIENTE = ['nome', 'empresa', 'documento', 'telefone', 'email', 'instagram', 'cidade', 'segmento', 'servicos', 'inicio_contrato', 'status', 'responsavel_id', 'observacoes']
// valor e vencimento ficam em clientes_financeiro, que só o admin lê e grava
const CAMPOS_FIN = ['valor_mensal', 'dia_vencimento']
const pick = (o, ks) => Object.fromEntries(ks.map(k => [k, o[k]]))

// ─── campos do lead ───
function LeadCampos({ f, set }) {
  const { etapas } = useApp()
  const perdido = etapas.find(e => e.id === +f.etapa_id)?.tipo === 'perdido'
  return (
    <>
      <div className="grid2">
        <Field label="Nome *"><Input value={f.nome} onChange={set('nome')} required /></Field>
        <Field label="Empresa"><Input value={f.empresa} onChange={set('empresa')} /></Field>
        <Field label="WhatsApp / telefone"><Input value={f.telefone} onChange={set('telefone')} inputMode="tel" placeholder="(77) 9 9999-9999" /></Field>
        <Field label="Instagram"><Input value={f.instagram} onChange={set('instagram')} placeholder="@empresa" /></Field>
        <Field label="E-mail"><Input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Cidade"><Input value={f.cidade} onChange={set('cidade')} list="cidades" /></Field>
        <Field label="Segmento"><Input value={f.segmento} onChange={set('segmento')} placeholder="clínica, loja, agro…" /></Field>
        <Field label="Origem"><Select value={f.origem} onChange={set('origem')} options={ORIGENS} /></Field>
        <Field label="Etapa do funil"><Select value={f.etapa_id} onChange={v => set('etapa_id')(+v)} options={etapas.map(e => ({ v: e.id, l: e.nome }))} /></Field>
        <Field label="Responsável"><EquipeSelect value={f.responsavel_id} onChange={set('responsavel_id')} /></Field>
        <Field label="Valor estimado (mês)"><Input type="number" min="0" step="50" value={f.valor_estimado} onChange={v => set('valor_estimado')(v === '' ? null : +v)} /></Field>
        <Field label="Próximo contato"><Input type="date" value={f.proximo_contato} onChange={set('proximo_contato')} /></Field>
      </div>
      <Field label="Serviços de interesse"><Chips value={f.servicos || []} onChange={set('servicos')} options={SERVICOS} /></Field>
      {perdido && <Field label="Motivo da perda"><Input value={f.motivo_perda} onChange={set('motivo_perda')} placeholder="preço, sem retorno, fechou com outro…" /></Field>}
      <Field label="Observações"><Text value={f.observacoes} onChange={set('observacoes')} /></Field>
      <datalist id="cidades">{CIDADES.map(c => <option key={c} value={c} />)}</datalist>
    </>
  )
}

export function NovoLead({ onClose, onSaved, etapaInicial = 1 }) {
  const run = useRun()
  const [f, setF] = useState({ ...vazioLead, etapa_id: etapaInicial })
  const set = k => v => setF(o => ({ ...o, [k]: v }))
  const salvar = async e => {
    e.preventDefault()
    const r = await run(() => q(sb.from('leads').insert(limpa(f)).select().single()), 'Lead criado!')
    if (r) { onSaved && onSaved(r); onClose() }
  }
  return <Modal title="Novo lead" onClose={onClose}><form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}><LeadCampos f={f} set={set} /><div className="actions"><button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button><button className="btn">Salvar lead</button></div></form></Modal>
}

export function LeadDrawer({ id, onClose, onChanged }) {
  const { etapas, admin } = useApp()
  const run = useRun()
  const [f, setF] = useState(null)
  const [naoAchou, setNaoAchou] = useState(false)
  const [sujo, setSujo] = useState(false)
  const [convertendo, setConvertendo] = useState(false)
  const [hv, setHv] = useState(0) // muda → histórico recarrega
  const carregar = useCallback(async () => {
    const l = await run(() => q(sb.from('leads').select('*').eq('id', id).maybeSingle()))
    if (l === null) setNaoAchou(true)
    else if (l) { setF(l); setSujo(false) }
  }, [id, run])
  useEffect(() => { carregar() }, [carregar])
  const set = k => v => { setF(o => ({ ...o, [k]: v })); setSujo(true) }
  const fechar = () => { if (!sujo || confirmar('Descartar as alterações que não foram salvas?')) onClose() }

  if (naoAchou) return <Drawer title="Lead" onClose={onClose}><Empty title="Lead não encontrado">Pode ter sido apagado.</Empty></Drawer>
  if (!f) return <Drawer title="Lead" onClose={onClose}><Spinner /></Drawer>
  const salvar = async e => {
    e && e.preventDefault()
    const ok = await run(() => q(sb.from('leads').update(limpa(pick(f, CAMPOS_LEAD))).eq('id', id)), 'Salvo!') !== undefined
    if (ok) { setSujo(false); setHv(v => v + 1); onChanged && onChanged() }
    return ok
  }
  // etapa salva na hora, sem marcar o formulário como alterado; volta atrás se falhar
  const mudarEtapa = async e => {
    if (e.id === f.etapa_id) return
    const antes = f.etapa_id
    setF(o => ({ ...o, etapa_id: e.id }))
    if (await run(() => q(sb.from('leads').update({ etapa_id: e.id }).eq('id', id))) === undefined) setF(o => ({ ...o, etapa_id: antes }))
    else { setHv(v => v + 1); onChanged && onChanged() }
  }
  // uma transação só no banco (converter_lead): sem cliente duplicado se algo falhar no meio
  const converter = async () => {
    if (convertendo || !confirmar(`Transformar ${f.nome} em cliente?`)) return
    setConvertendo(true)
    try {
      if (sujo && !(await salvar())) return
      const cid = await run(() => q(sb.rpc('converter_lead', { p_lead: id })), 'Virou cliente!')
      if (cid) { onChanged && onChanged(); location.hash = `/clientes?id=${cid}` } else carregar()
    } finally { setConvertendo(false) }
  }
  const apagar = async () => { if (confirmar('Apagar este lead e todo o histórico dele?') && await run(() => q(sb.from('leads').delete().eq('id', id)), 'Lead apagado.') !== undefined) { onChanged && onChanged(); onClose() } }
  const wa = linkWhats(f.telefone)
  return (
    <Drawer title={f.nome} onClose={fechar} actions={wa && <a className="btn btn--wa btn--sm" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}>
      <div className="chips">{etapas.map(e => <button key={e.id} type="button" className={`chip${f.etapa_id === e.id ? ' on' : ''}`} onClick={() => mudarEtapa(e)}>{e.nome}</button>)}</div>
      {f.cliente_id && <div className="ok">Já é cliente. <a href={`#/clientes?id=${f.cliente_id}`}>Abrir cliente →</a></div>}
      <form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
        <LeadCampos f={f} set={set} />
        <div className="actions">
          {admin && <button type="button" className="btn btn--danger btn--sm" onClick={apagar}>Apagar</button>}
          {!f.cliente_id && <button type="button" className="btn btn--ghost" onClick={converter} disabled={convertendo}>{convertendo ? 'Convertendo…' : 'Converter em cliente'}</button>}
          <button className="btn" disabled={!sujo}>Salvar alterações</button>
        </div>
      </form>
      <TarefasDe filtro={{ lead_id: id }} onChanged={onChanged} />
      <Historico key={hv} filtro={{ lead_id: id }} />
    </Drawer>
  )
}

// ─── cliente ───
export function NovoCliente({ onClose, onSaved }) {
  const { admin } = useApp()
  const run = useRun()
  const [f, setF] = useState({ nome: '', status: 'ativo', servicos: [], cidade: 'Barreiras', inicio_contrato: hojeISO() })
  const set = k => v => setF(o => ({ ...o, [k]: v }))
  const salvar = async e => {
    e.preventDefault()
    const c = await run(() => q(sb.from('clientes').insert(limpa(pick(f, CAMPOS_CLIENTE))).select().single()), 'Cliente criado!')
    if (!c) return
    if (admin && (f.valor_mensal != null || f.dia_vencimento != null)) await run(() => q(sb.from('clientes_financeiro').insert(limpa({ cliente_id: c.id, ...pick(f, CAMPOS_FIN) }))))
    onSaved && onSaved(c); onClose()
  }
  return <Modal title="Novo cliente" onClose={onClose}><form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}><ClienteCampos f={f} set={set} /><div className="actions"><button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button><button className="btn">Salvar cliente</button></div></form></Modal>
}
function ClienteCampos({ f, set }) {
  const { admin } = useApp()
  return (
    <>
      <div className="grid2">
        <Field label="Nome do contato *"><Input value={f.nome} onChange={set('nome')} required /></Field>
        <Field label="Empresa"><Input value={f.empresa} onChange={set('empresa')} /></Field>
        <Field label="CNPJ / CPF"><Input value={f.documento} onChange={set('documento')} /></Field>
        <Field label="WhatsApp / telefone"><Input value={f.telefone} onChange={set('telefone')} inputMode="tel" /></Field>
        <Field label="E-mail"><Input type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Instagram"><Input value={f.instagram} onChange={set('instagram')} /></Field>
        <Field label="Cidade"><Input value={f.cidade} onChange={set('cidade')} list="cidades" /></Field>
        <Field label="Segmento"><Input value={f.segmento} onChange={set('segmento')} /></Field>
        {admin && <Field label="Valor mensal"><Input type="number" min="0" step="50" value={f.valor_mensal} onChange={v => set('valor_mensal')(v === '' ? null : +v)} /></Field>}
        {admin && <Field label="Dia de vencimento"><Input type="number" min="1" max="31" step="1" value={f.dia_vencimento} onChange={v => set('dia_vencimento')(v === '' ? null : +v)} /></Field>}
        <Field label="Início do contrato"><Input type="date" value={f.inicio_contrato} onChange={set('inicio_contrato')} /></Field>
        <Field label="Status"><Select value={f.status} onChange={set('status')} options={STATUS_CLIENTE} /></Field>
        <Field label="Responsável"><EquipeSelect value={f.responsavel_id} onChange={set('responsavel_id')} /></Field>
      </div>
      <Field label="Serviços contratados"><Chips value={f.servicos || []} onChange={set('servicos')} options={SERVICOS} /></Field>
      <Field label="Observações"><Text value={f.observacoes} onChange={set('observacoes')} /></Field>
      <datalist id="cidades">{CIDADES.map(c => <option key={c} value={c} />)}</datalist>
    </>
  )
}

export function ClienteDrawer({ id, onClose, onChanged }) {
  const { admin } = useApp()
  const run = useRun()
  const [f, setF] = useState(null)
  const [naoAchou, setNaoAchou] = useState(false)
  const [sujo, setSujo] = useState(false)
  const carregar = useCallback(async () => {
    const r = await run(async () => {
      const [c, fin] = await Promise.all([
        q(sb.from('clientes').select('*').eq('id', id).maybeSingle()),
        admin ? q(sb.from('clientes_financeiro').select('valor_mensal,dia_vencimento').eq('cliente_id', id).maybeSingle()) : null,
      ])
      return { c, fin }
    })
    if (!r) return
    if (!r.c) return setNaoAchou(true)
    setF({ ...r.c, ...(r.fin || {}) }); setSujo(false)
  }, [id, run, admin])
  useEffect(() => { carregar() }, [carregar])
  const set = k => v => { setF(o => ({ ...o, [k]: v })); setSujo(true) }
  const fechar = () => { if (!sujo || confirmar('Descartar as alterações que não foram salvas?')) onClose() }
  if (naoAchou) return <Drawer title="Cliente" onClose={onClose}><Empty title="Cliente não encontrado">Pode ter sido apagado.</Empty></Drawer>
  if (!f) return <Drawer title="Cliente" onClose={onClose}><Spinner /></Drawer>
  const salvar = async e => {
    e.preventDefault()
    const ok = await run(async () => {
      await q(sb.from('clientes').update(limpa(pick(f, CAMPOS_CLIENTE))).eq('id', id))
      if (admin) await q(sb.from('clientes_financeiro').upsert(limpa({ cliente_id: id, ...pick(f, CAMPOS_FIN), atualizado_em: new Date().toISOString() })))
      return true
    }, 'Salvo!')
    if (ok) { setSujo(false); onChanged && onChanged() }
  }
  const apagar = async () => { if (confirmar('Apagar este cliente, as tarefas, o histórico e as cobranças dele?') && await run(() => q(sb.from('clientes').delete().eq('id', id)), 'Cliente apagado.') !== undefined) { onChanged && onChanged(); onClose() } }
  const wa = linkWhats(f.telefone)
  return (
    <Drawer title={f.empresa || f.nome} onClose={fechar} actions={wa && <a className="btn btn--wa btn--sm" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}>
      <form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
        <ClienteCampos f={f} set={set} />
        <div className="actions">
          {admin && <button type="button" className="btn btn--danger btn--sm" onClick={apagar}>Apagar</button>}
          <button className="btn" disabled={!sujo}>Salvar alterações</button>
        </div>
      </form>
      <TarefasDe filtro={{ cliente_id: id }} onChanged={onChanged} />
      {admin && <CobrancasDe cliente={f} />}
      <Historico filtro={{ cliente_id: id }} />
    </Drawer>
  )
}

// ─── histórico (atividades) ───
function Historico({ filtro }) {
  const { nomeDe, sessao } = useApp()
  const run = useRun()
  const [itens, setItens] = useState(null)
  const [novo, setNovo] = useState({ tipo: 'nota', texto: '' })
  const chave = JSON.stringify(filtro)
  const carregar = useCallback(async () => {
    let r = sb.from('atividades').select('*').order('criado_em', { ascending: false }).limit(100)
    for (const [k, v] of Object.entries(filtro)) r = r.eq(k, v)
    setItens(await run(() => q(r)) || [])
  }, [chave, run]) // eslint-disable-line
  useEffect(() => { carregar() }, [carregar])
  const add = async e => {
    e.preventDefault(); if (!novo.texto.trim()) return
    if (await run(() => q(sb.from('atividades').insert({ ...filtro, tipo: novo.tipo, texto: novo.texto.trim(), autor_id: sessao.user.id }))) !== undefined) { setNovo({ ...novo, texto: '' }); carregar() }
  }
  return (
    <section>
      <div className="section-title" style={{ marginBottom: 10 }}>Histórico</div>
      <form className="composer" onSubmit={add}>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 150 }}><Select value={novo.tipo} onChange={v => setNovo({ ...novo, tipo: v })} options={Object.fromEntries(Object.entries(TIPOS_ATIVIDADE).filter(([k]) => !['etapa', 'sistema'].includes(k)))} /></div>
          <div style={{ flex: 1 }}><Input value={novo.texto} onChange={v => setNovo({ ...novo, texto: v })} placeholder="O que aconteceu? Ex.: liguei, pediu proposta até sexta" /></div>
          <button className="btn">Registrar</button>
        </div>
      </form>
      {!itens ? <Spinner /> : !itens.length ? <Empty title="Nada registrado ainda">Anote ligações, conversas e combinados aqui.</Empty> : (
        <div className="timeline" style={{ marginTop: 14 }}>
          {itens.map(a => (
            <div key={a.id} className={`tl ${a.tipo}`}>
              <Avatar nome={nomeDe(a.autor_id)} light />
              <div><small><b>{TIPOS_ATIVIDADE[a.tipo]}</b> · {nomeDe(a.autor_id) || 'Sistema'} · {dataHora(a.criado_em)}</small><p>{a.texto}</p></div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── tarefas ligadas a um lead/cliente ───
function TarefasDe({ filtro, onChanged }) {
  const { nomeDe } = useApp()
  const run = useRun()
  const [itens, setItens] = useState(null)
  const [aberta, setAberta] = useState(null)
  const chave = JSON.stringify(filtro)
  const carregar = useCallback(async () => {
    let r = sb.from('tarefas').select('*').order('status').order('prazo', { nullsFirst: false })
    for (const [k, v] of Object.entries(filtro)) r = r.eq(k, v)
    setItens(await run(() => q(r)) || [])
  }, [chave, run]) // eslint-disable-line
  useEffect(() => { carregar() }, [carregar])
  const mudou = () => { carregar(); onChanged && onChanged() } // avisa a lista de fora (contagem de tarefas do cliente)
  const alternar = async t => { await run(() => q(sb.from('tarefas').update({ status: t.status === 'feito' ? 'a_fazer' : 'feito' }).eq('id', t.id))); mudou() }
  return (
    <section>
      <div className="section-title" style={{ marginBottom: 6 }}>Tarefas <button className="btn btn--sm btn--ghost" onClick={() => setAberta({ ...filtro })}>+ Tarefa</button></div>
      {!itens ? <Spinner /> : !itens.length ? <p className="muted" style={{ margin: 0 }}>Nenhuma tarefa.</p> : (
        <div className="list card" style={{ padding: '4px 12px' }}>
          {itens.map(t => (
            <div key={t.id} className={`row${t.status === 'feito' ? ' task-done' : ''}`} onClick={() => setAberta(t)}>
              <span className={`check${t.status === 'feito' ? ' on' : ''}`} onClick={e => { e.stopPropagation(); alternar(t) }} role="checkbox" aria-checked={t.status === 'feito'}>{t.status === 'feito' ? '✓' : ''}</span>
              <div className="grow"><b>{t.titulo}</b><small>{TIPOS_TAREFA[t.tipo]} · {STATUS_TAREFA[t.status]}{t.prazo ? ` · ${dataBR(t.prazo)}` : ''}</small></div>
              {atrasada(t) && <span className="badge red">Atrasada</span>}
              <Avatar nome={nomeDe(t.responsavel_id)} light />
            </div>
          ))}
        </div>
      )}
      {aberta && <TarefaModal tarefa={aberta} onClose={() => setAberta(null)} onSaved={mudou} />}
    </section>
  )
}

// ─── modal de tarefa (nova ou edição) ───
export function TarefaModal({ tarefa, onClose, onSaved }) {
  const { admin, sessao } = useApp()
  const run = useRun()
  const nova = !tarefa.id
  const [f, setF] = useState({ titulo: '', descricao: '', tipo: 'post', status: 'a_fazer', prioridade: 'media', prazo: null, responsavel_id: sessao.user.id, cliente_id: null, lead_id: null, ...tarefa })
  const [clientes, setClientes] = useState([])
  useEffect(() => { sb.from('clientes').select('id,nome,empresa').neq('status', 'encerrado').order('empresa').then(({ data }) => setClientes(data || [])) }, [])
  const set = k => v => setF(o => ({ ...o, [k]: v }))
  const salvar = async e => {
    e.preventDefault()
    const dados = limpa(pick(f, ['titulo', 'descricao', 'tipo', 'status', 'prioridade', 'prazo', 'responsavel_id', 'cliente_id', 'lead_id']))
    const r = await run(() => nova ? q(sb.from('tarefas').insert(dados)) : q(sb.from('tarefas').update(dados).eq('id', f.id)), nova ? 'Tarefa criada!' : 'Tarefa salva!')
    if (r !== undefined) { onSaved && onSaved(); onClose() }
  }
  const apagar = async () => { if (confirmar('Apagar esta tarefa?') && await run(() => q(sb.from('tarefas').delete().eq('id', f.id)), 'Tarefa apagada.') !== undefined) { onSaved && onSaved(); onClose() } }
  return (
    <Modal title={nova ? 'Nova tarefa' : 'Tarefa'} onClose={onClose}>
      <form onSubmit={salvar} style={{ display: 'grid', gap: 14 }}>
        <Field label="Título *"><Input value={f.titulo} onChange={set('titulo')} required placeholder="Ex.: 3 posts da semana — Loja X" /></Field>
        <div className="grid3">
          <Field label="Tipo"><Select value={f.tipo} onChange={set('tipo')} options={TIPOS_TAREFA} /></Field>
          <Field label="Status"><Select value={f.status} onChange={set('status')} options={STATUS_TAREFA} /></Field>
          <Field label="Prioridade"><Select value={f.prioridade} onChange={set('prioridade')} options={PRIORIDADES} /></Field>
          <Field label="Prazo"><Input type="date" value={f.prazo} onChange={set('prazo')} /></Field>
          <Field label="Responsável"><EquipeSelect value={f.responsavel_id} onChange={set('responsavel_id')} /></Field>
          <Field label="Cliente"><Select value={f.cliente_id} onChange={set('cliente_id')} empty="—" options={clientes.map(c => ({ v: c.id, l: c.empresa || c.nome }))} /></Field>
        </div>
        <Field label="Detalhes"><Text value={f.descricao} onChange={set('descricao')} placeholder="Briefing, links, referências…" /></Field>
        <div className="actions">
          {!nova && (admin || f.criado_por === sessao.user.id) && <button type="button" className="btn btn--danger btn--sm" onClick={apagar}>Apagar</button>}
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button className="btn">{nova ? 'Criar tarefa' : 'Salvar'}</button>
        </div>
      </form>
    </Modal>
  )
}

// ─── cobranças de um cliente (só admin) ───
function CobrancasDe({ cliente }) {
  const run = useRun()
  const [itens, setItens] = useState(null)
  const carregar = useCallback(async () => setItens(await run(() => q(sb.from('cobrancas').select('*').eq('cliente_id', cliente.id).order('competencia', { ascending: false }).limit(24))) || []), [cliente.id, run])
  useEffect(() => { carregar() }, [carregar])
  const pagar = async c => {
    if (c.status === 'cancelado') return // cancelada só muda pelo Financeiro, de propósito
    await run(() => q(sb.from('cobrancas').update(c.status === 'pago' ? { status: 'pendente', pago_em: null } : { status: 'pago', pago_em: hojeISO() }).eq('id', c.id))); carregar()
  }
  return (
    <section>
      <div className="section-title" style={{ marginBottom: 6 }}>Cobranças</div>
      {!itens ? <Spinner /> : !itens.length ? <p className="muted" style={{ margin: 0 }}>Nenhuma cobrança. Gere as do mês em <a href="#/financeiro">Financeiro</a>.</p> : (
        <div className="list card" style={{ padding: '4px 12px' }}>
          {itens.map(c => (
            <div key={c.id} className="row" onClick={() => pagar(c)} title={c.status === 'cancelado' ? 'Cancelada' : 'Clique para marcar como pago/pendente'}>
              <div className="grow"><b>{new Date(c.competencia + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</b><small>vence {dataBR(c.vencimento)}{c.pago_em ? ` · pago em ${dataBR(c.pago_em)}` : ''}</small></div>
              <b>{brl(c.valor)}</b>
              <span className={`badge ${c.status === 'pago' ? 'green' : c.status === 'cancelado' ? '' : c.status === 'pendente' && c.vencimento && c.vencimento < hojeISO() ? 'red' : 'amber'}`}>{c.status === 'pendente' && c.vencimento && c.vencimento < hojeISO() ? 'Atrasado' : STATUS_COBRANCA[c.status]}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
