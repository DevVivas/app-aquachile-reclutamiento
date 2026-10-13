import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { config } from './config.js'
import { supabase } from './supabase.js'

const MAX_CV_BYTES = 10 * 1024 * 1024
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ACCEPTED_CV_TYPES = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CV_BYTES, files: 1, fields: 3 },
})

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function requireText(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `El campo ${label} es obligatorio.`)
  }
  return value.trim()
}

function sanitizedFilename(originalName) {
  const extension = path.extname(originalName).toLowerCase()
  const baseName = path.basename(originalName, path.extname(originalName))
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)

  return `${baseName || 'curriculum'}${extension}`
}

function validateCv(file) {
  if (!file) {
    throw new HttpError(400, 'El archivo CV es obligatorio.')
  }

  const extension = path.extname(file.originalname).toLowerCase()
  if (!ACCEPTED_CV_TYPES[extension] || ACCEPTED_CV_TYPES[extension] !== file.mimetype) {
    throw new HttpError(400, 'El CV debe ser PDF, DOC o DOCX con un tipo de archivo válido.')
  }
}

async function cleanUpFailedRequest({ candidateId, requestId, cvPath }) {
  const cleanupErrors = []
  const runCleanup = async (operation) => {
    try {
      const { error } = await operation()
      if (error) cleanupErrors.push(error)
    } catch (error) {
      cleanupErrors.push(error)
    }
  }

  if (cvPath) {
    await runCleanup(() => supabase.storage.from(config.cvBucket).remove([cvPath]))
  }

  if (requestId) {
    await runCleanup(() => supabase.from('solicitudes').delete().eq('id', requestId))
  }

  if (candidateId) {
    await runCleanup(() => supabase.from('candidatos').delete().eq('id', candidateId))
  }

  if (cleanupErrors.length > 0) {
    console.error(
      `No fue posible limpiar todos los datos de una solicitud fallida (${cleanupErrors.length} error(es)).`,
    )
  }
}

router.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

router.post('/evaluaciones/iniciar', upload.single('cv'), async (request, response, next) => {
  let candidateId
  const requestId = randomUUID()
  let cvPath

  try {
    const candidateName = requireText(request.body.candidateName, 'candidateName')
    const jobFamily = requireText(request.body.jobFamily, 'jobFamily')
    const jobTitle = requireText(request.body.jobTitle, 'jobTitle')
    validateCv(request.file)

    const { data: candidate, error: candidateError } = await supabase
      .from('candidatos')
      .insert({ nombre: candidateName })
      .select('id')
      .single()

    if (candidateError) throw candidateError
    candidateId = candidate.id

    const { error: requestError } = await supabase
      .from('solicitudes')
      .insert({
        id: requestId,
        candidato_id: candidateId,
        cargo: jobTitle,
        familia_cargo: jobFamily,
        estado: 'Pendiente',
      })

    if (requestError) throw requestError

    const filename = sanitizedFilename(request.file.originalname)
    cvPath = `${requestId}/${filename}`
    const { error: uploadError } = await supabase.storage
      .from(config.cvBucket)
      .upload(cvPath, request.file.buffer, {
        contentType: request.file.mimetype,
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { error: pathError } = await supabase
      .from('solicitudes')
      .update({ cv_path: cvPath })
      .eq('id', requestId)

    if (pathError) throw pathError

    response.status(201).json({ id: requestId })
  } catch (error) {
    if (candidateId) {
      try {
        await cleanUpFailedRequest({ candidateId, requestId, cvPath })
      } catch (cleanupError) {
        console.error('Falló la limpieza de una solicitud incompleta.', cleanupError)
      }
    }
    next(error)
  }
})

router.get('/solicitudes', async (_request, response, next) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('id,candidato_id,cargo,familia_cargo,responsable,estado,created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    response.json(data.map((solicitud) => ({
      id: solicitud.id,
      candidateId: solicitud.candidato_id,
      jobTitle: solicitud.cargo,
      jobFamily: solicitud.familia_cargo,
      owner: solicitud.responsable,
      requestedAt: solicitud.created_at.slice(0, 10),
      status: solicitud.estado,
    })))
  } catch (error) {
    next(error)
  }
})

router.get('/candidatos', async (_request, response, next) => {
  try {
    const { data, error } = await supabase
      .from('candidatos')
      .select('id,nombre')
      .order('created_at', { ascending: false })

    if (error) throw error
    response.json(data.map(({ id, nombre }) => ({ id, name: nombre })))
  } catch (error) {
    next(error)
  }
})

router.get('/solicitudes/:id/cv', async (request, response, next) => {
  try {
    if (!UUID_PATTERN.test(request.params.id)) {
      throw new HttpError(400, 'El identificador de solicitud no es válido.')
    }

    const { data: solicitud, error: requestError } = await supabase
      .from('solicitudes')
      .select('cv_path')
      .eq('id', request.params.id)
      .maybeSingle()

    if (requestError) throw requestError
    if (!solicitud?.cv_path) {
      throw new HttpError(404, 'No se encontró el CV de esta solicitud.')
    }

    const { data, error } = await supabase.storage
      .from(config.cvBucket)
      .createSignedUrl(solicitud.cv_path, 60)

    if (error) throw error
    response.json({ signedUrl: data.signedUrl })
  } catch (error) {
    next(error)
  }
})

export { HttpError, router }
