// POST público (multipart) del formulario de postulación.
// Sube el CV a cvs/<nombre-postulante>/..., crea la postulación y lanza el análisis IA en segundo plano.
import { analyzeApplication } from '../_shared/analyze.ts'
import { adminClient, corsHeaders, json } from '../_shared/http.ts'
import { buildCvPath, CV_TYPES, detectCvType, MAX_CV_BYTES, validateApplication } from '../_shared/validation.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Método no permitido' }, 405)

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return json(req, { error: 'Se esperaba multipart/form-data' }, 400)
  }

  // Honeypot anti-bots: el campo "website" está oculto para humanos.
  if (String(form.get('website') ?? '').trim()) return json(req, { id: crypto.randomUUID() }, 201)

  const validation = validateApplication(Object.fromEntries(form.entries()))
  if (!validation.ok) return json(req, { error: 'Datos inválidos', fields: validation.errors }, 422)

  const cv = form.get('cv')
  if (!(cv instanceof File) || cv.size === 0) return json(req, { error: 'Adjunta el CV', fields: { cv: 'Adjunta el CV.' } }, 422)
  if (cv.size > MAX_CV_BYTES) return json(req, { error: 'El CV supera 10 MB', fields: { cv: 'Máximo 10 MB.' } }, 413)

  const bytes = new Uint8Array(await cv.arrayBuffer())
  const type = detectCvType(bytes)
  if (!type) return json(req, { error: 'Formato no permitido', fields: { cv: 'Solo PDF o Word.' } }, 415)

  const { candidateName, candidateEmail, candidatePhone, jobFamily, jobTitle } = validation.data
  const { folder, path } = buildCvPath(candidateName, jobTitle, type)
  const admin = adminClient()

  const { error: uploadError } = await admin.storage.from('cvs').upload(path, bytes, {
    contentType: CV_TYPES[type],
    upsert: false,
  })
  if (uploadError) {
    console.error('upload', uploadError)
    return json(req, { error: 'No se pudo guardar el CV' }, 500)
  }

  const { data, error } = await admin
    .from('applications')
    .insert({
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      candidate_phone: candidatePhone,
      job_family: jobFamily,
      job_title: jobTitle,
      cv_folder: folder,
      cv_path: path,
      cv_file_name: cv.name.slice(0, 200) || `cv.${type}`,
      cv_mime: CV_TYPES[type],
      cv_size: cv.size,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('insert', error)
    await admin.storage.from('cvs').remove([path])
    return json(req, { error: 'No se pudo registrar la postulación' }, 500)
  }

  // El postulante no espera al análisis: corre después de responder.
  const job = analyzeApplication(admin, data.id).catch((err) => console.error('analyze', data.id, err?.message))
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime
  if (runtime?.waitUntil) runtime.waitUntil(job)
  else await job

  return json(req, { id: data.id, folder }, 201)
})
