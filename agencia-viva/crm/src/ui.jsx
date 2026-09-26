import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { iniciais } from './lib.js'

// ─── contexto global: sessão, perfil, equipe, etapas, avisos ───
export const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function useToast() {
  const [t, setT] = useState(null)
  const show = useCallback((msg, bad = false) => { setT({ msg, bad }); clearTimeout(show.h); show.h = setTimeout(() => setT(null), 3200) }, [])
  const node = t ? <div className={`toast${t.bad ? ' bad' : ''}`} role="status">{t.msg}</div> : null
  return [show, node]
}

// executa uma ação e mostra o erro, se houver
export function useRun() {
  const { toast } = useApp()
  return useCallback(async (fn, okMsg) => {
    try { const r = await fn(); if (okMsg) toast(okMsg); return r } catch (e) { toast(e.message || 'Algo deu errado.', true); return undefined }
  }, [toast])
}

export function Icon({ n }) {
  const p = {
    home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    funil: 'M3 4h18l-7 9v6l-4 2v-8z',
    leads: 'M16 11a4 4 0 1 0-8 0M4 20c1.5-4 5-5 8-5s6.5 1 8 5',
    clientes: 'M4 7h16v13H4zM9 7V4h6v3M4 12h16',
    tarefas: 'M9 11l3 3 8-8M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h11',
    financeiro: 'M12 3v18M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6',
    equipe: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a3 3 0 1 0 0-6M3 20c.8-3 3.2-5 6-5s5.2 2 6 5M16 15c2.5 0 4.4 2 5 5',
  }[n]
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={p} /></svg>
}

export function Avatar({ nome, light }) {
  return <span className={`av${light ? ' av--light' : ''}`} title={nome || 'Sem responsável'}>{nome ? iniciais(nome) : '—'}</span>
}

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>
}

export function Input({ value, onChange, ...p }) {
  return <input className="input" value={value ?? ''} onChange={e => onChange(e.target.value)} {...p} />
}
export function Text({ value, onChange, ...p }) {
  return <textarea className="input" value={value ?? ''} onChange={e => onChange(e.target.value)} {...p} />
}
export function Select({ value, onChange, options, empty, ...p }) {
  const opts = Array.isArray(options) ? options.map(o => (typeof o === 'object' ? o : { v: o, l: o })) : Object.entries(options).map(([v, l]) => ({ v, l }))
  return (
    <select className="input" value={value ?? ''} onChange={e => onChange(e.target.value === '' ? null : e.target.value)} {...p}>
      {empty !== undefined && <option value="">{empty}</option>}
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  )
}
export function Chips({ value = [], onChange, options }) {
  const tog = o => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o])
  return <div className="chips">{options.map(o => <button type="button" key={o} className={`chip${value.includes(o) ? ' on' : ''}`} onClick={() => tog(o)}>{o}</button>)}</div>
}
export function EquipeSelect({ value, onChange, empty = 'Sem responsável' }) {
  const { equipe } = useApp()
  return <Select value={value} onChange={onChange} empty={empty} options={equipe.filter(p => p.ativo).map(p => ({ v: p.id, l: p.nome }))} />
}

export function Drawer({ title, onClose, children, actions }) {
  useEsc(onClose)
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer__head"><h2>{title}</h2>{actions}<button className="iconbtn" onClick={onClose} aria-label="Fechar">×</button></div>
        <div className="drawer__body">{children}</div>
      </aside>
    </>
  )
}
export function Modal({ title, onClose, children }) {
  useEsc(onClose)
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}><h2>{title}</h2>{children}</div>
    </>
  )
}
function useEsc(fn) {
  useEffect(() => { const h = e => e.key === 'Escape' && fn(); addEventListener('keydown', h); return () => removeEventListener('keydown', h) }, [fn])
}

export function Empty({ title, children }) {
  return <div className="empty"><b>{title}</b>{children}</div>
}
export const Spinner = () => <div className="spin" aria-label="Carregando" />

export function confirmar(msg) { return window.confirm(msg) }
