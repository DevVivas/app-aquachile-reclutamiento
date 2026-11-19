import { createClient } from '@supabase/supabase-js'
import { expect } from '@playwright/test'

export const CV = { leader: 'tests/fixtures/cv-jefe.pdf', operator: 'tests/fixtures/cv-operaria.pdf' }
export const ADMIN = { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD }
export const uniqueName = (base) => `${base} ${Date.now().toString(36).slice(-5)}`

export async function fillApplication(page, { name, email = '', family = 'Operaciones y Logística', title, cv = CV.leader }) {
  await page.goto('/')
  await page.getByLabel('Nombre completo').fill(name)
  if (email) await page.getByLabel(/Correo/).fill(email)
  await page.getByLabel('Familia de cargo').selectOption(family)
  await page.getByLabel('Cargo al que postulas').fill(title)
  await page.getByLabel('Curriculum Vitae (PDF o Word)').setInputFiles(cv)
}

export async function apply(page, data) {
  await fillApplication(page, data)
  await page.getByRole('button', { name: 'Enviar postulación' }).click()
  await expect(page.getByRole('heading', { name: '¡Postulación recibida!' })).toBeVisible()
}

export async function login(page, { email, password } = ADMIN) {
  await page.goto('/login')
  await page.getByLabel('Correo').fill(email)
  await page.getByLabel('Contraseña').fill(password)
  await page.getByRole('button', { name: 'Ingresar' }).click()
}

/** Borra las postulaciones creadas por la prueba (por nombre) usando la cuenta admin. */
export async function cleanup(names) {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  await supabase.auth.signInWithPassword(ADMIN)
  const { data } = await supabase.from('applications').select('id, cv_path').in('candidate_name', names)
  for (const row of data ?? []) {
    await supabase.from('applications').delete().eq('id', row.id)
    await supabase.storage.from('cvs').remove([row.cv_path])
  }
}
