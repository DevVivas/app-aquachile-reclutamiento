import { useState } from 'react'
import { ROLES } from '@/constants/pipeline.js'
import { cn } from '@/lib/utils.js'

/** Selector de evaluador responsable. Solo muestra miembros aprobados. */
export default function AssigneeSelect({ value, team, onChange, label = 'Responsable', className }) {
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const members = team.filter((member) => member.approved)

  const handleChange = async (event) => {
    setSaving(true)
    setFailed(false)
    try {
      await onChange(event.target.value || null)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <select
      aria-label={label}
      value={value ?? ''}
      onChange={handleChange}
      onClick={(event) => event.stopPropagation()}
      disabled={saving}
      title={failed ? 'No se pudo asignar. Intenta nuevamente.' : undefined}
      className={cn(
        'h-8 max-w-[200px] rounded-md border bg-white px-2 text-[13px] text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60',
        value ? 'border-line' : 'border-dashed border-amber-300 text-amber-800',
        failed && 'border-red-400',
        className,
      )}
    >
      <option value="">Sin asignar</option>
      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {member.full_name} · {ROLES[member.role] ?? member.role}
        </option>
      ))}
    </select>
  )
}
