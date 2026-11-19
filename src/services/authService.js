import { functionsUrl, supabase } from '@/lib/supabase.js'

/** Inicia sesión. Mensaje genérico para no revelar si el correo existe. */
export async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (!error) return
  if (error.status === 429) throw new Error('Demasiados intentos. Espera unos minutos.')
  throw new Error('Correo o contraseña incorrectos.')
}

/** Crea la cuenta (queda pendiente de aprobación) e inicia sesión. */
export async function signup({ fullName, email, password, role, website = '' }) {
  const response = await fetch(functionsUrl('register-staff'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, email, password, role, website }),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(body.error || 'No se pudo crear la cuenta.')
    error.fields = body.fields
    throw error
  }
  await login(email, password)
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function getProfile(userId) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}
