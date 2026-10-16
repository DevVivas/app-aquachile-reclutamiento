import path from 'node:path'
import express from 'express'
import helmet from 'helmet'
import multer from 'multer'
import { config } from './config.js'
import { HttpError } from './errors.js'
import { router } from './routes.js'

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', config.trustProxy)
app.use(helmet())
app.use(express.json({ limit: '16kb' }))

// Las respuestas de la API nunca se cachean (contienen datos de candidatos).
app.use(
  '/api',
  (_request, response, next) => {
    response.set('Cache-Control', 'no-store')
    next()
  },
  router,
)
app.use('/api', (_request, _response, next) => {
  next(new HttpError(404, 'Ruta no encontrada.'))
})

// Modo Render: la misma app sirve la SPA compilada (un solo origen, sin CORS ni proxy).
if (config.staticDir) {
  const staticDir = path.resolve(config.staticDir)
  const indexFile = path.join(staticDir, 'index.html')

  app.use('/assets', express.static(path.join(staticDir, 'assets'), {
    immutable: true,
    maxAge: '1y',
  }))
  app.use(express.static(staticDir, { index: false, maxAge: '1h' }))
  app.use((request, response, next) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return next()
    response.set('Cache-Control', 'no-cache')
    return response.sendFile(indexFile)
  })
}

app.use((_request, _response, next) => {
  next(new HttpError(404, 'Ruta no encontrada.'))
})

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError) {
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'El CV no puede superar los 10 MB.'
      : 'La solicitud multipart no es válida.'
    return response.status(status).json({ error: message })
  }

  if (error instanceof HttpError) {
    return response.status(error.status).json({ error: error.message })
  }

  // Errores de cliente de body-parser (JSON mal formado, cuerpo demasiado grande, etc.).
  if (Number.isInteger(error?.status) && error.status >= 400 && error.status < 500) {
    return response.status(error.status).json({ error: 'La solicitud no es válida.' })
  }

  console.error('Error interno procesando una solicitud API.')
  return response.status(500).json({ error: 'Error interno del servidor.' })
})

export { app }
