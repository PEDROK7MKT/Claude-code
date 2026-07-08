import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_GOALS,
  STAGES,
  loadState,
  saveState,
  seedLeads,
  todayKey,
  uid,
} from './model.js'
import { BatEmblem, IconArchive, IconBriefcase, IconChat, IconFunnel, IconGrid, IconRadar, IconShip, IconVault } from './icons.jsx'
import GoalsBoard from './components/GoalsBoard.jsx'
import StatTiles from './components/StatTiles.jsx'
import LeadForm from './components/LeadForm.jsx'
import ScoreGuide from './components/ScoreGuide.jsx'
import Kanban from './components/Kanban.jsx'
import RadarView from './components/RadarView.jsx'
import ScriptsView from './components/ScriptsView.jsx'
import ProposalView from './components/ProposalView.jsx'
import ImportCalc from './components/ImportCalc.jsx'
import FinanceView from './components/FinanceView.jsx'
import NotesView from './components/NotesView.jsx'
import { BootScreen, CountUp, HudFrame, LiveClock, MagneticButton, StatusTicker } from './components/Fx.jsx'
import Cursor from './components/Cursor.jsx'

// three.js só é carregado/executado se o modo total estiver ativo
const ParticleCave = lazy(() => import('./components/ParticleCave.jsx'))
import { AnimatePresence, motion } from 'framer-motion'
import Lenis from 'lenis'
import { kvGet, kvSet } from './storage.js'
import { IconBolt } from './icons.jsx'

const NAV = [
  { id: 'central', label: 'Batcomputador', icon: IconGrid, sub: 'Visão geral do dia' },
  { id: 'crm', label: 'Prospecção', icon: IconFunnel, sub: 'CRM & funil kanban' },
  { id: 'radar', label: 'Radar', icon: IconRadar, sub: 'Leads priorizados' },
  { id: 'scripts', label: 'Scripts', icon: IconChat, sub: 'Abordagens por nicho' },
  { id: 'proposta', label: 'Proposta', icon: IconBriefcase, sub: 'Pacotes & proposta' },
  { id: 'importacao', label: 'Importação', icon: IconShip, sub: 'Calculadora de custos' },
  { id: 'cofre', label: 'Cofre', icon: IconVault, sub: 'Painel financeiro' },
  { id: 'arquivo', label: 'Arquivo', icon: IconArchive, sub: 'Notas da operação' },
]

function freshGoals() {
  return DEFAULT_GOALS.map((g) => ({ ...g, done: 0 }))
}

