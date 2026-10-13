async function getJson(url, signal) {
  const response = await fetch(url, { signal })
  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error('El servidor devolvió una respuesta no válida.')
  }

  if (!response.ok) {
    throw new Error(payload?.error || 'No fue posible cargar la información.')
  }

  return payload
}

export function getRequests({ signal } = {}) {
  return getJson('/api/solicitudes', signal)
}

export function getCandidates({ signal } = {}) {
  return getJson('/api/candidatos', signal)
}
