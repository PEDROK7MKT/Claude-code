import { memo } from 'react'
import { useMemo, useState } from 'react'
import { IconShip } from '../icons.jsx'

const brl = (n) =>
  Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// Calculadora de importação (regime de remessa, estimativa):
// II sobre (produto + frete) em R$; ICMS "por dentro" sobre base + II.
function ImportCalc() {
  const [form, setForm] = useState({
    productUsd: 100,
    freightUsd: 20,
    fx: 5.5,
    units: 10,
    iiPct: 60,
    icmsPct: 17,
    fixedFees: 50,
    marginPct: 45,
  })

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const calc = useMemo(() => {
    const n = (v) => Math.max(0, Number(v) || 0)
    const customsBase = (n(form.productUsd) + n(form.freightUsd)) * n(form.fx)
    const ii = customsBase * (n(form.iiPct) / 100)
    const icmsRate = Math.min(99, n(form.icmsPct)) / 100
    // ICMS "por dentro": a alíquota incide sobre a própria base final
    const icms = ((customsBase + ii) / (1 - icmsRate)) * icmsRate
    const total = customsBase + ii + icms + n(form.fixedFees)
    const units = Math.max(1, Math.round(n(form.units)))
    const unitCost = total / units
    const margin = Math.min(95, n(form.marginPct)) / 100
    const sellPrice = unitCost / (1 - margin)
    const profitUnit = sellPrice - unitCost
    return { customsBase, ii, icms, total, units, unitCost, sellPrice, profitUnit }
  }, [form])

  const breakdown = [
    { label: 'Valor aduaneiro (produto + frete)', value: calc.customsBase },
    { label: `Imposto de importação (${form.iiPct || 0}%)`, value: calc.ii },
    { label: `ICMS por dentro (${form.icmsPct || 0}%)`, value: calc.icms },
    { label: 'Taxas fixas (despacho / frete nacional)', value: Number(form.fixedFees) || 0 },
  ]
  const maxPart = Math.max(...breakdown.map((b) => b.value), 1)

  const fields = [
    { id: 'productUsd', label: 'Produto (US$)', step: '0.01' },
    { id: 'freightUsd', label: 'Frete internacional (US$)', step: '0.01' },
    { id: 'fx', label: 'Cotação do dólar (R$)', step: '0.01' },
    { id: 'units', label: 'Unidades no pedido', step: '1' },
    { id: 'iiPct', label: 'Imposto de importação (%)', step: '1' },
    { id: 'icmsPct', label: 'ICMS (%)', step: '0.1' },
    { id: 'fixedFees', label: 'Taxas fixas (R$)', step: '0.01' },
    { id: 'marginPct', label: 'Margem desejada (%)', step: '1' },
  ]

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>
          <span className="panel-icon icon-btn">
            <IconShip />
          </span>
          Calculadora de importação
        </h2>
        <span className="kanban-total">estimativa — confirme alíquotas do seu caso</span>
      </header>

      <div className="calc-grid">
        <div className="calc-fields">
          {fields.map((f) => (
            <label key={f.id} className="field">
              <span>{f.label}</span>
              <input
                type="number"
                min="0"
                step={f.step}
                value={form[f.id]}
                onChange={(e) => set(f.id, e.target.value)}
              />
            </label>
          ))}
        </div>

        <div className="calc-result">
          <div className="calc-breakdown">
            {breakdown.map((b) => (
              <div key={b.label} className="calc-row">
                <div className="calc-row-head">
                  <span>{b.label}</span>
                  <strong>{brl(b.value)}</strong>
                </div>
                <div className="rule-bar">
                  <div className="rule-fill" style={{ width: `${(b.value / maxPart) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="calc-totals">
            <div className="calc-total">
              <span>Custo total do pedido</span>
              <strong>{brl(calc.total)}</strong>
            </div>
            <div className="calc-total">
              <span>Custo por unidade ({calc.units} un)</span>
              <strong>{brl(calc.unitCost)}</strong>
            </div>
            <div className="calc-total calc-total-hl">
              <span>Preço de venda sugerido</span>
              <strong>{brl(calc.sellPrice)}</strong>
            </div>
            <div className="calc-total calc-total-win">
              <span>Lucro por unidade</span>
              <strong>{brl(calc.profitUnit)}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default memo(ImportCalc)
