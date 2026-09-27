import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { sb, q } from './lib.js'
import { Ctx, useToast, Icon, Spinner } from './ui.jsx'
import Login, { NovaSenha } from './pages/Login.jsx'
import Painel from './pages/Painel.jsx'
import Funil from './pages/Funil.jsx'
import Leads from './pages/Leads.jsx'
import Clientes from './pages/Clientes.jsx'
import Tarefas from './pages/Tarefas.jsx'
import Financeiro from './pages/Financeiro.jsx'
import Equipe from './pages/Equipe.jsx'

const ROTAS = [
  ['painel', 'Painel', 'home', Painel],
  ['funil', 'Funil', 'funil', Funil],
  ['leads', 'Leads', 'leads', Leads],
  ['clientes', 'Clientes', 'clientes', Clientes],
  ['tarefas', 'Tarefas', 'tarefas', Tarefas],
  ['financeiro', 'Financeiro', 'financeiro', Financeiro, true],
  ['equipe', 'Equipe', 'equipe', Equipe, true],
]

// rota por hash: #/leads?id=... (funciona em hospedagem estática)
function useRota() {
  const ler = () => {
    const [p, qs] = location.hash.replace(/^#\/?/, '').split('?')
    return { pagina: p || 'painel', params: Object.fromEntries(new URLSearchParams(qs || '')) }
  }
  const [r, setR] = useState(ler)
  useEffect(() => { const h = () => setR(ler()); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h) }, [])
  return r
}
export const ir = (pagina, params) => { location.hash = `/${pagina}${params ? '?' + new URLSearchParams(params) : ''}` }

// link do e-mail vencido ou já usado: o Supabase volta com #error=...&error_code=otp_expired na URL
const erroDoLink = (() => {
  const p = new URLSearchParams(`${location.hash.replace(/^#\/?/, '')}&${location.search.slice(1)}`)
  const code = p.get('error_code'), desc = p.get('error_description')
  if (!code && !desc) return null
  history.replaceState(null, '', location.pathname + '#/')
  return code === 'otp_expired'
    ? 'Esse link expirou ou já foi usado. Se era pra criar senha nova, peça outro em "Esqueci minha senha". Se era a confirmação do cadastro, tente entrar.'
    : desc || 'Não deu pra abrir esse link. Tente de novo.'
})()

// a tela de nova senha sobrevive a um recarregar da página
const flagSenha = v => { try { if (v === undefined) return sessionStorage.getItem('viva-senha') === '1'; v ? sessionStorage.setItem('viva-senha', '1') : sessionStorage.removeItem('viva-senha') } catch { return false } }

