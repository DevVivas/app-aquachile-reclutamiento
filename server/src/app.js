import express from 'express'
import helmet from 'helmet'
import multer from 'multer'
import { HttpError, router } from './routes.js'

const app = express()

app.disable('x-powered-by')
app.use(helmet())
app.use(express.json({ limit: '16kb' }))
app.use('/api', router)

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

    console.error('Error interno procesando una solicitud API.')
    return response.status(500).json({ error: 'Error interno del servidor.' })
})

export { app }
