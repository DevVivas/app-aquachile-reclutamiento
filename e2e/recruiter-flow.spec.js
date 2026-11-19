import { expect, test } from '@playwright/test'
import { apply, CV, cleanup, login, uniqueName } from './helpers.js'

const leader = uniqueName('E2E Líder Rojas')
const operator = uniqueName('E2E Operaria Soto')
test.afterAll(() => cleanup([leader, operator]))

test('postulación → dashboard → asignar → CV + IA → etapas → notas', async ({ page }) => {
  // 1. Dos personas postulan al mismo cargo de jefatura.
  await apply(page, { name: leader, email: 'lider@example.com', title: 'Jefe de Centro de Cultivo', cv: CV.leader })
  await apply(page, { name: operator, title: 'Jefe de Centro de Cultivo', cv: CV.operator })

  // 2. El reclutador entra al panel.
  await login(page)
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByTestId('current-user')).toHaveText('Admin Pruebas E2E')

  // 3. Ambas aparecen y la IA las puntúa (llega en tiempo real).
  await page.getByPlaceholder('Buscar por nombre, cargo o correo…').fill('E2E ')
  const leaderRow = page.getByTestId('application-row').filter({ hasText: leader })
  const operatorRow = page.getByTestId('application-row').filter({ hasText: operator })
  await expect(leaderRow.getByTestId('ai-score')).toBeVisible({ timeout: 60_000 })
  await expect(operatorRow.getByTestId('ai-score')).toBeVisible({ timeout: 60_000 })
  const leaderScore = Number(await leaderRow.getByTestId('ai-score').locator('.tabular-nums').innerText())
  const operatorScore = Number(await operatorRow.getByTestId('ai-score').locator('.tabular-nums').innerText())
  expect(leaderScore).toBeGreaterThan(operatorScore)

  // 4. Ordenar por afinidad pone primero al líder.
  await page.getByLabel('Ordenar').selectOption('score')
  await expect(page.getByTestId('application-row').filter({ hasText: /E2E (Líder|Operaria)/ }).first()).toContainText(leader)

  // 5. Asignar evaluadora desde la tabla, sin abrir el detalle.
  const assign = page.getByRole('combobox', { name: `Responsable de ${leader}` })
  await assign.selectOption({ label: 'Daniela Pérez · Psicólogo/a laboral' })
  await expect(assign).toHaveValue(/.+/)
  await expect(page).toHaveURL(/\/dashboard$/)

  // 6. Abrir el detalle: datos del formulario, CV y análisis IA.
  await page.getByRole('link', { name: leader }).click()
  await expect(page.getByTestId('candidate-name')).toHaveText(leader)
  await expect(page.getByText('lider@example.com')).toBeVisible()
  await expect(page.getByText(/Carpeta: cvs\/e2e-lider-rojas/)).toBeVisible()
  await expect(page.getByTestId('cv-frame')).toBeVisible()
  await expect(page.getByTestId('ai-summary')).not.toBeEmpty()
  await expect(page.getByText('Evidencia de liderazgo en el CV')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Responsable' })).toHaveValue(/.+/)

  // 7. Pasar a la siguiente etapa y dejar una nota.
  await page.getByRole('button', { name: 'Pasar a Revisión de CV' }).click()
  await expect(page.getByRole('button', { name: 'Pasar a Entrevista' })).toBeVisible()
  await page.getByLabel('Nueva nota').fill('Perfil sólido de jefatura. Coordinar entrevista.')
  await page.getByRole('button', { name: 'Guardar nota' }).click()
  await expect(page.getByTestId('notes-list')).toContainText('Perfil sólido de jefatura')

  // 8. Historial auditado.
  const history = page.getByRole('region', { name: 'Historial' })
  await expect(history).toContainText('Movió de Recibido a Revisión de CV')
  await expect(history).toContainText('Asignó a Daniela Pérez')
  await expect(history).toContainText('Análisis IA completado')

  // 9. Descartar a la otra postulante desde su detalle.
  await page.goto('/dashboard')
  await page.getByPlaceholder('Buscar por nombre, cargo o correo…').fill(operator)
  await page.getByRole('link', { name: operator }).click()
  await page.getByRole('button', { name: 'Descartar' }).click()
  await expect(page.getByLabel('Etapa')).toHaveValue('descartado')
})

test('vista pipeline: arrastrar una tarjeta cambia la etapa', async ({ page }) => {
  const name = uniqueName('E2E Kanban')
  await apply(page, { name, title: 'Operario de planta', cv: CV.operator })
  await login(page)
  await page.getByPlaceholder('Buscar por nombre, cargo o correo…').fill(name)
  await page.getByRole('button', { name: 'Vista pipeline' }).click()
  const card = page.getByRole('listitem').filter({ hasText: name })
  await card.dragTo(page.getByRole('region', { name: 'Entrevista' }))
  await expect(page.getByRole('region', { name: 'Entrevista' })).toContainText(name)
  await page.reload()
  await page.getByPlaceholder('Buscar por nombre, cargo o correo…').fill(name)
  await expect(page.getByTestId('application-row').filter({ hasText: name })).toContainText('Entrevista')
  // Alternativa por teclado: el selector de la tarjeta.
  await page.getByRole('button', { name: 'Vista pipeline' }).click()
  const move = page.getByRole('combobox', { name: `Mover a ${name} a otra etapa` })
  await move.focus()
  await move.selectOption('oferta')
  await expect(page.getByRole('region', { name: 'Oferta' })).toContainText(name)
  await cleanup([name])
})
