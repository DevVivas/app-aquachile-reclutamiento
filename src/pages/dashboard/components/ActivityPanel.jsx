import { useState } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { STAGE_BY_VALUE } from '@/constants/pipeline.js'
import { haceCuanto } from '@/utils/formatDate.js'

function describe(event, nameOf) {
  const p = event.payload ?? {}
  switch (event.type) {
    case 'created':
      return 'Postulación recibida desde el formulario'
    case 'stage_changed':
      return `Movió de ${STAGE_BY_VALUE[p.from]?.label ?? p.from} a ${STAGE_BY_VALUE[p.to]?.label ?? p.to}`
    case 'assigned':
      return p.to ? `Asignó a ${nameOf(p.to)}` : 'Quitó la asignación'
    case 'ai_analyzed':
      return `Análisis IA completado: ${p.score}/100 (${p.fit})`
    case 'note_added':
      return 'Agregó una nota'
    default:
      return event.type
  }
}

export default function ActivityPanel({ notes, events, team, onAddNote }) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const nameOf = (id) => team.find((member) => member.id === id)?.full_name ?? 'Sistema'

  const submit = async (event) => {
    event.preventDefault()
    if (!draft.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onAddNote(draft)
      setDraft('')
    } catch {
      setError('No se pudo guardar la nota.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <section className="rounded-lg border border-line bg-white" aria-labelledby="notes-title">
        <header className="border-b border-line px-4 py-2.5">
          <h2 id="notes-title" className="flex items-center gap-1.5 text-[13px] font-semibold">
            <MessageSquare className="size-4 text-brand" aria-hidden="true" /> Notas del equipo
          </h2>
        </header>
        <form onSubmit={submit} className="space-y-2 border-b border-line p-4">
          <label htmlFor="note" className="sr-only">Nueva nota</label>
          <textarea
            id="note"
            rows={3}
            maxLength={4000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e)
            }}
            placeholder="Impresiones de la entrevista, observaciones psicolaborales, referencias…"
            className="w-full resize-y rounded-md border border-line px-3 py-2 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted">Ctrl + Enter para guardar</span>
            <button
              type="submit"
              disabled={saving || !draft.trim()}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
              Guardar nota
            </button>
          </div>
          {error && <p className="text-xs text-red-700" role="alert">{error}</p>}
        </form>
        <ul className="divide-y divide-line" data-testid="notes-list">
          {notes.length === 0 && <li className="px-4 py-3 text-xs text-muted">Sin notas todavía.</li>}
          {notes.map((note) => (
            <li key={note.id} className="px-4 py-3">
              <p className="text-xs text-muted">
                <span className="font-medium text-ink">{nameOf(note.author_id)}</span> · {haceCuanto(note.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[13px]">{note.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-white" aria-labelledby="history-title">
        <header className="border-b border-line px-4 py-2.5">
          <h2 id="history-title" className="text-[13px] font-semibold">Historial</h2>
        </header>
        <ol className="space-y-3 p-4">
          {events.map((event) => (
            <li key={event.id} className="relative pl-4 text-xs before:absolute before:top-1.5 before:left-0 before:size-1.5 before:rounded-full before:bg-brand/50">
              <p>
                {event.actor_id && <span className="font-medium">{nameOf(event.actor_id)} · </span>}
                {describe(event, nameOf)}
              </p>
              <p className="text-muted">{haceCuanto(event.created_at)}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
