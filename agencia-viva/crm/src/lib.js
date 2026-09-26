import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_KEY } from './config.js'

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } })

export const brl = v => v == null || v === '' ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
export const dataBR = d => d ? new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR') : '—'
export const dataHora = d => d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''
export const hojeISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10) }
export const atrasada = t => t.prazo && t.status !== 'feito' && t.prazo < hojeISO()
export const soDigitos = s => (s || '').replace(/\D/g, '')
export const linkWhats = tel => { const d = soDigitos(tel); return d ? `https://wa.me/${d.length <= 11 ? '55' + d : d}` : null }
export const iniciais = n => (n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()

// lança erro legível do Supabase
export async function q(promise) {
  const { data, error } = await promise
  if (error) throw new Error(traduz(error.message))
  return data
}
function traduz(m) {
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (/User already registered/i.test(m)) return 'Esse e-mail já tem conta. Tente entrar.'
  if (/Password should be/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/row-level security/i.test(m)) return 'Você não tem permissão para isso.'
  return m
}
