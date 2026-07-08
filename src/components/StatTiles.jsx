import { useMemo } from 'react'
import { scoreLead, scoreTier } from '../model.js'
import { IconBolt, IconEye, IconFunnel, IconTrophy } from '../icons.jsx'
import { CountUp } from './Fx.jsx'

export default function StatTiles({ leads }) {
  const stats = useMemo(() => {
    const total = leads.length
    const hot = leads.filter((l) => scoreTier(scoreLead(l).score).id === 'hot').length
    const meetings = leads.filter((l) => l.stage === 'reuniao').length
    const closed = leads.filter((l) => l.stage === 'fechado').length
    const decided = leads.filter((l) => l.stage === 'fechado' || l.stage === 'perdido').length
    const winRate = decided === 0 ? null : Math.round((closed / decided) * 100)
    return { total, hot, meetings, closed, winRate }
  }, [leads])

  const tiles = [
    { icon: IconEye, label: 'Leads no radar', value: <CountUp value={stats.total} />, sub: 'total cadastrado' },
    { icon: IconBolt, label: 'Leads quentes', value: <CountUp value={stats.hot} />, sub: 'score ≥ 65', accent: true },
    { icon: IconFunnel, label: 'Reuniões na mesa', value: <CountUp value={stats.meetings} />, sub: 'estágio reunião' },
    {
      icon: IconTrophy,
      label: 'Taxa de fechamento',
      value:
        stats.winRate === null ? '—' : <CountUp value={stats.winRate} format={(v) => `${Math.round(v)}%`} />,
      sub: `${stats.closed} contrato${stats.closed === 1 ? '' : 's'} fechado${stats.closed === 1 ? '' : 's'}`,
    },
  ]

  return (
    <section className="tiles">
      {tiles.map(({ icon: Icon, label, value, sub, accent }) => (
        <article key={label} className={`tile ${accent ? 'tile-accent' : ''}`}>
          <span className="tile-icon icon-btn">
            <Icon />
          </span>
          <div>
            <span className="tile-value">{value}</span>
            <span className="tile-label">{label}</span>
            <span className="tile-sub">{sub}</span>
          </div>
        </article>
      ))}
    </section>
  )
}
