import { memo } from 'react'
import { useEffect, useState } from 'react'
import { kvGet, kvSet } from '../storage.js'
import { uid } from '../model.js'
import { IconArchive, IconPlus, IconTrash } from '../icons.jsx'

// Arquivo: notas rápidas da operação. Persistência via IndexedDB.
function NotesView() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    kvGet('notes').then((n) => {
      if (!alive) return
      if (Array.isArray(n)) setNotes(n)
      setLoaded(true)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (loaded) kvSet('notes', notes)
  }, [loaded, notes])

  function submit(e) {
    e.preventDefault()
    if (!body.trim()) return
    setNotes((ns) => [
      { id: uid(), title: title.trim(), body: body.trim(), createdAt: Date.now() },
      ...ns,
    ])
    setTitle('')
    setBody('')
  }

  function remove(id) {
    setNotes((ns) => ns.filter((n) => n.id !== id))
  }

  return (
    <>
      <section className="panel">
        <header className="panel-head">
          <h2>
            <span className="panel-icon icon-btn">
              <IconArchive />
            </span>
            Arquivo — notas da operação
          </h2>
          <span className="kanban-total">
            {notes.length} nota{notes.length === 1 ? '' : 's'} no arquivo
          </span>
        </header>
        <form className="note-form" onSubmit={submit}>
          <label className="field">
            <span>Título (opcional)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Ideia de campanha para pet shops"
            />
          </label>
          <label className="field">
            <span>Nota *</span>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva a nota da operação aqui…"
            />
          </label>
          <button className="btn btn-primary icon-btn note-submit" type="submit">
            <IconPlus />
            <span>Salvar nota</span>
          </button>
        </form>
      </section>

      {notes.length > 0 && (
        <div className="notes-grid">
          {notes.map((n) => (
            <article key={n.id} className="panel note-card">
              <header className="note-head">
                {n.title ? <h3>{n.title}</h3> : <h3 className="note-untitled">sem título</h3>}
                <button
                  className="kcard-remove icon-btn"
                  onClick={() => remove(n.id)}
                  title="Excluir nota"
                  aria-label={`Excluir nota ${n.title || 'sem título'}`}
                >
                  <IconTrash />
                </button>
              </header>
              <p className="note-body">{n.body}</p>
              <time className="note-date">
                {new Date(n.createdAt).toLocaleDateString('pt-BR')} ·{' '}
                {new Date(n.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

export default memo(NotesView)
