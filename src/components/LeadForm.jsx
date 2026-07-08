import { memo } from 'react'
import { useMemo, useState } from 'react'
import { MAX_SCORE, SEGMENTS, scoreLead, scoreTier } from '../model.js'
import { IconAt, IconGlobe, IconPhone, IconPin, IconPlus } from '../icons.jsx'

const EMPTY = {
  company: '',
  segment: SEGMENTS[0],
  whatsapp: '',
  instagram: '',
  hasSite: false,
  city: '',
  notes: '',
}

function LeadForm({ onAdd }) {
  const [form, setForm] = useState(EMPTY)

  // Score ao vivo: o usuário vê o lead esquentar enquanto preenche.
  const live = useMemo(() => scoreLead(form), [form])
  const tier = scoreTier(live.score)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function submit(e) {
    e.preventDefault()
    if (!form.company.trim()) return
    onAdd({ ...form, company: form.company.trim() })
    setForm(EMPTY)
  }

  return (
    <section className="panel lead-form">
      <header className="panel-head">
        <h2>
          <span className="panel-icon icon-btn">
            <IconPlus />
          </span>
          Novo lead
        </h2>
        <span className={`tier tier-${tier.id}`} title={`Score ao vivo: ${live.score}/${MAX_SCORE}`}>
          {tier.icon} {live.score} pts · {tier.label}
        </span>
      </header>

      <form onSubmit={submit} className="form-grid">
        <label className="field field-wide">
          <span>Empresa *</span>
          <input
            required
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="Nome da empresa"
          />
        </label>

        <label className="field">
          <span>Segmento</span>
          <select value={form.segment} onChange={(e) => set('segment', e.target.value)}>
            {SEGMENTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>
            <IconPin /> Cidade
          </span>
          <input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Gotham do Sul" />
        </label>

        <label className="field">
          <span>
            <IconPhone /> WhatsApp
          </span>
          <input
            value={form.whatsapp}
            onChange={(e) => set('whatsapp', e.target.value)}
            placeholder="(11) 90000-0000"
          />
        </label>

        <label className="field">
          <span>
            <IconAt /> Instagram
          </span>
          <input
            value={form.instagram}
            onChange={(e) => set('instagram', e.target.value)}
            placeholder="@empresa"
          />
        </label>

        <div className="field field-wide field-site">
          <span>
            <IconGlobe /> Tem site?
          </span>
          <div className="seg-toggle" role="radiogroup" aria-label="Tem site?">
            <button
              type="button"
              role="radio"
              aria-checked={!form.hasSite}
              className={!form.hasSite ? 'on' : ''}
              onClick={() => set('hasSite', false)}
            >
              Não — oportunidade
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={form.hasSite}
              className={form.hasSite ? 'on' : ''}
              onClick={() => set('hasSite', true)}
            >
              Sim
            </button>
          </div>
        </div>

        <label className="field field-wide">
          <span>Observação</span>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Inteligência de campo: dono, dores, concorrentes…"
          />
        </label>

        <button className="btn btn-primary btn-submit icon-btn" type="submit">
          <IconPlus />
          <span>Lançar no funil</span>
        </button>
      </form>
    </section>
  )
}

export default memo(LeadForm)
