import { useMemo, useState } from 'react'
import { SEGMENTS } from '../model.js'
import { NICHE_INTEL, SCRIPT_TEMPLATES, renderScript } from '../content.js'
import { IconChat, IconCopy, IconCheck } from '../icons.jsx'

// Scripts de abordagem por nicho: os templates interpolam a inteligência
// do segmento (gancho/dor/isca) + os dados que o usuário preenche.
export default function ScriptsView({ leads }) {
  const [segment, setSegment] = useState(SEGMENTS[0])
  const [empresa, setEmpresa] = useState('')
  const [cidade, setCidade] = useState('')
  const [seuNome, setSeuNome] = useState('')
  const [agencia, setAgencia] = useState('')
  const [copied, setCopied] = useState(null)

  const intel = NICHE_INTEL[segment] ?? NICHE_INTEL.Outro

  const vars = useMemo(
    () => ({
      empresa: empresa || '{empresa}',
      cidade: cidade || '{cidade}',
      seu_nome: seuNome || '{seu_nome}',
      agencia: agencia || '{agencia}',
      ...intel,
    }),
    [empresa, cidade, seuNome, agencia, intel],
  )

  function fillFromLead(id) {
    const lead = leads.find((l) => l.id === id)
    if (!lead) return
    setEmpresa(lead.company)
    setCidade(lead.city || '')
    setSegment(lead.segment)
  }

  async function copy(id, text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(id)
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800)
  }

  return (
    <>
      <section className="panel">
        <header className="panel-head">
          <h2>
            <span className="panel-icon icon-btn">
              <IconChat />
            </span>
            Scripts por nicho
          </h2>
          <span className="kanban-total">preencha uma vez, copie pronto</span>
        </header>

        <div className="scripts-setup">
          <label className="field">
            <span>Nicho</span>
            <select value={segment} onChange={(e) => setSegment(e.target.value)}>
              {SEGMENTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Puxar de um lead</span>
            <select defaultValue="" onChange={(e) => fillFromLead(e.target.value)}>
              <option value="" disabled>
                Selecionar…
              </option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.company}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Empresa</span>
            <input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Clínica Wayne" />
          </label>
          <label className="field">
            <span>Cidade</span>
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Gotham do Sul" />
          </label>
          <label className="field">
            <span>Seu nome</span>
            <input value={seuNome} onChange={(e) => setSeuNome(e.target.value)} placeholder="Bruno" />
          </label>
          <label className="field">
            <span>Sua agência</span>
            <input value={agencia} onChange={(e) => setAgencia(e.target.value)} placeholder="Batcaverna Mkt" />
          </label>
        </div>

        <div className="intel-strip">
          <span className="chip chip-on" title="O que você 'reparou' no lead">
            gancho: {intel.gancho}
          </span>
          <span className="chip chip-on" title="A dor nomeada do nicho">
            dor: {intel.dor}
          </span>
          <span className="chip chip-on" title="Oferta de entrada">
            isca: {intel.isca}
          </span>
        </div>
      </section>

      <div className="scripts-grid">
        {SCRIPT_TEMPLATES.map((t) => {
          const text = renderScript(t.text, vars)
          const isCopied = copied === t.id
          return (
            <section key={t.id} className="panel script-card">
              <header className="panel-head">
                <h2>{t.title}</h2>
                <span className={`tier ${t.channel === 'Instagram' ? 'tier-warm' : 'tier-cold'}`}>
                  {t.channel}
                </span>
              </header>
              <pre className="script-text">{text}</pre>
              <button
                className={`btn icon-btn script-copy ${isCopied ? 'btn-copied' : 'btn-primary'}`}
                onClick={() => copy(t.id, text)}
              >
                {isCopied ? <IconCheck /> : <IconCopy />}
                <span>{isCopied ? 'Copiado!' : 'Copiar script'}</span>
              </button>
            </section>
          )
        })}
      </div>
    </>
  )
}
