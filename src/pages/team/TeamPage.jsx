import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/auth/authContext.js'
import { ROLES } from '@/constants/pipeline.js'
import { Pill } from '@/pages/dashboard/components/Badges.jsx'
import { listTeam, updateMember } from '@/services/teamService.js'
import { fechaFormato } from '@/utils/formatDate.js'

export default function TeamPage() {
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    listTeam().then(setTeam).catch(() => setError('No se pudo cargar el equipo.'))
  }, [])

  const save = async (member, changes) => {
    setSavingId(member.id)
    setError(null)
    try {
      const updated = await updateMember(member.id, { role: member.role, approved: member.approved, ...changes })
      setTeam((current) => current.map((m) => (m.id === member.id ? { ...m, ...updated } : m)))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  const pending = team?.filter((m) => !m.approved).length ?? 0

  return (
    <>
      <header className="topbar">
        <h1>Equipo de selección</h1>
        {pending > 0 && <Pill tone="amber">{pending} pendiente{pending > 1 ? 's' : ''} de aprobación</Pill>}
      </header>
      {error && <p className="m-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800" role="alert">{error}</p>}
      {!team ? (
        <div className="grid place-items-center py-16 text-muted" role="status">
          <Loader2 className="size-5 animate-spin" aria-label="Cargando equipo" />
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Persona</th>
                <th scope="col">Rol</th>
                <th scope="col">Acceso</th>
                <th scope="col">Alta</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id} data-testid="team-row">
                  <td>
                    <div className="font-medium">{member.full_name}{member.id === user?.id && <span className="text-muted"> (tú)</span>}</div>
                    <div className="text-xs text-muted">{member.email}</div>
                  </td>
                  <td>
                    <select
                      aria-label={`Rol de ${member.full_name}`}
                      value={member.role}
                      disabled={savingId === member.id || member.id === user?.id}
                      onChange={(e) => save(member, { role: e.target.value })}
                      className="h-8 rounded-md border border-line bg-white px-2 text-[13px]"
                    >
                      {Object.entries(ROLES).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {member.approved ? (
                      <button
                        type="button"
                        className="btn-outline"
                        disabled={savingId === member.id || member.id === user?.id}
                        onClick={() => save(member, { approved: false })}
                      >
                        Revocar acceso
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex h-7 items-center rounded-md bg-brand px-3 text-[13px] font-medium text-white disabled:opacity-60"
                        disabled={savingId === member.id}
                        onClick={() => save(member, { approved: true })}
                      >
                        Aprobar
                      </button>
                    )}
                  </td>
                  <td className="date-cell">{fechaFormato(member.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
