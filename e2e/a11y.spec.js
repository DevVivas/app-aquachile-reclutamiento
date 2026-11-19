import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { apply, cleanup, CV, login, uniqueName } from './helpers.js'

// WCAG 2.1 AA en las pantallas principales.
const audit = (page) => new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()

const summarize = (violations) =>
  violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)

// Con movimiento reducido no hay fundidos de entrada que axe mida a medias.
test.use({ reducedMotion: 'reduce' })

const name = uniqueName('E2E Accesible')
test.afterAll(() => cleanup([name]))

test('formulario público', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Postula a AquaChile' })).toBeVisible()
  const { violations } = await audit(page)
  expect(summarize(violations)).toEqual([])
})

test('login y registro', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: 'Acceso al panel' })).toBeVisible()
  expect(summarize((await audit(page)).violations)).toEqual([])
  await page.goto('/registro')
  await expect(page.getByRole('heading', { name: 'Solicitar acceso' })).toBeVisible()
  expect(summarize((await audit(page)).violations)).toEqual([])
})

test('panel, pipeline y detalle', async ({ page }) => {
  await apply(page, { name, title: 'Jefe de Planta', cv: CV.leader })
  await login(page)
  await expect(page.getByTestId('application-row').first()).toBeVisible()
  expect(summarize((await audit(page)).violations)).toEqual([])

  await page.getByRole('button', { name: 'Vista pipeline' }).click()
  await expect(page.getByRole('region', { name: 'Recibido' })).toBeVisible()
  expect(summarize((await audit(page)).violations)).toEqual([])

  await page.getByRole('button', { name: 'Vista tabla' }).click()
  await page.getByPlaceholder('Buscar por nombre, cargo o correo…').fill(name)
  await page.getByRole('link', { name }).click()
  await expect(page.getByTestId('ai-summary')).toBeVisible({ timeout: 60_000 })
  // El visor PDF nativo del navegador queda fuera del alcance de axe.
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('[data-testid="cv-frame"]')
    .analyze()
  expect(summarize(violations)).toEqual([])
})
