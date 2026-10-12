const INICIAR_EVALUACION_URL = '/api/evaluaciones/iniciar'

/**
 * Envía la solicitud de evaluación (datos del candidato + CV) al backend.
 * Lanza un Error si la respuesta no es 2xx.
 */
export async function iniciarEvaluacion({ candidateName, jobFamily, jobTitle, cvFile }) {
  const payload = new FormData()
  payload.append('candidateName', candidateName)
  payload.append('jobFamily', jobFamily)
  payload.append('jobTitle', jobTitle)
  payload.append('cv', cvFile)

  const response = await fetch(INICIAR_EVALUACION_URL, {
    method: 'POST',
    body: payload,
  })

  if (!response.ok) throw new Error('Error al procesar la solicitud')
}
