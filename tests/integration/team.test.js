import { beforeAll, describe, expect, it } from 'vitest'
import { env, fn, signedIn } from './helpers.js'

// Cuenta fija "pendiente": se registra una vez y nunca se aprueba.
const PENDING_EMAIL = 'e2e.pendiente@aquachile.test'
const pendingPassword = () => `${env('E2E_ADMIN_PASSWORD')}-p1`

let pending
let admin

beforeAll(async () => {
  const response = await fetch(fn('register-staff'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName: 'Pendiente de Prueba', email: PENDING_EMAIL, password: pendingPassword(), role: 'admin' }),
  })
  expect([201, 409]).toContain(response.status)
  pending = await signedIn(PENDING_EMAIL, pendingPassword())
  admin = await signedIn(env('E2E_ADMIN_EMAIL'), env('E2E_ADMIN_PASSWORD'))
})

describe('registro del equipo', () => {
  it('valida datos (contraseña débil, correo inválido)', async () => {
    const response = await fetch(fn('register-staff'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'X', email: 'no-mail', password: '123' }),
    })
    expect(response.status).toBe(422)
    const body = await response.json()
    expect(Object.keys(body.fields).sort()).toEqual(['email', 'fullName', 'password'])
  })

  it('una cuenta nueva no puede auto-asignarse admin y queda pendiente', async () => {
    const { data: me } = await pending.auth.getUser()
    const { data: profile } = await pending.from('profiles').select('*').eq('id', me.user.id).single()
    expect(profile.role).not.toBe('admin')
    expect(profile.approved).toBe(false)
  })
})

describe('una cuenta pendiente', () => {
  it('no ve postulaciones ni al resto del equipo', async () => {
    const { data: apps } = await pending.from('applications').select('id')
    expect(apps).toEqual([])
    const { data: team } = await pending.from('profiles').select('id')
    expect(team).toHaveLength(1) // solo su propio perfil
  })

  it('no puede aprobarse a sí misma ni cambiar su rol', async () => {
    const { data: me } = await pending.auth.getUser()
    const { error } = await pending.rpc('admin_update_profile', { p_id: me.user.id, p_role: 'admin', p_approved: true })
    expect(error).not.toBeNull()
    const { error: directError } = await pending.from('profiles').update({ approved: true, role: 'admin' }).eq('id', me.user.id)
    expect(directError).not.toBeNull()
  })

  it('no puede re-analizar CVs (403)', async () => {
    const { data: session } = await pending.auth.getSession()
    const response = await fetch(fn('analyze-application'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: crypto.randomUUID() }),
    })
    expect(response.status).toBe(403)
  })
})

describe('administración del equipo', () => {
  it('el admin ve al equipo completo incluyendo pendientes', async () => {
    const { data } = await admin.from('profiles').select('email, approved')
    expect(data.some((p) => p.email === PENDING_EMAIL && p.approved === false)).toBe(true)
  })

  it('el admin puede cambiar el rol sin aprobar', async () => {
    const { data: row } = await admin.from('profiles').select('id').eq('email', PENDING_EMAIL).single()
    const { data, error } = await admin.rpc('admin_update_profile', { p_id: row.id, p_role: 'psicologo', p_approved: false })
    expect(error).toBeNull()
    expect(data).toMatchObject({ role: 'psicologo', approved: false })
  })

  it('el admin no puede quitarse su propio acceso', async () => {
    const { data: me } = await admin.auth.getUser()
    const { error } = await admin.rpc('admin_update_profile', { p_id: me.user.id, p_role: 'reclutador', p_approved: true })
    expect(error?.message).toMatch(/propio acceso/)
  })
})
