// Filtros y orden del panel (puros, testeables).
export const ALL = 'todas'

const normalize = (value) =>
  (value ?? '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function filterApplications(applications, { stage = ALL, query = '', assignee = ALL, family = ALL, sort = 'recent' }, currentUserId) {
  const q = normalize(query.trim())
  const result = applications.filter((app) => {
    if (stage !== ALL && app.stage !== stage) return false
    if (family !== ALL && app.job_family !== family) return false
    if (assignee === 'me' && app.assigned_to !== currentUserId) return false
    if (assignee === 'none' && app.assigned_to) return false
    if (![ALL, 'me', 'none'].includes(assignee) && app.assigned_to !== assignee) return false
    if (q && !normalize(`${app.candidate_name} ${app.job_title} ${app.candidate_email ?? ''}`).includes(q)) return false
    return true
  })

  if (sort === 'score') result.sort((a, b) => (b.ai_score ?? -1) - (a.ai_score ?? -1))
  else result.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return result
}

export function computeStats(applications, currentUserId) {
  const active = applications.filter((app) => !['contratado', 'descartado'].includes(app.stage))
  return {
    total: applications.length,
    unassigned: active.filter((app) => !app.assigned_to).length,
    mine: active.filter((app) => app.assigned_to === currentUserId).length,
    highFit: active.filter((app) => app.ai_fit === 'alto').length,
    inEvaluation: applications.filter((app) => app.stage === 'evaluacion_psicolaboral').length,
  }
}
