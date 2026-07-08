import { memo, useEffect, useMemo, useState } from 'react'
import { SEGMENTS } from '../model.js'
import {
  GENERAL_DIRECTORIES,
  GEO_INTRO,
  MANUAL_CHECKLIST,
  NICHE_MANUALS,
  buildManualText,
} from '../manuals.js'
import { kvGet, kvSet } from '../storage.js'
import { IconBook, IconCheck, IconCopy, IconGlobe, IconPin } from '../icons.jsx'

// Manual SEO & GEO por nicho, com checklist de execução persistido
// por nicho no IndexedDB e exportação do manual em texto.
function ManualsView() {
  const [segment, setSegment] = useState('Academia & Fitness')
  const [cidade, setCidade] = useState('')
  const [checks, setChecks] = useState({}) // { [segment]: [taskId] }
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let alive = true
    kvGet('manual-checks').then((c) => {
      if (!alive) return
      if (c && typeof c === 'object') setChecks(c)
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (loaded) kvSet('manual-checks', checks)
  }, [loaded, checks])

  const manual = NICHE_MANUALS[segment] ?? NICHE_MANUALS.Outro
  const done = checks[segment] ?? []
  const pct = Math.round((done.length / MANUAL_CHECKLIST.length) * 100)

  // substitui {cidade} nos textos quando o usuário preenche
  const fill = useMemo(() => {
    const c = cidade.trim()
    return (text) => (c ? text.replaceAll('{cidade}', c) : text)
  }, [cidade])

  function toggle(taskId) {
    setChecks((cs) => {
      const cur = new Set(cs[segment] ?? [])
      if (cur.has(taskId)) cur.delete(taskId)
      else cur.add(taskId)
      return { ...cs, [segment]: [...cur] }
    })
  }

  async function copyManual() {
    const text = fill(buildManualText(segment))
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
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const allDirectories = [...GENERAL_DIRECTORIES, ...manual.directories]

  return (
    <>
      <section className="panel">
        <header className="panel-head">
          <h2>
            <span className="panel-icon icon-btn">
              <IconBook />
            </span>
            Manual SEO &amp; GEO
          </h2>
          <button className={`btn icon-btn ${copied ? 'btn-copied' : 'btn-primary'}`} onClick={copyManual}>
            {copied ? <IconCheck /> : <IconCopy />}
            <span>{copied ? 'Copiado!' : 'Copiar manual completo'}</span>
          </button>
        </header>
        <div className="manual-setup">
          <label className="field">
            <span>Nicho</span>
            <select value={segment} onChange={(e) => setSegment(e.target.value)}>
              {SEGMENTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>
              <IconPin /> Cidade (personaliza os exemplos)
            </span>
            <input value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Gotham do Sul" />
          </label>
          <div className="manual-progress">
            <div className="month-goal-head">
              <span>execução deste nicho</span>
              <strong>{pct}%</strong>
            </div>
            <div className="goal-bar">
              <div className="goal-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="manual-grid">
        <section className="panel manual-sec">
          <h3 className="manual-title">01 · Google Meu Negócio</h3>
          <dl className="manual-dl">
            <dt>Categoria do perfil</dt>
            <dd>{manual.gmnCategory}</dd>
            <dt>Descrição sugerida (copie e ajuste)</dt>
            <dd className="manual-quote">{fill(manual.desc)}</dd>
            <dt>Fotos que convertem</dt>
            <dd>
              <ul className="manual-list">
                {manual.photos.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </dd>
          </dl>
          <p className="manual-tip">
            Regra de ouro: perfil 100% preenchido + 2 avaliações novas por semana vale mais que
            qualquer truque. O Google ranqueia quem está vivo.
          </p>
        </section>

        <section className="panel manual-sec">
          <h3 className="manual-title">02 · Palavras-chave (SEO local)</h3>
          <p className="manual-tip">
            Use nos títulos do site, na descrição do GMN, nos posts e na bio do Instagram:
          </p>
          <div className="manual-chips">
            {manual.keywords.map((k) => (
              <span key={k} className="chip chip-on">
                {fill(k)}
              </span>
            ))}
          </div>
        </section>

        <section className="panel manual-sec">
          <h3 className="manual-title">03 · GEO — apareça nas respostas das IAs</h3>
          <p className="manual-tip">{fill(GEO_INTRO.replace('{nicho}', segment.toLowerCase()))}</p>
          <dl className="manual-dl">
            <dt>Perguntas que seu site/FAQ deve responder (resposta direta na 1ª frase)</dt>
            <dd>
              <ul className="manual-list">
                {manual.faqs.map((f) => (
                  <li key={f}>{fill(f)}</li>
                ))}
              </ul>
            </dd>
          </dl>
        </section>

        <section className="panel manual-sec">
          <h3 className="manual-title">04 · Conteúdo para redes sociais</h3>
          <p className="manual-tip">
            Cadência mínima que funciona: 3 posts/semana + stories diários. Ideias prontas do nicho:
          </p>
          <ul className="manual-list">
            {manual.content.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>

        <section className="panel manual-sec">
          <h3 className="manual-title">05 · Onde se cadastrar (diretórios &amp; sites)</h3>
          <ul className="manual-dirs">
            {allDirectories.map((d) => (
              <li key={d.name}>
                <IconGlobe />
                <div>
                  <strong>{d.name}</strong>
                  {d.url && <small>{d.url}</small>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel manual-sec">
          <h3 className="manual-title">06 · Checklist de execução</h3>
          <ul className="manual-checks">
            {MANUAL_CHECKLIST.map((t) => {
              const isDone = done.includes(t.id)
              return (
                <li key={t.id}>
                  <button
                    className={`check-item ${isDone ? 'check-done' : ''}`}
                    onClick={() => toggle(t.id)}
                    role="checkbox"
                    aria-checked={isDone}
                  >
                    <span className="check-box">{isDone && <IconCheck />}</span>
                    <span className="check-label">{t.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </>
  )
}

export default memo(ManualsView)
