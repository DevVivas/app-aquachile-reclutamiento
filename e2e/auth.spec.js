import { expect, test } from '@playwright/test'
import { ADMIN, login } from './helpers.js'

test('el panel exige iniciar sesión', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Acceso al panel' })).toBeVisible()
})

test('credenciales incorrectas muestran un error genérico', async ({ page }) => {
  await login(page, { email: ADMIN.email, password: 'incorrecta-123' })
  await expect(page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos.')
})

test('registro: el servidor valida la contraseña', async ({ page }) => {
  await page.goto('/registro')
  await page.getByLabel('Nombre completo').fill('Persona Prueba')
  await page.getByLabel('Correo corporativo').fill('nadie@aquachile.test')
  await page.getByLabel('Contraseña').fill('solo-letras')
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByText('Usa letras y números.')).toBeVisible()
})

test('una cuenta pendiente ve la pantalla de aprobación', async ({ page }) => {
  await login(page, { email: 'e2e.pendiente@aquachile.test', password: `${ADMIN.password}-p1` })
  await expect(page.getByRole('heading', { name: 'Cuenta pendiente de aprobación' })).toBeVisible()
  await page.getByRole('button', { name: 'Salir' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

test('el admin gestiona el equipo y cierra sesión', async ({ page }) => {
  await login(page)
  await page.getByRole('link', { name: 'Equipo' }).click()
  await expect(page.getByRole('heading', { name: 'Equipo de selección' })).toBeVisible()
  await expect(page.getByTestId('team-row').filter({ hasText: 'e2e.pendiente@aquachile.test' })).toContainText('Aprobar')
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/login$/)
})
