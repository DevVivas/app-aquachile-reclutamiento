import { HttpError } from './errors.js'

/**
 * Limitador en memoria por IP (ventana fija). Suficiente para una sola instancia.
 * Si escalas a varias instancias, muévelo a un almacén compartido.
 */
export function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map()

  const cleanup = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key)
    }
  }, windowMs)
  cleanup.unref()

  return (request, response, next) => {
    const now = Date.now()
    const key = request.ip
    let entry = hits.get(key)

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs }
      hits.set(key, entry)
    }

    entry.count += 1
    if (entry.count > max) {
      response.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      return next(new HttpError(429, message))
    }

    return next()
  }
}
