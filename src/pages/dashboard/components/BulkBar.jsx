import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Columns2, Loader2, X } from 'lucide-react'
import { ROLES, STAGES } from '@/constants/pipeline.js'
import { comparePath } from '@/constants/routes.js'

const CONTROL =
  'h-8 rounded-md border border-line bg-white px-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60'

/** Acciones sobre varias postulaciones a la vez: asignar responsable o mover de etapa. */
export default function BulkBar({ count, ids = [], team, onAssign, onMove, onClear }) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)

  const run = async (action, value) => {
    setBusy(true)
    setResult(null)
    const outcome = await action(value)
    setResult(outcome)
    setBusy(false)
  }

  return (
    <div
      role="region"
      aria-label="Acciones masivas"
      className="mx-5 mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand/30 bg-brand-soft px-3 py-2"
    >
      <span className="text-[13px] font-medium text-brand" aria-live="polite">
        {count} seleccionada{count === 1 ? '' : 's'}
      </span>
      <select
        aria-label="Asignar responsable a las seleccionadas"
        className={CONTROL}
        disabled={busy}
        value=""
        onChange={(e) => run(onAssign, e.target.value === 'none' ? null : e.target.value)}
      >
        <option value="" disabled>Asignar a…</option>
        <option value="none">Quitar responsable</option>
        {team.filter((member) => member.approved).map((member) => (
          <option key={member.id} value={member.id}>
            {member.full_name} · {ROLES[member.role] ?? member.role}
          </option>
        ))}
      </select>
      <select
        aria-label="Mover las seleccionadas a una etapa"
        className={CONTROL}
        disabled={busy}
        value=""
        onChange={(e) => run(onMove, e.target.value)}
      >
        <option value="" disabled>Mover a…</option>
        {STAGES.map((stage) => (
          <option key={stage.value} value={stage.value}>{stage.label}</option>
        ))}
      </select>
      {count >= 2 && count <= 3 && (
        <Link to={comparePath(ids)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-medium text-white hover:bg-brand/90">
          <Columns2 className="size-3.5" aria-hidden="true" /> Comparar
        </Link>
      )}
      {busy && <Loader2 className="size-4 animate-spin text-brand" aria-label="Aplicando cambios" />}
      {result && !busy && (
        <span className={result.failed ? 'text-[13px] text-red-700' : 'text-[13px] text-green-700'} role="status">
          {result.failed ? `${result.ok} actualizadas, ${result.failed} con error` : `${result.ok} actualizadas`}
        </span>
      )}
      <button type="button" onClick={onClear} className="ml-auto inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] text-muted hover:bg-white hover:text-ink">
        <X className="size-3.5" aria-hidden="true" /> Limpiar selección
      </button>
    </div>
  )
}
