import { memo } from 'react'
import { useMemo, useState } from 'react'
import { PACKAGES, buildProposal } from '../content.js'
import { IconBriefcase, IconCheck, IconCopy } from '../icons.jsx'
import Tilt from './Tilt.jsx'

const brl = (n) =>
  Number(n || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
  })

// Vitrine dos pacotes + gerador de proposta em texto pronto pra enviar.
function ProposalView({ leads }) {
  const [prices, setPrices] = useState(() =>
    Object.fromEntries(PACKAGES.map((p) => [p.id, p.price])),
  )
  const [selected, setSelected] = useState('vigilante')
  const [client, setClient] = useState('')
  const [seuNome, setSeuNome] = useState('')
  const [agencia, setAgencia] = useState('')
  const [extras, setExtras] = useState('')
  const [copied, setCopied] = useState(false)

  const pkg = PACKAGES.find((p) => p.id === selected)

  const proposal = useMemo(
    () =>
      buildProposal({
        client: client.trim() || '{cliente}',
        pkg: { ...pkg, price: Number(prices[pkg.id]) || 0 },
        agencia: agencia.trim() || 'Sua Agência',
        seuNome: seuNome.trim() || '{seu nome}',
        extras,
      }),
    [client, pkg, prices, agencia, seuNome, extras],
  )

  async function copy() {
    try {
      await navigator.clipboard.writeText(proposal)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = proposal
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <section className="panel">
        <header className="panel-head">
          <h2>
            <span className="panel-icon icon-btn">
              <IconBriefcase />
            </span>
            Proposta comercial
          </h2>
          <span className="kanban-total">toque num pacote para selecionar · preços editáveis</span>
        </header>

        <div className="packages">
          {PACKAGES.map((p) => (
            <Tilt key={p.id} max={4}>
            <article
              className={`package ${p.highlight ? 'package-hl' : ''} ${
                selected === p.id ? 'package-on' : ''
              }`}
              onClick={() => setSelected(p.id)}
              role="radio"
              aria-checked={selected === p.id}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSelected(p.id)}
            >
              {p.highlight && <span className="package-flag">mais vendido</span>}
              <h3>{p.name}</h3>
              <p className="package-tag">{p.tagline}</p>
              <div className="package-price">
                <span>R$</span>
                <input
                  type="number"
                  min="0"
                  value={prices[p.id]}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setPrices((ps) => ({ ...ps, [p.id]: e.target.value }))}
                  aria-label={`Preço do pacote ${p.name}`}
                />
                <small>/mês</small>
              </div>
              <div className="package-meta">
                <span className="package-setup">setup único: {brl(p.setup)}</span>
                {p.adBudget ? (
                  <span className="package-ads">
                    verba de anúncio: a partir de {brl(p.adBudget)}/mês · paga à parte
                  </span>
                ) : (
                  <span className="package-ads package-ads-none">sem tráfego pago neste plano</span>
                )}
              </div>
              <ul>
                {p.features.map((f) => (
                  <li key={f}>
                    <IconCheck /> {f}
                  </li>
                ))}
              </ul>
            </article>
            </Tilt>
          ))}
        </div>
      </section>

      <section className="panel">
        <header className="panel-head">
          <h2>Gerar proposta</h2>
          <span className={`tier tier-warm`}>
            plano {pkg.name} · {brl(prices[pkg.id])}/mês
            {pkg.adBudget ? ' + verba à parte' : ''}
          </span>
        </header>
        <div className="proposal-grid">
          <div className="proposal-fields">
            <label className="field">
              <span>Cliente</span>
              <input
                list="proposal-leads"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="Clínica Wayne Odonto"
              />
              <datalist id="proposal-leads">
                {leads.map((l) => (
                  <option key={l.id} value={l.company} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>Seu nome</span>
              <input value={seuNome} onChange={(e) => setSeuNome(e.target.value)} placeholder="Bruno" />
            </label>
            <label className="field">
              <span>Sua agência</span>
              <input value={agencia} onChange={(e) => setAgencia(e.target.value)} placeholder="Batcaverna Mkt" />
            </label>
            <label className="field">
              <span>Condições especiais (opcional)</span>
              <textarea
                rows={3}
                value={extras}
                onChange={(e) => setExtras(e.target.value)}
                placeholder="Ex: 1º mês com 20% de desconto fechando esta semana."
              />
            </label>
            <button className={`btn icon-btn ${copied ? 'btn-copied' : 'btn-primary'}`} onClick={copy}>
              {copied ? <IconCheck /> : <IconCopy />}
              <span>{copied ? 'Copiada!' : 'Copiar proposta'}</span>
            </button>
          </div>
          <pre className="script-text proposal-preview">{proposal}</pre>
        </div>
      </section>
    </>
  )
}

export default memo(ProposalView)
