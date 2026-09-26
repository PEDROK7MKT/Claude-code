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

export default function App() {
  const [sessao, setSessao] = useState(undefined)
  const [perfil, setPerfil] = useState(null)
  const [equipe, setEquipe] = useState([])
  const [etapas, setEtapas] = useState([])
  const [toast, toastNode] = useToast()
  const [menu, setMenu] = useState(false)
  const [recuperando, setRecuperando] = useState(false)
  const rota = useRota()

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = sb.auth.onAuthStateChange((e, s) => { setSessao(s); if (e === 'PASSWORD_RECOVERY') setRecuperando(true) })
    return () => data.subscription.unsubscribe()
  }, [])

  const carregarBase = useCallback(async () => {
    if (!sessao) { setPerfil(null); return }
    const eu = await q(sb.from('perfis').select('*').eq('id', sessao.user.id).maybeSingle())
    setPerfil(eu || { ativo: false, email: sessao.user.email })
    if (eu && eu.ativo) {
      const [eq, et] = await Promise.all([q(sb.from('perfis').select('*').order('nome')), q(sb.from('etapas').select('*').order('ordem'))])
      setEquipe(eq); setEtapas(et)
    }
  }, [sessao])
  useEffect(() => { carregarBase().catch(e => toast(e.message, true)) }, [carregarBase, toast])
  useEffect(() => setMenu(false), [rota.pagina])

  const ctx = useMemo(() => ({ sessao, perfil, equipe, etapas, toast, admin: perfil?.papel === 'admin' && perfil?.ativo, recarregarBase: carregarBase, rota }), [sessao, perfil, equipe, etapas, toast, carregarBase, rota])
  const nomeDe = useCallback(id => equipe.find(p => p.id === id)?.nome, [equipe])

  if (sessao === undefined) return <Spinner />
  if (recuperando && sessao) return <Ctx.Provider value={ctx}><NovaSenha onDone={() => { setRecuperando(false); toast('Senha atualizada!') }} />{toastNode}</Ctx.Provider>
  if (!sessao) return <Ctx.Provider value={ctx}><Login />{toastNode}</Ctx.Provider>
  if (!perfil) return <Spinner />
  if (!perfil.ativo) return (
    <Ctx.Provider value={ctx}>
      <div className="auth"><div className="auth__art"><img src="/crm/logo-viva.png" alt="Agência Viva" /><h1>Quase <span className="s">lá.</span></h1><span /></div>
        <div className="auth__form"><div className="auth__box">
          <h2>Aguardando aprovação</h2>
          <p className="muted">Sua conta ({perfil.email}) foi criada. Um administrador da Viva precisa liberar seu acesso em <b>Equipe</b>. Assim que for aprovado, é só atualizar esta página.</p>
          <button className="btn" onClick={() => carregarBase()}>Já fui aprovado, atualizar</button>
          <button className="link" onClick={() => sb.auth.signOut()}>Sair</button>
        </div></div></div>
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
          <div className="side__foot"><b>{perfil.nome}</b>{perfil.papel === 'admin' ? 'Administrador' : 'Equipe'}<br /><button className="link" onClick={() => sb.auth.signOut()}>Sair</button></div>
        </nav>
        <main className="main"><Page key={atual[0]} params={rota.params} /></main>
      </div>
      {toastNode}
    </Ctx.Provider>
  )
}
