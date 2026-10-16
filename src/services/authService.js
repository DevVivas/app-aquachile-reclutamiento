/**
 * Devuelve el usuario de la sesión actual o null si no hay sesión válida.
 */
export async function getSession({ signal } = {}) {
  const response = await fetch('/api/auth/me', { signal })
  if (response.status === 401 || response.status === 403) return null
  if (!response.ok) throw new Error('No fue posible verificar la sesión.')
  return response.json()
}

export async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    // Respuesta sin cuerpo JSON.
  }

  if (!response.ok) {
    throw new Error(payload?.error || 'No fue posible iniciar sesión.')
  }
  return payload
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' })
}
