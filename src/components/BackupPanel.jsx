import { memo, useRef, useState } from 'react'
import { kvGet } from '../storage.js'
import { IconCheck, IconCopy, IconDownload, IconUpload } from '../icons.jsx'

// Backup completo: CRM/metas (props ao vivo) + Cofre/Arquivo (IndexedDB).
// Exporta como arquivo .json ou copia; importa por arquivo ou colando.
function BackupPanel({ leads, goals, goalsDate, onImport }) {
  const [pasted, setPasted] = useState('')
  const [copied, setCopied] = useState(false)
  const fileRef = useRef(null)

  async function buildBackup() {
    const [entries, goal, notes] = await Promise.all([
      kvGet('finance-entries'),
      kvGet('finance-goal'),
      kvGet('notes'),
    ])
    return {
      app: 'batcaverna-ops',
      version: 1,
      exportedAt: new Date().toISOString(),
      crm: { leads, goals, goalsDate },
      cofre: { entries: entries ?? [], goal: typeof goal === 'number' ? goal : 0 },
      arquivo: { notes: notes ?? [] },
    }
  }

  async function download() {
    const backup = await buildBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `batcaverna-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }

  async function copyJson() {
    const backup = await buildBackup()
    const text = JSON.stringify(backup)
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

  function applyImport(text) {
    let backup
    try {
      backup = JSON.parse(text)
    } catch {
      alert('JSON inválido — confira o conteúdo colado/selecionado.')
      return
    }
    if (backup?.app !== 'batcaverna-ops' || !backup.crm) {
      alert('Este arquivo não parece ser um backup da Batcaverna Ops.')
      return
    }
    const ok = window.confirm(
      'Importar este backup vai SUBSTITUIR os dados atuais (leads, metas, cofre e notas). Continuar?',
    )
    if (!ok) return
    onImport(backup)
    setPasted('')
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => applyImport(String(reader.result))
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <section className="panel backup">
      <header className="panel-head">
        <h2>
          <span className="panel-icon icon-btn">
            <IconDownload />
          </span>
          Backup dos dados
        </h2>
        <span className="kanban-total">
          os dados vivem neste navegador — exporte de tempos em tempos
        </span>
      </header>
      <div className="backup-grid">
        <div className="backup-col">
          <h3>Exportar</h3>
          <p>Gera um arquivo com tudo: leads, metas, cofre e notas.</p>
          <div className="backup-actions">
            <button className="btn btn-primary icon-btn" onClick={download}>
              <IconDownload />
              <span>Baixar backup (.json)</span>
            </button>
            <button className={`btn icon-btn ${copied ? 'btn-copied' : ''}`} onClick={copyJson}>
              {copied ? <IconCheck /> : <IconCopy />}
              <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>
        </div>
        <div className="backup-col">
          <h3>Importar</h3>
          <p>Restaura um backup neste aparelho (substitui os dados atuais).</p>
          <div className="backup-actions">
            <button className="btn icon-btn" onClick={() => fileRef.current?.click()}>
              <IconUpload />
              <span>Escolher arquivo…</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={onFile}
              hidden
            />
          </div>
          <textarea
            rows={2}
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="…ou cole o JSON do backup aqui"
            aria-label="Colar JSON do backup"
          />
          {pasted.trim() && (
            <button className="btn btn-primary icon-btn" onClick={() => applyImport(pasted)}>
              <IconUpload />
              <span>Importar JSON colado</span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default memo(BackupPanel)
