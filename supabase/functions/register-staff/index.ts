// POST { fullName, email, password, role } — alta de un miembro del equipo.
// La cuenta queda confirmada pero SIN acceso hasta que un admin la apruebe (profiles.approved).
// Así el registro no depende del correo de Supabase (limitado en el plan gratis).
import { adminClient, corsHeaders, json } from '../_shared/http.ts'

const ROLES = ['reclutador', 'rrhh', 'psicologo']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Método no permitido' }, 405)

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') return json(req, { error: 'JSON inválido' }, 400)
  if (typeof body.website === 'string' && body.website.trim()) return json(req, { ok: true }, 201)

  const fullName = String(body.fullName ?? '').normalize('NFC').replace(/\s+/g, ' ').trim()
  const email = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const role = ROLES.includes(body.role) ? body.role : 'reclutador'

  const fields: Record<string, string> = {}
  if (fullName.length < 3 || fullName.length > 120) fields.fullName = 'Ingresa tu nombre completo.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) fields.email = 'Correo no válido.'
  if (password.length < 8 || password.length > 128) fields.password = 'La contraseña debe tener al menos 8 caracteres.'
  else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) fields.password = 'Usa letras y números.'
  if (Object.keys(fields).length) return json(req, { error: 'Datos inválidos', fields }, 422)

  const { error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (error) {
    const duplicated = /already|registered|exists/i.test(error.message)
    return json(req, { error: duplicated ? 'Ese correo ya tiene una cuenta.' : 'No se pudo crear la cuenta.' }, duplicated ? 409 : 500)
  }
  return json(req, { ok: true }, 201)
})
