const LOGIN_URL = '/api/auth/login'

/**
 * Inicia sesión contra el backend. La sesión debe viajar en una cookie httpOnly
 * que setea el servidor; aquí nunca se guarda ningún token en el navegador.
 * Lanza un Error con mensaje genérico para no revelar si el correo existe.
 */
export async function login(email, password) {
  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (response.status === 429) throw new Error('Demasiados intentos. Espera unos minutos.')
  if (!response.ok) throw new Error('Correo o contraseña incorrectos.')
}
