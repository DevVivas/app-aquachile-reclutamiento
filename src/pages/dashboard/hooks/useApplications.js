import { useCallback, useEffect, useState } from 'react'
import {
  assignApplication,
  listApplications,
  moveApplication,
  subscribeToApplications,
} from '@/services/applicationsService.js'
import { listTeam } from '@/services/teamService.js'

/**
 * Los eventos de Realtime pueden llegar atrasados (p. ej. el del análisis IA después
 * de que el usuario movió la etapa). Solo se aplica un evento si no es más viejo
 * que lo que ya tenemos; updated_at lo fija un trigger en cada UPDATE.
 */
export function mergeNewer(current, incoming) {
  if (current.updated_at && incoming.updated_at && incoming.updated_at < current.updated_at) return current
  return { ...current, ...incoming }
}

/** Postulaciones + equipo, con actualizaciones en tiempo real y cambios optimistas. */
export function useApplications() {
  const [applications, setApplications] = useState([])
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(
    () =>
      Promise.all([listApplications(), listTeam()])
        .then(([apps, members]) => {
          setApplications(apps)
          setTeam(members)
          setError(null)
        })
        .catch(() => setError('No se pudieron cargar las postulaciones.'))
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    Promise.resolve().then(load)
    return subscribeToApplications(({ eventType, new: row, old }) => {
      setApplications((current) => {
        if (eventType === 'DELETE') return current.filter((app) => app.id !== old.id)
        const exists = current.some((app) => app.id === row.id)
        if (!exists) return [row, ...current]
        return current.map((app) => (app.id === row.id ? mergeNewer(app, row) : app))
      })
    })
  }, [load])

  const patch = useCallback(async (id, changes, action) => {
    let previous
    setApplications((current) =>
      current.map((app) => {
        if (app.id !== id) return app
        previous = app
        return { ...app, ...changes }
      }),
    )
    try {
      const saved = await action()
      setApplications((current) => current.map((app) => (app.id === id ? { ...app, ...saved } : app)))
      return saved
    } catch (err) {
      if (previous) setApplications((current) => current.map((app) => (app.id === id ? previous : app)))
      throw err
    }
  }, [])

  const assign = useCallback(
    (id, profileId) => patch(id, { assigned_to: profileId || null }, () => assignApplication(id, profileId)),
    [patch],
  )
  const move = useCallback((id, stage) => patch(id, { stage }, () => moveApplication(id, stage)), [patch])

  return { applications, team, loading, error, reload: load, assign, move }
}
