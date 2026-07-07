import { useMemo, useState } from 'react'
import { MAX_SCORE, STAGES, scoreLead, scoreTier } from '../model.js'
import { IconAt, IconFunnel, IconPhone, IconPin, IconTrash } from '../icons.jsx'

export default function Kanban({ leads, onMove, onRemove, compact = false }) {
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  const byStage = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s.id, []]))
    for (const lead of leads) {
      ;(map[lead.stage] ?? map.novo).push(lead)
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => scoreLead(b).score - scoreLead(a).score)
    }
    return map
  }, [leads])

  const total = leads.length

  function handleDrop(e, stage) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragId
    if (id) onMove(id, stage)
    setDragId(null)
    setOverStage(null)
  }

  return (
    <section className={`panel kanban ${compact ? 'kanban-compact' : ''}`}>
      <header className="panel-head">
        <h2>
          <span className="panel-icon icon-btn">
            <IconFunnel />
          </span>
          Funil de prospecção
        </h2>
        <span className="kanban-total">{total} lead{total === 1 ? '' : 's'} no funil</span>
      </header>

      <div className="kanban-board">
        {STAGES.map((stage) => {
          const cards = byStage[stage.id]
          const pct = total === 0 ? 0 : Math.round((cards.length / total) * 100)
          return (
            <div
              key={stage.id}
              className={`kcol kcol-${stage.id} ${overStage === stage.id ? 'kcol-over' : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setOverStage(stage.id)
              }}
              onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <header className="kcol-head">
                <div>
                  <h3>{stage.label}</h3>
                  <small>{stage.hint}</small>
                </div>
                <div className="kcol-meta">
                  <span className="kcol-count">{cards.length}</span>
                  <span className="kcol-pct">{pct}%</span>
                </div>
              </header>
              <div className="kcol-track">
                <div className="kcol-track-fill" style={{ width: `${pct}%` }} />
              </div>

              <div className="kcol-cards">
                {cards.map((lead) => {
                  const { score } = scoreLead(lead)
                  const tier = scoreTier(score)
                  return (
                    <article
                      key={lead.id}
                      className={`kcard ${dragId === lead.id ? 'kcard-drag' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', lead.id)
                        e.dataTransfer.effectAllowed = 'move'
                        setDragId(lead.id)
                      }}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverStage(null)
                      }}
                    >
                      <div className="kcard-top">
                        <strong>{lead.company}</strong>
                        <span className={`tier tier-${tier.id}`} title={`${score}/${MAX_SCORE} pts`}>
                          {tier.icon} {score}
                        </span>
                      </div>
                      <span className="kcard-segment">{lead.segment}</span>
                      {!compact && (
                        <div className="kcard-meta">
                          {lead.whatsapp && (
                            <span>
                              <IconPhone /> {lead.whatsapp}
                            </span>
                          )}
                          {lead.instagram && (
                            <span>
                              <IconAt /> {lead.instagram}
                            </span>
                          )}
                          {lead.city && (
                            <span>
                              <IconPin /> {lead.city}
                            </span>
                          )}
                        </div>
                      )}
                      {!compact && lead.notes && <p className="kcard-notes">{lead.notes}</p>}
                      <div className="kcard-actions">
                        <select
                          value={lead.stage}
                          onChange={(e) => onMove(lead.id, e.target.value)}
                          aria-label={`Mover ${lead.company} de estágio`}
                        >
                          {STAGES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <button
                          className="kcard-remove icon-btn"
                          onClick={() => onRemove(lead.id)}
                          title="Remover lead"
                          aria-label={`Remover ${lead.company}`}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </article>
                  )
                })}
                {cards.length === 0 && <div className="kcol-empty">Arraste um card aqui</div>}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
