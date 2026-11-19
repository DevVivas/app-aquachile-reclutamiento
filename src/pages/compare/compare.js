// Lógica pura de la comparación (testeable).
export const CRITERIA = [
  { key: 'leadership', label: 'Liderazgo' },
  { key: 'experience', label: 'Experiencia' },
  { key: 'familyMatch', label: 'Afinidad con la familia' },
  { key: 'roleMatch', label: 'Afinidad con el cargo' },
  { key: 'education', label: 'Formación' },
]

export const MAX_COMPARE = 3

export function parseIds(search) {
  const raw = new URLSearchParams(search).get('ids') ?? ''
  return [...new Set(raw.split(',').filter((id) => /^[0-9a-f-]{36}$/i.test(id)))].slice(0, MAX_COMPARE)
}

/** Para cada criterio, los ids con el mayor puntaje (empates incluidos; nadie si todos son 0). */
export function leadersByCriterion(applications) {
  const result = {}
  for (const { key } of [...CRITERIA, { key: 'total' }]) {
    const values = applications.map((app) => ({
      id: app.id,
      value: key === 'total' ? (app.ai_score ?? -1) : (app.ai_analysis?.rubric?.breakdown?.[key] ?? -1),
    }))
    const max = Math.max(...values.map((v) => v.value))
    result[key] = max > 0 ? values.filter((v) => v.value === max).map((v) => v.id) : []
  }
  return result
}

export const sameRole = (applications) =>
  new Set(applications.map((app) => `${app.job_title.trim().toLowerCase()}|${app.job_family}`)).size <= 1
