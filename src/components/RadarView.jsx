import { useMemo } from 'react'
import { MAX_SCORE, SCORE_RULES, STAGES, scoreLead, scoreTier } from '../model.js'
import { IconRadar } from '../icons.jsx'

// Radar: todos os leads ordenados por score, com o raio-X de cada pontuação.
export default function RadarView({ leads, onMove }) {
  const ranked = useMemo(
    () =>
      leads
        .map((lead) => ({ lead, ...scoreLead(lead) }))
        .sort((a, b) => b.score - a.score),
    [leads],
  )

  const stageLabel = Object.fromEntries(STAGES.map((s) => [s.id, s.label]))

  return (
    <section className="panel radar">
      <header className="panel-head">
        <h2>
          <span className="panel-icon icon-btn">
            <IconRadar />
          </span>
          Radar de prioridade
        </h2>
        <span className="kanban-total">ordenado por score — ataque de cima para baixo</span>
      </header>

      {ranked.length === 0 && <div className="kcol-empty">Nenhum lead cadastrado ainda.</div>}

      <ol className="radar-list">
        {ranked.map(({ lead, score, hits }, i) => {
          const tier = scoreTier(score)
          const hitIds = new Set(hits.map((h) => h.id))
          return (
            <li key={lead.id} className={`radar-row radar-${tier.id}`}>
              <span className="radar-rank">{String(i + 1).padStart(2, '0')}</span>
              <div className="radar-body">
                <div className="radar-top">
                  <strong>{lead.company}</strong>
                  <span className="kcard-segment">{lead.segment}</span>
                  <span className={`tier tier-${tier.id}`}>
                    {tier.icon} {score}/{MAX_SCORE} · {tier.label}
                  </span>
                </div>
                <div className="radar-bar">
                  <div className="radar-fill" style={{ width: `${(score / MAX_SCORE) * 100}%` }} />
                </div>
                <div className="radar-rules">
                  {SCORE_RULES.map((r) => (
                    <span key={r.id} className={`chip ${hitIds.has(r.id) ? 'chip-on' : ''}`} title={r.why}>
                      {r.label} {hitIds.has(r.id) ? `+${r.points}` : '·'}
                    </span>
                  ))}
                </div>
              </div>
              <label className="radar-stage">
                <span>Estágio</span>
                <select value={lead.stage} onChange={(e) => onMove(lead.id, e.target.value)}>
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {stageLabel[s.id]}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