export default function App() {
  const [sessao, setSessao] = useState(undefined)
  const [perfil, setPerfil] = useState(null)
  const [equipe, setEquipe] = useState([])
  const [etapas, setEtapas] = useState([])
  const [toast, toastNode] = useToast()
  const [menu, setMenu] = useState(false)
  const [recuperando, setRecuperandoSt] = useState(() => flagSenha())
  const setRecuperando = useCallback(v => { flagSenha(v); setRecuperandoSt(v) }, [])
  const [erroBase, setErroBase] = useState(null)
  const rota = useRota()

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = sb.auth.onAuthStateChange((e, s) => { setSessao(s); if (e === 'PASSWORD_RECOVERY') setRecuperando(true); if (e === 'SIGNED_OUT') setRecuperando(false) })
    return () => data.subscription.unsubscribe()
  }, [setRecuperando])

  // devolve o perfil carregado; se nem o perfil vier, mostra a tela de erro com "tentar de novo"
  const carregarBase = useCallback(async () => {
    setErroBase(null)
    if (!sessao) { setPerfil(null); return null }
    let eu
    try { eu = await q(sb.from('perfis').select('*').eq('id', sessao.user.id).maybeSingle()) } catch (e) { setErroBase(e.message); return null }
    const p = eu || { ativo: false, email: sessao.user.email }
    setPerfil(p)
    if (p.ativo) {
      const [eq, et] = await Promise.all([q(sb.from('perfis').select('*').order('nome')), q(sb.from('etapas').select('*').order('ordem'))])
      setEquipe(eq); setEtapas(et)
    }
    return p
  }, [sessao])
  useEffect(() => { carregarBase().catch(e => toast(e.message, true)) }, [carregarBase, toast])
  useEffect(() => setMenu(false), [rota.pagina])

  const ctx = useMemo(() => ({ sessao, perfil, equipe, etapas, toast, admin: perfil?.papel === 'admin' && perfil?.ativo, recarregarBase: carregarBase, rota }), [sessao, perfil, equipe, etapas, toast, carregarBase, rota])
  const nomeDe = useCallback(id => equipe.find(p => p.id === id)?.nome, [equipe])

  const atualizarAprovacao = async () => {
    try { const p = await carregarBase(); if (p && !p.ativo) toast('Ainda não liberado. Fale com um administrador da Viva.') } catch (e) { toast(e.message, true) }
  }

  if (sessao === undefined) return <Spinner />
  if (recuperando && sessao) return <Ctx.Provider value={ctx}><NovaSenha onDone={() => { setRecuperando(false); toast('Senha atualizada!') }} onCancel={() => setRecuperando(false)} />{toastNode}</Ctx.Provider>
  if (!sessao) return <Ctx.Provider value={ctx}><Login erroLink={erroDoLink} />{toastNode}</Ctx.Provider>
  if (!perfil && erroBase) return (
    <Ctx.Provider value={ctx}>
      <div className="auth"><div className="auth__art"><img src="/crm/logo-viva.png" alt="Agência Viva" /><h1>Opa, <span className="s">travou.</span></h1><span /></div>
        <div className="auth__form"><div className="auth__box">
          <h2>Não deu pra carregar sua conta</h2>
          <div className="err">{erroBase}</div>
          <button className="btn" onClick={atualizarAprovacao}>Tentar de novo</button>
          <button className="link" onClick={() => sb.auth.signOut()}>Sair</button>
        </div></div></div>
      {toastNode}
    </Ctx.Provider>
  )
  if (!perfil) return <Spinner />
  if (!perfil.ativo) return (
    <Ctx.Provider value={ctx}>
      <div className="auth"><div className="auth__art"><img src="/crm/logo-viva.png" alt="Agência Viva" /><h1>Quase <span className="s">lá.</span></h1><span /></div>
        <div className="auth__form"><div className="auth__box">
          <h2>Aguardando aprovação</h2>
          <p className="muted">Sua conta ({perfil.email}) foi criada. Um administrador da Viva precisa liberar seu acesso em <b>Equipe</b>. Assim que for aprovado, é só atualizar esta página.</p>
          <button className="btn" onClick={atualizarAprovacao}>Já fui aprovado, atualizar</button>
          <button className="link" onClick={() => sb.auth.signOut()}>Sair</button>
        </div></div></div>
      {toastNode}
    </Ctx.Provider>
  )

  const rotas = ROTAS.filter(r => !r[4] || ctx.admin)
  const atual = rotas.find(r => r[0] === rota.pagina) || rotas[0]
  const Page = atual[3]
  return (
    <Ctx.Provider value={{ ...ctx, nomeDe }}>
      <div className={`app${menu ? ' menu' : ''}`}>
        <div className="mtop"><img src="/crm/logo-viva.png" alt="Agência Viva" /><button onClick={() => setMenu(true)}>Menu</button></div>
        <nav className="side" aria-label="CRM" onClick={e => e.target === e.currentTarget && setMenu(false)}>
          <img src="/crm/logo-viva.png" alt="Agência Viva" />
          {rotas.map(([id, nome, ic]) => <a key={id} href={`#/${id}`} className={atual[0] === id ? 'on' : ''}><Icon n={ic} />{nome}</a>)}
          <div className="side__foot"><b>{perfil.nome}</b>{perfil.papel === 'admin' ? 'Administrador' : 'Equipe'}<br /><button className="link" onClick={() => setRecuperando(true)}>Trocar senha</button> · <button className="link" onClick={() => sb.auth.signOut()}>Sair</button></div>
        </nav>
        <main className="main"><Page key={atual[0]} params={rota.params} /></main>
      </div>
      {toastNode}
    </Ctx.Provider>
  )
}
