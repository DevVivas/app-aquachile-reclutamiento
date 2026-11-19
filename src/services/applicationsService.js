import { functionsUrl, supabase } from '@/lib/supabase.js'

const LIST_COLUMNS =
  'id, candidate_name, candidate_email, job_title, job_family, stage, assigned_to, ai_status, ai_score, ai_fit, created_at, updated_at'

/** Envía la postulación pública (datos + CV) a la Edge Function. */
export async function submitApplication({ candidateName, candidateEmail, candidatePhone, jobFamily, jobTitle, cvFile, website = '' }) {
  const payload = new FormData()
  payload.append('candidateName', candidateName)
  payload.append('candidateEmail', candidateEmail ?? '')
  payload.append('candidatePhone', candidatePhone ?? '')
  payload.append('jobFamily', jobFamily)
  payload.append('jobTitle', jobTitle)
  payload.append('website', website)
  payload.append('cv', cvFile)

  const response = await fetch(functionsUrl('submit-application'), { method: 'POST', body: payload })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.error || 'Error al procesar la postulación')
    error.fields = body.fields
    throw error
  }
  return body
}

export async function listApplications() {
  const { data, error } = await supabase.from('applications').select(LIST_COLUMNS).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getApplication(id) {
  const { data, error } = await supabase.from('applications').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function updateApplication(id, changes) {
  const { data, error } = await supabase.from('applications').update(changes).eq('id', id).select(LIST_COLUMNS).single()
  if (error) throw error
  return data
}

export const assignApplication = (id, profileId) => updateApplication(id, { assigned_to: profileId || null })
export const moveApplication = (id, stage) => updateApplication(id, { stage })

export async function deleteApplication(id, cvPath) {
  const { error } = await supabase.from('applications').delete().eq('id', id)
  if (error) throw error
  if (cvPath) await supabase.storage.from('cvs').remove([cvPath])
}

/** URL firmada de corta duración para ver/descargar el CV (bucket privado). */
export async function getCvUrl(path, { download = false } = {}) {
  const { data, error } = await supabase.storage.from('cvs').createSignedUrl(path, 60 * 10, download ? { download: true } : undefined)
  if (error) throw error
  return data.signedUrl
}

export async function listNotes(applicationId) {
  const { data, error } = await supabase
    .from('application_notes')
    .select('id, body, created_at, author_id')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addNote(applicationId, body) {
  const { data, error } = await supabase
    .from('application_notes')
    .insert({ application_id: applicationId, body: body.trim() })
    .select('id, body, created_at, author_id')
    .single()
  if (error) throw error
  return data
}

export async function listEvents(applicationId) {
  const { data, error } = await supabase
    .from('application_events')
    .select('id, type, payload, actor_id, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function reanalyze(id) {
  const { data: session } = await supabase.auth.getSession()
  const response = await fetch(functionsUrl('analyze-application'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ id }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.error || 'No se pudo analizar el CV')
  return body
}

/** Escucha cambios en postulaciones (nuevas, análisis IA terminado, asignaciones de otros). */
export function subscribeToApplications(onChange) {
  const channel = supabase
    .channel('applications-feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, (payload) => onChange(payload))
    .subscribe()
  return () => supabase.removeChannel(channel)
}
