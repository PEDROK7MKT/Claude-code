// cliente do Supabase (na prévia de demonstração, vira um banco de mentira em memória: vite --mode demo)
export { sb } from './cliente.js'

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
export function traduz(m = '') {
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (/User already registered/i.test(m)) return 'Esse e-mail já tem conta. Tente entrar.'
  if (/different from the old password/i.test(m)) return 'A nova senha precisa ser diferente da atual.'
  if (/Password should be at least/i.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (/rate limit|too many requests/i.test(m)) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'
  if (/row-level security|permission denied/i.test(m)) return 'Você não tem permissão para isso.'
  if (/multiple \(or no\) rows|PGRST116/i.test(m)) return 'Registro não encontrado. Pode ter sido apagado.'
  if (/null value in column "nome"/i.test(m)) return 'Preencha o nome.'
  if (/dia_vencimento/i.test(m)) return 'O dia de vencimento vai de 1 a 31.'
  if (/violates check constraint/i.test(m)) return 'Algum campo está com um valor fora do permitido.'
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Sem conexão com o servidor. Confira a internet e tente de novo.'
  return m
}
