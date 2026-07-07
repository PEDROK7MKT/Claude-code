import { useState } from 'react'
import { IconCheck, IconPlus, IconRefresh, IconTarget, IconTrash, IconTrophy } from '../icons.jsx'

export default function GoalsBoard({ goals, overall, onBump, onAdd, onRemove, onNewDay }) {
  const [label, setLabel] = useState('')
  const [target, setTarget] = useState(5)
  const allDone = goals.length > 0 && goals.every((g) => g.done >= g.target)

  function submit(e) {
    e.preventDefault()
    const clean = label.trim()
    const n = Number(target)
    if (!clean || !Number.isFinite(n) || n < 1) return
    onAdd(clean, Math.round(n))
    setLabel('')
    setTarget(5)
  }

  return (
    <section className={`panel goals ${allDone ? 'goals-complete' : ''}`}>
      <header className="panel-head">
        <h2>
          <span className="panel-icon icon-btn">
            <IconTarget />
          </span>
          Metas do dia
        </h2>
        <div className="goals-head-right">
          <div className="overall">
            <div className="overall-bar">
              <div className="overall-fill" style={{ width: `${overall}%` }} />
            </div>
            <span className="overall-num">{overall}%</span>
          </div>
          <button className="btn btn-ghost icon-btn" onClick={onNewDay} title="Iniciar novo dia (zera o progresso)">
            <IconRefresh />
            <span>Novo dia</span>
          </button>
        </div>
      </header>

      {allDone && (
        <div className="goals-banner">
          <IconTrophy />
          <span>TODAS AS METAS BATIDAS — GOTHAM ESTÁ SEGURA HOJE</span>
        </div>
      )}

      <div className="goals-grid">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.done / g.target) * 100))
          const done = g.done >= g.target
          return (
            <article key={g.id} className={`goal ${done ? 'goal-done' : ''}`}>
              <div className="goal-top">
                <h3>{g.label}</h3>
                <button
                  className="goal-remove icon-btn"
                  onClick={() => onRemove(g.id)}
                  title="Remover meta"
                  aria-label={`Remover meta ${g.label}`}
                >
                  <IconTrash />
                </button>
              </div>
              <div className="goal-count">
                <strong>{g.done}</strong>
                <span>/ {g.target}</span>
                {done && (
                  <span className="goal-badge">
                    <IconCheck /> batida
                  </span>
                )}
              </div>
              <div className="goal-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="goal-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="goal-actions">
                <button className="btn btn-step icon-btn" onClick={() => onBump(g.id, -1)} disabled={g.done === 0}>
                  −1
                </button>
                <button className="btn btn-step btn-step-up icon-btn" onClick={() => onBump(g.id, 1)} disabled={done}>
                  +1
                </button>
              </div>
            </article>
          )
        })}

        <form className="goal goal-new" onSubmit={submit}>
          <h3>Nova meta</h3>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ex: 5 follow-ups enviados"
            aria-label="Descrição da nova meta"
          />
          <div className="goal-new-row">
            <input
              type="number"
              min="1"
              max="999"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              aria-label="Quantidade alvo"
            />
            <button className="btn btn-primary icon-btn" type="submit">
              <IconPlus />
              <span>Adicionar</span>
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
