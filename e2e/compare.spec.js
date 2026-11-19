import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { apply, cleanup, CV, login, uniqueName } from './helpers.js'

test.use({ reducedMotion: 'reduce' })

const tag = uniqueName('E2E Comparar')
const leader = `${tag} Líder`
const operator = `${tag} Operaria`
test.afterAll(() => cleanup([leader, operator]))

test('comparar dos postulantes al mismo cargo de jefatura', async ({ page }) => {
  await apply(page, { name: leader, title: 'Jefe de Planta', cv: CV.leader })
  await apply(page, { name: operator, title: 'Jefe de Planta', cv: CV.operator })
  await login(page)
  await page.getByPlaceholder('Buscar por nombre, cargo o correo…').fill(tag)
  await expect(page.getByTestId('application-row')).toHaveCount(2)
  for (const row of await page.getByTestId('application-row').all()) await expect(row.getByTestId('ai-score')).toBeVisible({ timeout: 60_000 })

  await page.getByRole('checkbox', { name: 'Seleccionar todas las postulaciones visibles' }).check()
  await page.getByRole('link', { name: 'Comparar', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard\/comparar\?ids=/)

  const table = page.getByRole('table', { name: 'Comparación de postulantes' })
  await expect(table).toContainText(leader)
  await expect(table).toContainText(operator)
  await expect(page.getByRole('note')).toHaveCount(0) // mismo cargo: sin advertencia

  // "Mejor afinidad" va en la columna del líder.
  const scoreRow = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Puntaje IA' }) })
  const cells = scoreRow.getByRole('cell')
  const names = await page.getByRole('row').first().getByRole('cell').allInnerTexts()
  const leaderIndex = names.findIndex((text) => text.includes(leader))
  await expect(cells.nth(leaderIndex)).toContainText('Mejor afinidad')
  await expect(cells.nth(1 - leaderIndex)).not.toContainText('Mejor afinidad')

  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])

  await page.getByRole('link', { name: leader }).click()
  await expect(page.getByTestId('candidate-name')).toHaveText(leader)
})
