import { Router } from 'express'
import { config } from './config.js'
import { HttpError } from './errors.js'
import { createRateLimiter } from './rateLimit.js'
import { supabase } from './supabase.js'

const ACCESS_COOKIE = 'aq_access'
const REFRESH_COOKIE = 'aq_refresh'
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const AUTH_TIMEOUT_MS = 10_000

// Las cookies solo viajan a /api, son httpOnly y SameSite=Strict (mitiga CSRF y XSS).
const cookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'strict',
  path: '/api',
}

const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de inicio de sesión. Espera unos minutos.',
})

function parseCookies(header = '') {
  const cookies = {}
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    const name = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (!name) continue
    try {
      cookies[name] = decodeURIComponent(value)
    } catch {
      // Cookie mal codificada: se ignora.
    }
  }
  return cookies
}

function setSessionCookies(response, session) {
  response.cookie(ACCESS_COOKIE, session.access_token, {
    ...cookieOptions,
    maxAge: session.expires_in * 1000,
  })
  response.cookie(REFRESH_COOKIE, session.refresh_token, {
    ...cookieOptions,
    maxAge: REFRESH_MAX_AGE_MS,
  })
}

function clearSessionCookies(response) {
  response.clearCookie(ACCESS_COOKIE, cookieOptions)
  response.clearCookie(REFRESH_COOKIE, cookieOptions)
}

// Llama al endpoint de tokens de Supabase Auth (GoTrue) sin crear sesión en el cliente
// con service role. Devuelve null si las credenciales/refresh token no son válidos.
async function requestToken(grantType, body) {
  let response
  try {
    response = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=${grantType}`, {
      method: 'POST',
      headers: {
        apikey: config.supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
    })
  } catch {
    throw new HttpError(502, 'No fue posible contactar el servicio de autenticación.')
  }

  if (response.status >= 500) {
    throw new HttpError(502, 'No fue posible contactar el servicio de autenticación.')
  }
  if (!response.ok) return null
  return response.json()
}

async function getUserFromAccessToken(accessToken) {
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data?.user) return null
  return data.user
}

async function loadProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('nombre,rol')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Exige sesión válida y un perfil autorizado en public.profiles.
 * Si el access token venció pero hay refresh token, renueva la sesión en silencio.
 */
export async function requireAuth(request, response, next) {
  try {
    const cookies = parseCookies(request.headers.cookie)
    let user = cookies[ACCESS_COOKIE]
      ? await getUserFromAccessToken(cookies[ACCESS_COOKIE])
      : null

    if (!user && cookies[REFRESH_COOKIE]) {
      const session = await requestToken('refresh_token', {
        refresh_token: cookies[REFRESH_COOKIE],
      })
      if (session?.user) {
        setSessionCookies(response, session)
        user = session.user
      }
    }

    if (!user) {
      clearSessionCookies(response)
      throw new HttpError(401, 'Debes iniciar sesión.')
    }

    const profile = await loadProfile(user.id)
    if (!profile) {
      throw new HttpError(403, 'Tu usuario no tiene acceso a esta aplicación.')
    }

    request.user = { id: user.id, email: user.email, nombre: profile.nombre, rol: profile.rol }
    next()
  } catch (error) {
    next(error)
  }
}

export const authRouter = Router()

authRouter.post('/login', loginLimiter, async (request, response, next) => {
  try {
    const body = request.body ?? {}
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password || email.length > 254 || password.length > 256) {
      throw new HttpError(400, 'Ingresa tu correo y tu contraseña.')
    }

    const session = await requestToken('password', { email, password })
    if (!session?.user) {
      throw new HttpError(401, 'Correo o contraseña incorrectos.')
    }

    const profile = await loadProfile(session.user.id)
    if (!profile) {
      throw new HttpError(403, 'Tu usuario no tiene acceso a esta aplicación.')
    }

    setSessionCookies(response, session)
    response.json({ email: session.user.email, nombre: profile.nombre, rol: profile.rol })
  } catch (error) {
    next(error)
  }
})

authRouter.get('/me', requireAuth, (request, response) => {
  const { email, nombre, rol } = request.user
  response.json({ email, nombre, rol })
})

authRouter.post('/logout', async (request, response, next) => {
  try {
    const accessToken = parseCookies(request.headers.cookie)[ACCESS_COOKIE]
    if (accessToken) {
      try {
        await supabase.auth.admin.signOut(accessToken, 'local')
      } catch {
        // Mejor esfuerzo: igualmente se eliminan las cookies.
      }
    }
    clearSessionCookies(response)
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})
