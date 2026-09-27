import React, { useState } from 'react'
import { sb, q } from '../lib.js'
import { Field, Input } from '../ui.jsx'

const voltarPara = () => `${location.origin}/crm/`

export default function Login({ erroLink }) {
  const [aba, setAba] = useState('entrar')
  const [f, setF] = useState({ nome: '', email: '', senha: '' })
  const [msg, setMsg] = useState(erroLink ? { ok: false, t: erroLink } : null)
  const [busy, setBusy] = useState(false)
  const set = k => v => setF(o => ({ ...o, [k]: v }))

  const enviar = async e => {
    e.preventDefault(); setMsg(null); setBusy(true)
    try {
      if (aba === 'entrar') await q(sb.auth.signInWithPassword({ email: f.email.trim(), password: f.senha }))
      else if (aba === 'criar') {
        if (f.nome.trim().length < 2) throw new Error('Coloque seu nome.')
        const r = await q(sb.auth.signUp({ email: f.email.trim(), password: f.senha, options: { data: { nome: f.nome.trim() }, emailRedirectTo: voltarPara() } }))
        setMsg({ ok: true, t: r.session ? 'Conta criada! Agora um administrador precisa aprovar seu acesso.' : 'Conta criada! Confirme pelo link que mandamos no seu e-mail. Depois disso, um administrador aprova seu acesso.' })
      } else {
        await q(sb.auth.resetPasswordForEmail(f.email.trim(), { redirectTo: voltarPara() }))
        setMsg({ ok: true, t: 'Se esse e-mail tiver conta, você vai receber um link para criar uma nova senha.' })
      }
    } catch (err) { setMsg({ ok: false, t: err.message }) } finally { setBusy(false) }
  }

  return (
    <div className="auth">
      <div className="auth__art">
        <img src="/crm/logo-viva.png" alt="Agência Viva" />
        <h1>Tudo da Viva num <span className="s">lugar só.</span></h1>
        <p style={{ color: '#bdb9b1', maxWidth: '34ch' }}>Funil, leads, clientes e tarefas da operação. Acesso só para a equipe.</p>
      </div>
      <div className="auth__form">
        <form className="auth__box" onSubmit={enviar}>
          <h2>{aba === 'entrar' ? 'Entrar' : aba === 'criar' ? 'Criar conta' : 'Recuperar senha'}</h2>
          {aba !== 'recuperar' && (
            <div className="tabs" role="tablist">
              <button type="button" className={aba === 'entrar' ? 'on' : ''} onClick={() => { setAba('entrar'); setMsg(null) }}>Entrar</button>
              <button type="button" className={aba === 'criar' ? 'on' : ''} onClick={() => { setAba('criar'); setMsg(null) }}>Criar conta</button>
            </div>
          )}
          {aba === 'criar' && <Field label="Nome"><Input value={f.nome} onChange={set('nome')} autoComplete="name" required /></Field>}
          <Field label="E-mail"><Input type="email" value={f.email} onChange={set('email')} autoComplete="email" required /></Field>
          {aba !== 'recuperar' && <Field label="Senha"><Input type="password" value={f.senha} onChange={set('senha')} autoComplete={aba === 'criar' ? 'new-password' : 'current-password'} minLength={6} required /></Field>}
          {msg && <div className={msg.ok ? 'ok' : 'err'}>{msg.t}</div>}
          <button className="btn" disabled={busy}>{busy ? 'Aguarde…' : aba === 'entrar' ? 'Entrar' : aba === 'criar' ? 'Criar conta' : 'Enviar link'}</button>
          {aba === 'entrar' && <button type="button" className="link" onClick={() => { setAba('recuperar'); setMsg(null) }}>Esqueci minha senha</button>}
          {aba === 'recuperar' && <button type="button" className="link" onClick={() => { setAba('entrar'); setMsg(null) }}>Voltar para o login</button>}
          <a className="link" href="/">← Voltar ao site</a>
        </form>
      </div>
    </div>
  )
}

export function NovaSenha({ onDone, onCancel }) {
  const [s, setS] = useState('')
  const [msg, setMsg] = useState(null)
  const salvar = async e => {
    e.preventDefault()
    try { await q(sb.auth.updateUser({ password: s })); onDone() } catch (err) { setMsg(err.message) }
  }
  return (
    <div className="auth">
      <div className="auth__art"><img src="/crm/logo-viva.png" alt="Agência Viva" /><h1>Nova <span className="s">senha.</span></h1><span /></div>
      <div className="auth__form">
        <form className="auth__box" onSubmit={salvar}>
          <h2>Criar nova senha</h2>
          <Field label="Nova senha"><Input type="password" value={s} onChange={setS} minLength={6} autoComplete="new-password" required /></Field>
          {msg && <div className="err">{msg}</div>}
          <button className="btn">Salvar senha</button>
          {onCancel && <button type="button" className="link" onClick={onCancel}>Agora não</button>}
        </form>
      </div>
    </div>
  )
}
