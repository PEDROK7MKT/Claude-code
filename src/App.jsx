import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_GOALS,
  STAGES,
  loadState,
  saveState,
  seedLeads,
  todayKey,
  uid,
} from './model.js'
import { BatEmblem, IconBriefcase, IconChat, IconFunnel, IconGrid, IconRadar, IconShip } from './icons.jsx'
import GoalsBoard from './components/GoalsBoard.jsx'
import StatTiles from './components/StatTiles.jsx'
import LeadForm from './components/LeadForm.jsx'
import ScoreGuide from './components/ScoreGuide.jsx'
import Kanban from './components/Kanban.jsx'
import RadarView from './components/RadarView.jsx'
import ScriptsView from './components/ScriptsView.jsx'
import ProposalView from './components/ProposalView.jsx'
import ImportCalc from './components/ImportCalc.jsx'

const NAV = [
  { id: 'central', label: 'Batcomputador', icon: IconGrid, sub: 'Visão geral do dia' },
  { id: 'crm', label: 'Prospecção', icon: IconFunnel, sub: 'CRM & funil kanban' },
  { id: 'radar', label: 'Radar', icon: IconRadar, sub: 'Leads priorizados' },
  { id: 'scripts', label: 'Scripts', icon: IconChat, sub: 'Abordagens por nicho' },
  { id: 'proposta', label: 'Proposta', icon: IconBriefcase, sub: 'Pacotes & proposta' },
  { id: 'importacao', label: 'Importação', icon: IconShip, sub: 'Calculadora de custos' },
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

  function showToast(message, tone = 'info') {
    clearTimeout(toastTimer.current)
    setToast({ message, tone, key: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  // ---- Metas ----
  function bumpGoal(id, delta) {
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
  }

  function addGoal(label, target) {
    setGoals((gs) => [...gs, { id: uid(), label, target, done: 0 }])
  }

  function removeGoal(id) {
    setGoals((gs) => gs.filter((g) => g.id !== id))
  }

  function newDay() {
    setGoals((gs) => gs.map((g) => ({ ...g, done: 0 })))
    setGoalsDate(todayKey())
    showToast('Novo dia iniciado. Gotham conta com você.', 'info')
  }

  // ---- CRM ----
  function addLead(data) {
    setLeads((ls) => [{ ...data, id: uid(), stage: 'novo', createdAt: Date.now() }, ...ls])
    showToast(`${data.company} entrou no radar.`, 'info')
    setView('crm')
  }

  function moveLead(id, stage) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage } : l)))
    if (stage === 'fechado') showToast('Contrato fechado. Missão cumprida. 🏆', 'win')
  }

  function removeLead(id) {
    setLeads((ls) => ls.filter((l) => l.id !== id))
  }

  const overall = useMemo(() => {
    const target = goals.reduce((s, g) => s + g.target, 0)
    const done = goals.reduce((s, g) => s + Math.min(g.done, g.target), 0)
    return target === 0 ? 0 : Math.round((done / target) * 100)
  }, [goals])

  return (
    <div className="shell">
      <div className="bat-watermark" aria-hidden="true">
        <BatEmblem size={720} />
      </div>
      <aside className="sidebar">
        <div className="sidebar-emblem" title="Batcaverna Ops">
          <BatEmblem size={30} />
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ id, label, icon: Icon, sub }) => (
            <button
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
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
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
              <span>{overall}%</span>
            </div>
            <div className="topbar-date">
              <strong>{new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}</strong>
              <small>{new Date().toLocaleDateString('pt-BR')}</small>
            </div>
          </div>
        </header>

        <main className="content" key={view}>
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
        </main>
      </div>

      {toast && (
        <div key={toast.key} className={`toast toast-${toast.tone}`} role="status">
          <BatEmblem size={20} />
          {toast.message}
        </div>
      )}
    </div>
  )
}

export { STAGES }
