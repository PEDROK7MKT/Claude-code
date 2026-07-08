import { useEffect, useMemo, useState } from 'react'
import { kvGet, kvSet } from '../storage.js'
import { uid } from '../model.js'
import { IconBolt, IconCheck, IconPlus, IconTrash, IconTrophy, IconVault } from '../icons.jsx'
import { CountUp } from './Fx.jsx'

const CATEGORIES = ['Recorrência/Cliente', 'Brique/Revenda', 'Importação', 'Serviço avulso', 'Outro']

const brl = (n) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const EMPTY = { desc: '', category: CATEGORIES[0], amount: '', kind: 'receita', recurring: true }

function sameMonth(ts) {
  const d = new Date(ts)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

// Cofre: controle financeiro da operação. Persistência via IndexedDB.
export default function FinanceView() {
  const [entries, setEntries] = useState([])
  const [goal, setGoal] = useState(5000)
  const [form, setForm] = useState(EMPTY)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([kvGet('finance-entries'), kvGet('finance-goal')]).then(([e, g]) => {
      if (!alive) return
      if (Array.isArray(e)) setEntries(e)
      if (typeof g === 'number' && g >= 0) setGoal(g)
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (loaded) kvSet('finance-entries', entries)
  }, [loaded, entries])

  useEffect(() => {
    if (loaded) kvSet('finance-goal', goal)
  }, [loaded, goal])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function submit(e) {
    e.preventDefault()
    const amount = Number(String(form.amount).replace(',', '.'))
    if (!form.desc.trim() || !Number.isFinite(amount) || amount <= 0) return
    setEntries((es) => [
      { ...form, desc: form.desc.trim(), amount, id: uid(), createdAt: Date.now() },
      ...es,
    ])
    setForm(EMPTY)
  }

  function remove(id) {
    setEntries((es) => es.filter((e) => e.id !== id))
  }

  const stats = useMemo(() => {
    const recIncome = entries.filter((e) => e.kind === 'receita' && e.recurring)
    const mrr = recIncome.reduce((s, e) => s + e.amount, 0)
    // Recorrentes contam todo mês; pontuais só no mês em que entraram.
    const monthIncome =
      mrr +
      entries
        .filter((e) => e.kind === 'receita' && !e.recurring && sameMonth(e.createdAt))
        .reduce((s, e) => s + e.amount, 0)
    const monthExpense = entries
      .filter((e) => e.kind === 'despesa' && (e.recurring || sameMonth(e.createdAt)))
      .reduce((s, e) => s + e.amount, 0)
    const profit = monthIncome - monthExpense
    const ticket = recIncome.length === 0 ? null : mrr / recIncome.length
    return { mrr, monthIncome, monthExpense, profit, ticket, recCount: recIncome.length }
  }, [entries])

  const goalPct = goal > 0 ? Math.min(100, Math.round((stats.monthIncome / goal) * 100)) : 0
  const goalHit = goal > 0 && stats.monthIncome >= goal

  const tiles = [
    { label: 'Receita recorrente (MRR)', value: <CountUp value={stats.mrr} format={brl} />, sub: `${stats.recCount} entrada${stats.recCount === 1 ? '' : 's'} recorrente${stats.recCount === 1 ? '' : 's'}`, accent: true },
    { label: 'Receita total do mês', value: <CountUp value={stats.monthIncome} format={brl} />, sub: 'recorrentes + pontuais do mês' },
    { label: 'Despesas totais', value: <CountUp value={stats.monthExpense} format={brl} />, sub: 'recorrentes + pontuais do mês' },
    { label: 'Lucro líquido', value: <CountUp value={stats.profit} format={brl} />, sub: 'receita − despesa', tone: stats.profit >= 0 ? 'win' : 'lost' },
    { label: 'Ticket médio', value: stats.ticket === null ? '—' : <CountUp value={stats.ticket} format={brl} />, sub: 'MRR ÷ entradas recorrentes' },
  ]

  return (
    <>
      <section className="panel">
        <header className="panel-head">
          <h2>
            <span className="panel-icon icon-btn">
              <IconVault />
            </span>
            Cofre — painel financeiro
          </h2>
          <span className="kanban-total">qualquer receita: cliente, brique, importação…</span>
        </header>

        <div className="tiles finance-tiles">
          {tiles.map((t) => (
            <article key={t.label} className={`tile ${t.accent ? 'tile-accent' : ''} ${t.tone ? `tile-${t.tone}` : ''}`}>
              <div>
                <span className="tile-value">{t.value}</span>
                <span className="tile-label">{t.label}</span>
                <span className="tile-sub">{t.sub}</span>
              </div>
            </article>
          ))}
        </div>

        <div className={`month-goal ${goalHit ? 'month-goal-hit' : ''}`}>
          <label className="field month-goal-field">
            <span>Meta do mês (R$)</span>
            <input
              type="number"
              min="0"
              value={goal}
              onChange={(e) => setGoal(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <div className="month-goal-track">
            <div className="month-goal-head">
              <span>
                {brl(stats.monthIncome)} de {brl(goal)}
              </span>
              <strong>{goalPct}%</strong>
            </div>
            <div className="goal-bar">
              <div className="goal-fill" style={{ width: `${goalPct}%` }} />
            </div>
            {goalHit && (
              <span className="goal-badge">
                <IconTrophy /> meta do mês batida
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>
            <span className="panel-icon icon-btn">
              <IconPlus />
            </span>
            Nova entrada
          </h2>
        </header>
        <form className="finance-form" onSubmit={submit}>
          <label className="field finance-desc">
            <span>Descrição *</span>
            <input
              required
              value={form.desc}
              onChange={(e) => set('desc', e.target.value)}
              placeholder='Ex: "Cliente Clínica Wayne", "Lote de tênis", "Importação iPhones"'
            />
          </label>
          <label className="field">
            <span>Categoria</span>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Valor (R$) *</span>
            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              placeholder="1500.00"
            />
          </label>
          <div className="field">
            <span>Tipo</span>
            <div className="seg-toggle" role="radiogroup" aria-label="Tipo da entrada">
              <button
                type="button"
                role="radio"
                aria-checked={form.kind === 'receita'}
                className={form.kind === 'receita' ? 'on' : ''}
                onClick={() => set('kind', 'receita')}
              >
                ▲ Receita
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={form.kind === 'despesa'}
                className={form.kind === 'despesa' ? 'on seg-lost' : ''}
                onClick={() => set('kind', 'despesa')}
              >
                ▼ Despesa
              </button>
            </div>
          </div>
          <div className="field">
            <span>Frequência</span>
            <div className="seg-toggle" role="radiogroup" aria-label="Frequência">
              <button
                type="button"
                role="radio"
                aria-checked={form.recurring}
                className={form.recurring ? 'on' : ''}
                onClick={() => set('recurring', true)}
              >
                Recorrente mensal
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={!form.recurring}
                className={!form.recurring ? 'on' : ''}
                onClick={() => set('recurring', false)}
              >
                Pontual
              </button>
            </div>
          </div>
          <button className="btn btn-primary finance-submit icon-btn" type="submit">
            <IconPlus />
            <span>Lançar no cofre</span>
          </button>
        </form>
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>
            <span className="panel-icon icon-btn">
              <IconBolt />
            </span>
            Entradas cadastradas
          </h2>
          <span className="kanban-total">
            {entries.length} lançamento{entries.length === 1 ? '' : 's'}
          </span>
        </header>
        {entries.length === 0 && <div className="kcol-empty">Nenhum lançamento ainda — o cofre está vazio.</div>}
        <ul className="ledger">
          {entries.map((e) => (
            <li key={e.id} className="ledger-row">
              <div className="ledger-main">
                <strong>{e.desc}</strong>
                <div className="ledger-chips">
                  <span className="chip chip-on">{e.category}</span>
                  <span className="chip">{e.recurring ? 'recorrente mensal' : 'pontual'}</span>
                  <span className="chip">{new Date(e.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
              <span className={`ledger-amount ${e.kind === 'receita' ? 'ledger-in' : 'ledger-out'}`}>
                {e.kind === 'receita' ? '+' : '−'} {brl(e.amount)}
              </span>
              <button
                className="kcard-remove icon-btn"
                onClick={() => remove(e.id)}
                title="Excluir lançamento"
                aria-label={`Excluir ${e.desc}`}
              >
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
