import { memo } from 'react'
import { MAX_SCORE, SCORE_RULES } from '../model.js'
import { IconBolt } from '../icons.jsx'

// Torna a lógica do score transparente: cada regra, seu peso e o porquê.
function ScoreGuide() {
  return (
    <section className="panel score-guide">
      <header className="panel-head">
        <h2>
          <span className="panel-icon icon-btn">
            <IconBolt />
          </span>
          Lógica do score
        </h2>
        <span className="score-max">máx. {MAX_SCORE} pts</span>
      </header>

      <ul className="rules">
        {SCORE_RULES.map((r) => (
          <li key={r.id} className="rule">
            <div className="rule-head">
              <span className="rule-label">{r.label}</span>
              <span className="rule-points">+{r.points}</span>
            </div>
            <div className="rule-bar">
              <div className="rule-fill" style={{ width: `${(r.points / MAX_SCORE) * 100}%` }} />
            </div>
            <p className="rule-why">{r.why}</p>
          </li>
        ))}
      </ul>

      <footer className="score-legend">
        <span className="tier tier-hot">🔥 ≥ 65 quente</span>
        <span className="tier tier-warm">⚡ 40–64 morno</span>
        <span className="tier tier-cold">🧊 &lt; 40 frio</span>
      </footer>
    </section>
  )
}

export default memo(ScoreGuide)
