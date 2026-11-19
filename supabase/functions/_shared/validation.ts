// Validación y nombres de archivo de la postulación. Módulo puro (Deno + Vitest).
import { JOB_FAMILIES } from './scoring.ts'

export const MAX_CV_BYTES = 10 * 1024 * 1024

export const CV_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const

export type CvExtension = keyof typeof CV_TYPES

/** "José Pérez Muñoz" → "jose-perez-munoz" (carpeta del postulante en Storage). */
export function slugify(value: string, maxLength = 60): string {
  const slug = (value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '')
  return slug || 'sin-nombre'
}

/** Detecta el tipo real por la firma del archivo, no por la extensión que manda el navegador. */
export function detectCvType(bytes: Uint8Array): CvExtension | null {
  if (bytes.length < 4) return null
  const [a, b, c, d] = bytes
  if (a === 0x25 && b === 0x50 && c === 0x44 && d === 0x46) return 'pdf' // %PDF
  if (a === 0xd0 && b === 0xcf && c === 0x11 && d === 0xe0) return 'doc' // OLE2
  if (a === 0x50 && b === 0x4b && c === 0x03 && d === 0x04) return 'docx' // ZIP
  return null
}

/** cvs/<nombre-postulante>/<AAAA-MM-DD_HHMMSS>_<cargo>_<rand>.<ext> */
export function buildCvPath(candidateName: string, jobTitle: string, ext: CvExtension, now = new Date(), rand = randomSuffix()) {
  const folder = slugify(candidateName)
  const stamp = now.toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '')
  return { folder, path: `${folder}/${stamp}_${slugify(jobTitle, 40)}_${rand}.${ext}` }
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8).padEnd(6, '0')
}

export interface ApplicationInput {
  candidateName: string
  candidateEmail: string | null
  candidatePhone: string | null
  jobFamily: string
  jobTitle: string
}

const clean = (value: unknown) => (typeof value === 'string' ? value.normalize('NFC').replace(/\s+/g, ' ').trim() : '')

export function validateApplication(raw: Record<string, unknown>): { ok: true; data: ApplicationInput } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const candidateName = clean(raw.candidateName)
  const jobFamily = clean(raw.jobFamily)
  const jobTitle = clean(raw.jobTitle)
  const candidateEmail = clean(raw.candidateEmail).toLowerCase() || null
  const candidatePhone = clean(raw.candidatePhone) || null

  if (candidateName.length < 2 || candidateName.length > 120) errors.candidateName = 'Ingresa el nombre completo (2 a 120 caracteres).'
  else if (!/\p{L}/u.test(candidateName)) errors.candidateName = 'El nombre debe contener letras.'
  if (!(JOB_FAMILIES as readonly string[]).includes(jobFamily)) errors.jobFamily = 'Selecciona una familia de cargo válida.'
  if (jobTitle.length < 2 || jobTitle.length > 120) errors.jobTitle = 'Ingresa el cargo (2 a 120 caracteres).'
  if (candidateEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(candidateEmail)) errors.candidateEmail = 'Correo no válido.'
  if (candidatePhone && !/^\+?[\d\s()-]{8,20}$/.test(candidatePhone)) errors.candidatePhone = 'Teléfono no válido.'

  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, data: { candidateName, candidateEmail, candidatePhone, jobFamily, jobTitle } }
}
