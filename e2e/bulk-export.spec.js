import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { apply, cleanup, CV, login, uniqueName } from './helpers.js'

const tag = uniqueName('E2E Lote')
const names = [`${tag} Uno`, `${tag} Dos`]
test.afterAll(() => cleanup(names))

test('asignación masiva y exportación CSV de las filtradas', async ({ page }) => {
  for (const name of names) await apply(page, { name, title: 'Operario de planta', cv: CV.operator })
  await login(page)
  await page.getByPlaceholder('Buscar por nombre, cargo o correo…').fill(tag)
  await expect(page.getByTestId('application-row')).toHaveCount(2)

  await page.getByRole('checkbox', { name: 'Seleccionar todas las postulaciones visibles' }).check()
  const bar = page.getByRole('region', { name: 'Acciones masivas' })
  await expect(bar).toContainText('2 seleccionadas')

  await bar.getByLabel('Asignar responsable a las seleccionadas').selectOption({ label: 'Felipe Torres · RR.HH.' })
  await expect(bar.getByRole('status')).toHaveText('2 actualizadas')
  await bar.getByLabel('Mover las seleccionadas a una etapa').selectOption('revision_cv')
  await expect(bar.getByRole('status')).toHaveText('2 actualizadas')

  // Persistió: tras recargar, ambas siguen asignadas y en Revisión de CV.
  await page.reload()
  await page.getByPlaceholder('Buscar por nombre, cargo o correo…').fill(tag)
  for (const name of names) {
    const row = page.getByTestId('application-row').filter({ hasText: name })
    await expect(row).toContainText('Revisión de CV')
    await expect(row.getByRole('combobox', { name: `Responsable de ${name}` })).toHaveValue(/.+/)
  }

  // Exportar descarga solo las filtradas.
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Exportar CSV' }).click()])
  expect(download.suggestedFilename()).toMatch(/^postulaciones-\d{4}-\d{2}-\d{2}\.csv$/)
  const csv = readFileSync(await download.path(), 'utf8')
  const lines = csv.replace(/^\uFEFF/, '').trim().split(/\r\n/)
  expect(lines).toHaveLength(3)
  expect(lines[1]).toContain('Revisión de CV')
  expect(lines[1]).toContain('Felipe Torres')
})
