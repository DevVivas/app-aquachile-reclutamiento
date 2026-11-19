import { expect, test } from '@playwright/test'
import { apply, cleanup, CV, login, uniqueName } from './helpers.js'

const name = uniqueName('E2E Movil')
test.afterAll(() => cleanup([name]))

const noHorizontalScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)

test.skip(({ isMobile }) => !isMobile, 'solo en el proyecto móvil')

test('panel y detalle usables en el teléfono', async ({ page }) => {
  await apply(page, { name, title: 'Jefe de Turno', cv: CV.leader })
  await login(page)
  await expect(page.getByTestId('application-row').first()).toBeVisible()
  expect(await noHorizontalScroll(page)).toBe(true)

  await page.getByPlaceholder('Buscar por nombre, cargo o correo…').fill(name)
  await page.getByRole('link', { name }).click()
  await expect(page.getByTestId('candidate-name')).toHaveText(name)
  expect(await noHorizontalScroll(page)).toBe(true)

  // El CV parte plegado: primero se ven los datos y el análisis IA.
  await expect(page.getByRole('heading', { name: 'Datos de la postulación' })).toBeInViewport()
  const toggle = page.getByRole('button', { name: 'Ver CV' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByTestId('cv-frame')).toBeHidden()
  await toggle.click()
  await expect(page.getByRole('button', { name: 'Ocultar' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByTestId('cv-frame')).toBeVisible()
})