export default function App() {
  const [booted, setBooted] = useState(false)
  const [view, setView] = useState('central')
  const [leads, setLeads] = useState([])
  const [goals, setGoals] = useState(freshGoals)
  const [goalsDate, setGoalsDate] = useState(todayKey())
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const [booting, setBooting] = useState(
    () => !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches,
  )
  // 'full' = todos os efeitos; 'lite' = modo eco para máquinas modestas
  const [fxMode, setFxMode] = useState('full')
  const fxManual = useRef(false)

  useEffect(() => {
    kvGet('fx-mode').then((m) => {
      if (m === 'lite' || m === 'full') {
        fxManual.current = true
        setFxMode(m)
      }
    })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('fx-lite', fxMode === 'lite')
  }, [fxMode])

  // Watchdog de FPS: mede ~2,5s após o boot; se a máquina não segura
  // ~45fps, rebaixa sozinho para o modo eco (a menos que o usuário
  // tenha escolhido manualmente).
  useEffect(() => {
    if (booting || fxMode === 'lite' || fxManual.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frames = 0
    let raf
    const t0 = performance.now()
    const tick = () => {
      frames++
      if (performance.now() - t0 < 2500) {
        raf = requestAnimationFrame(tick)
      } else if (frames / 2.5 < 45 && !fxManual.current) {
        setFxMode('lite')
        showToast('Modo eco ativado para manter a fluidez ⚡', 'info')
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [booting, fxMode])

  function toggleFx() {
    const next = fxMode === 'full' ? 'lite' : 'full'
    fxManual.current = true
    setFxMode(next)
    kvSet('fx-mode', next)
    showToast(
      next === 'lite'
        ? 'Modo eco: efeitos pesados desligados'
        : 'Modo total: todos os efeitos ligados',
      'info',
    )
  }

  // Boot: hidrata do localStorage; se for a primeira visita, semeia leads demo.
  useEffect(() => {
    const saved = loadState()
    if (saved) {
      setLeads(saved.leads ?? [])
      // Virou o dia? Zera o progresso mas preserva as metas configuradas.
      if (saved.goalsDate === todayKey()) {
        setGoals(saved.goals ?? freshGoals())
        setGoalsDate(saved.goalsDate)
      } else {
        setGoals((saved.goals ?? freshGoals()).map((g) => ({ ...g, done: 0 })))
        setGoalsDate(todayKey())
      }
    } else {
      setLeads(seedLeads())
    }
    setBooted(true)
  }, [])

  useEffect(() => {
    if (!booted) return
    saveState({ leads, goals, goalsDate })
  }, [booted, leads, goals, goalsDate])

  // Scroll amortecido (Lenis) — só desktop com mouse, modo total
  useEffect(() => {
    if (
      fxMode !== 'full' ||
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return
    const lenis = new Lenis({ duration: 1.05 })
    let raf
    const loop = (t) => {
      lenis.raf(t)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [fxMode])

  // Handlers estáveis (useCallback) para os módulos memoizados não
  // re-renderizarem quando o App atualiza (toast, relógio, fxMode…).
  const showToast = useCallback((message, tone = 'info') => {
    clearTimeout(toastTimer.current)
    setToast({ message, tone, key: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  // ---- Metas ----
  const bumpGoal = useCallback(
    (id, delta) => {
      setGoals((gs) =>
        gs.map((g) => {
          if (g.id !== id) return g
          const done = Math.max(0, Math.min(g.target, g.done + delta))
          if (delta > 0 && done === g.target && g.done < g.target) {
            showToast(`Meta batida: ${g.label} 🦇`, 'win')
          }
          return { ...g, done }
        }),
      )
    },
    [showToast],
  )

  const addGoal = useCallback((label, target) => {
    setGoals((gs) => [...gs, { id: uid(), label, target, done: 0 }])
  }, [])

  const removeGoal = useCallback((id) => {
    setGoals((gs) => gs.filter((g) => g.id !== id))
  }, [])

  const newDay = useCallback(() => {
    setGoals((gs) => gs.map((g) => ({ ...g, done: 0 })))
    setGoalsDate(todayKey())
    showToast('Novo dia iniciado. Gotham conta com você.', 'info')
  }, [showToast])

  // ---- CRM ----
  const addLead = useCallback(
    (data) => {
      setLeads((ls) => [{ ...data, id: uid(), stage: 'novo', createdAt: Date.now() }, ...ls])
      showToast(`${data.company} entrou no radar.`, 'info')
      setView('crm')
    },
    [showToast],
  )

  const moveLead = useCallback(
    (id, stage) => {
      setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage } : l)))
      if (stage === 'fechado') showToast('Contrato fechado. Missão cumprida. 🏆', 'win')
    },
    [showToast],
  )

  const removeLead = useCallback((id) => {
    setLeads((ls) => ls.filter((l) => l.id !== id))
  }, [])

  const overall = useMemo(() => {
    const target = goals.reduce((s, g) => s + g.target, 0)
    const done = goals.reduce((s, g) => s + Math.min(g.done, g.target), 0)
    return target === 0 ? 0 : Math.round((done / target) * 100)
  }, [goals])

  const tickerMessages = useMemo(() => {
    const emTratativa = leads.filter((l) =>
      ['abordado', 'respondeu', 'reuniao'].includes(l.stage),
    ).length
    return [
      'SISTEMAS OPERACIONAIS · TODOS OS MÓDULOS ONLINE',
      `RADAR VARRENDO GOTHAM · ${leads.length} LEAD${leads.length === 1 ? '' : 'S'} MONITORADO${leads.length === 1 ? '' : 'S'}`,
      `FUNIL ATIVO · ${emTratativa} EM TRATATIVA`,
      `METAS DO DIA · ${overall}% CONCLUÍDO`,
    ]
  }, [leads, overall])

  return (
    <div className="shell">
      {booting && <BootScreen onDone={() => setBooting(false)} />}
      <HudFrame />
      <Cursor />
      <div className="bat-watermark" aria-hidden="true">
        <BatEmblem size={720} />
      </div>
      {fxMode === 'full' && (
        <Suspense fallback={null}>
          <ParticleCave />
        </Suspense>
      )}
      <aside className="sidebar">
        <div className="sidebar-emblem" title="Batcaverna Ops">
          <BatEmblem size={30} />
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ id, label, icon: Icon, sub }) => (
            <MagneticButton
              key={id}
              className={`nav-item ${view === id ? 'active' : ''}`}
              onClick={() => setView(id)}
              aria-label={label}
            >
              <span className="nav-icon">
                <Icon />
              </span>
              <span className="nav-tip">
                <strong>{label}</strong>
                <small>{sub}</small>
              </span>
            </MagneticButton>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button
            className={`nav-item fx-toggle ${fxMode === 'lite' ? 'active' : ''}`}
            onClick={toggleFx}
            title={fxMode === 'full' ? 'FX: modo total — clique para modo eco' : 'FX: modo eco — clique para modo total'}
            aria-label="Alternar modo de desempenho"
          >
            <span className="nav-icon">
              <IconBolt />
            </span>
            <span className="nav-tip">
              <strong>Desempenho</strong>
              <small>{fxMode === 'full' ? 'modo total' : 'modo eco'}</small>
            </span>
          </button>
          <span className="status-dot" />
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="brand">
            <span className="brand-emblem">
              <BatEmblem size={40} />
            </span>
            <div className="brand-copy">
              <h1>
                BATCAVERNA <span>OPS</span>
              </h1>
              <p>Central de operações · agência de marketing digital</p>
            </div>
          </div>
          <StatusTicker messages={tickerMessages} />
          <div className="topbar-meta">
            <div className="day-progress" role="img" aria-label={`Progresso do dia: ${overall}%`}>
              <svg viewBox="0 0 44 44" width="44" height="44">
                <circle className="ring-track" cx="22" cy="22" r="19" />
                <circle
                  className="ring-fill"
                  cx="22"
                  cy="22"
                  r="19"
                  strokeDasharray={`${(overall / 100) * 119.4} 119.4`}
                />
              </svg>
              <span>
                <CountUp value={overall} format={(v) => `${Math.round(v)}%`} />
              </span>
            </div>
            <div className="topbar-date">
              <strong>{new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}</strong>
              <small>{new Date().toLocaleDateString('pt-BR')}</small>
              <LiveClock />
            </div>
          </div>
        </header>

        <main className="content-wrap">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              className="content"
              key={view}
              initial={{ clipPath: 'inset(0 0 100% 0)', opacity: 0.4 }}
              animate={{ clipPath: 'inset(0 0 0% 0)', opacity: 1 }}
              exit={{ clipPath: 'inset(100% 0 0 0)', opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.span
                className="view-scanbar"
                initial={{ top: '0%', opacity: 1 }}
                animate={{ top: '100%', opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden="true"
              />
          {view === 'central' && (
            <>
              <GoalsBoard
                goals={goals}
                overall={overall}
                onBump={bumpGoal}
                onAdd={addGoal}
                onRemove={removeGoal}
                onNewDay={newDay}
              />
              <StatTiles leads={leads} />
              <Kanban leads={leads} onMove={moveLead} onRemove={removeLead} compact />
            </>
          )}

          {view === 'crm' && (
            <>
              <div className="crm-grid">
                <LeadForm onAdd={addLead} />
                <ScoreGuide />
              </div>
              <Kanban leads={leads} onMove={moveLead} onRemove={removeLead} />
            </>
          )}

          {view === 'radar' && <RadarView leads={leads} onMove={moveLead} />}

          {view === 'scripts' && <ScriptsView leads={leads} />}

          {view === 'proposta' && <ProposalView leads={leads} />}

          {view === 'importacao' && <ImportCalc />}

          {view === 'cofre' && <FinanceView />}

          {view === 'arquivo' && <NotesView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            className={`toast toast-${toast.tone}`}
            role="status"
            initial={{ y: 46, x: '-50%', opacity: 0, scale: 0.9 }}
            animate={{ y: 0, x: '-50%', opacity: 1, scale: 1 }}
            exit={{ y: 24, x: '-50%', opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <motion.span
              className="toast-emblem"
              initial={{ rotate: -160, scale: 0.4 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.05 }}
            >
              <BatEmblem size={20} />
            </motion.span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { STAGES }
