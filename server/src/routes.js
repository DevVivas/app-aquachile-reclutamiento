import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { authRouter, requireAuth } from './auth.js'
import { config } from './config.js'
import { HttpError } from './errors.js'
import { hasValidSignature } from './fileSignature.js'
import { createRateLimiter } from './rateLimit.js'
import { supabase } from './supabase.js'

const MAX_CV_BYTES = 10 * 1024 * 1024
const MAX_TEXT_LENGTH = 120
const SIGNED_URL_SECONDS = 60
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
const submitLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Demasiadas solicitudes desde esta red. Intenta nuevamente más tarde.',
})

function requireText(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `El campo ${label} es obligatorio.`)
  }
  const text = value.trim()
  if (text.length > MAX_TEXT_LENGTH) {
    throw new HttpError(400, `El campo ${label} no puede superar ${MAX_TEXT_LENGTH} caracteres.`)
  }
  return text
}

function assertUuid(value) {
  if (!UUID_PATTERN.test(value)) {
    throw new HttpError(400, 'El identificador no es válido.')
  }
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
  if (!hasValidSignature(extension, file.buffer)) {
    throw new HttpError(400, 'El contenido del archivo no corresponde a un PDF, DOC o DOCX válido.')
  }
}

async function assertJobFamilyExists(jobFamily) {
  const { data, error } = await supabase
    .from('familias_cargo')
    .select('nombre')
    .eq('nombre', jobFamily)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new HttpError(400, 'La familia de cargo no es válida.')
}

async function removeUploadedCv(cvPath) {
  try {
    const { error } = await supabase.storage.from(config.cvBucket).remove([cvPath])
    if (error) console.error('No fue posible eliminar un CV huérfano.')
  } catch {
    console.error('No fue posible eliminar un CV huérfano.')
  }
}

router.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok' })
})

// Público: formulario de solicitud (con límite de frecuencia por IP).
router.post(
  '/evaluaciones/iniciar',
  submitLimiter,
  upload.single('cv'),
  async (request, response, next) => {
    let cvPath

    try {
      const body = request.body ?? {}
      const candidateName = requireText(body.candidateName, 'candidateName')
      const jobFamily = requireText(body.jobFamily, 'jobFamily')
      const jobTitle = requireText(body.jobTitle, 'jobTitle')
      validateCv(request.file)
      await assertJobFamilyExists(jobFamily)

      // 1) Sube el CV; 2) crea candidato + solicitud + documento en una sola transacción.
      const requestId = randomUUID()
      cvPath = `${requestId}/${sanitizedFilename(request.file.originalname)}`

      const { error: uploadError } = await supabase.storage
        .from(config.cvBucket)
        .upload(cvPath, request.file.buffer, {
          contentType: request.file.mimetype,
          upsert: false,
        })
      if (uploadError) throw uploadError

      const { error: createError } = await supabase.rpc('crear_solicitud', {
        p_solicitud_id: requestId,
        p_nombre: candidateName,
        p_cargo: jobTitle,
        p_familia_cargo: jobFamily,
        p_cv_path: cvPath,
        p_cv_mime: request.file.mimetype,
        p_cv_size: request.file.size,
      })
      if (createError) throw createError

      response.status(201).json({ id: requestId })
    } catch (error) {
      if (cvPath) await removeUploadedCv(cvPath)
      next(error)
    }
  },
)

router.use('/auth', authRouter)

// Desde aquí, todo requiere sesión y un perfil autorizado.
router.use(requireAuth)

router.get('/solicitudes', async (_request, response, next) => {
  try {
    const { data, error } = await supabase
      .from('solicitudes')
      .select('id,candidato_id,cargo,familia_cargo,estado,created_at,responsable:profiles(nombre)')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) throw error

    response.json(data.map((solicitud) => ({
      id: solicitud.id,
      candidateId: solicitud.candidato_id,
      jobTitle: solicitud.cargo,
      jobFamily: solicitud.familia_cargo,
      owner: solicitud.responsable?.nombre ?? null,
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
      .limit(500)

    if (error) throw error
    response.json(data.map(({ id, nombre }) => ({ id, name: nombre })))
  } catch (error) {
    next(error)
  }
})

router.get('/solicitudes/:id/cv', async (request, response, next) => {
  try {
    assertUuid(request.params.id)

    const { data: documento, error: documentError } = await supabase
      .from('documentos')
      .select('bucket,storage_path')
      .eq('solicitud_id', request.params.id)
      .eq('tipo', 'cv')
      .maybeSingle()

    if (documentError) throw documentError
    if (!documento) {
      throw new HttpError(404, 'No se encontró el CV de esta solicitud.')
    }

    const { data, error } = await supabase.storage
      .from(documento.bucket)
      .createSignedUrl(documento.storage_path, SIGNED_URL_SECONDS)

    if (error) throw error
    response.json({ signedUrl: data.signedUrl })
  } catch (error) {
    next(error)
  }
})

router.get('/plantillas', async (_request, response, next) => {
  try {
    const { data, error } = await supabase
      .from('plantillas')
      .select('id,nombre,version')
      .eq('activa', true)
      .order('nombre', { ascending: true })

    if (error) throw error
    response.json(data.map(({ id, nombre, version }) => ({ id, name: nombre, version })))
  } catch (error) {
    next(error)
  }
})

router.get('/plantillas/:id/descarga', async (request, response, next) => {
  try {
    assertUuid(request.params.id)

    const { data: plantilla, error: templateError } = await supabase
      .from('plantillas')
      .select('storage_path')
      .eq('id', request.params.id)
      .eq('activa', true)
      .maybeSingle()

    if (templateError) throw templateError
    if (!plantilla) {
      throw new HttpError(404, 'No se encontró la plantilla.')
    }

    const { data, error } = await supabase.storage
      .from(config.templatesBucket)
      .createSignedUrl(plantilla.storage_path, SIGNED_URL_SECONDS, { download: true })

    if (error) throw error
    response.json({ signedUrl: data.signedUrl })
  } catch (error) {
    next(error)
  }
})

export { router }
