import { expect, test } from '@playwright/test'
import { apply, cleanup, fillApplication, uniqueName } from './helpers.js'

const names = []
test.afterAll(() => cleanup(names))

test('un postulante envía su CV y recibe confirmación', async ({ page }) => {
  const name = uniqueName('E2E Postulante Form')
  names.push(name)
  await apply(page, { name, email: 'e2e@example.com', title: 'Analista de Logística' })
  await expect(page.getByText('Analista de Logística')).toBeVisible()
  await page.getByRole('button', { name: 'Enviar otra postulación' }).click()
  await expect(page.getByLabel('Nombre completo')).toHaveValue('')
})

test('valida el tipo de archivo antes de enviar', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Curriculum Vitae (PDF o Word)').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from('png') })
  await expect(page.getByText('El CV debe ser PDF o Word (.doc, .docx).')).toBeVisible()
})

test('el formulario cabe en pantalla y es accesible por etiquetas', async ({ page }) => {
  await fillApplication(page, { name: 'Sin enviar', title: 'Cargo' })
  await expect(page.getByRole('button', { name: 'Enviar postulación' })).toBeInViewport()
  await expect(page.getByRole('link', { name: 'Ingresa al panel' })).toBeVisible()
})
