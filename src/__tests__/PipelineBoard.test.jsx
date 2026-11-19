import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import PipelineBoard from '@/pages/dashboard/components/PipelineBoard.jsx'

const apps = [
  { id: 'a1', candidate_name: 'Carlos Rojas', job_title: 'Jefe', stage: 'recibido', assigned_to: 'u1', ai_status: 'done', ai_score: 90, ai_fit: 'alto', created_at: new Date().toISOString() },
  { id: 'a2', candidate_name: 'María Soto', job_title: 'Operaria', stage: 'entrevista', assigned_to: null, ai_status: 'pending', created_at: new Date().toISOString() },
]
const team = [{ id: 'u1', full_name: 'Daniela Pérez', approved: true }]

const renderBoard = (onMove = vi.fn().mockResolvedValue()) => {
  render(
    <MemoryRouter>
      <PipelineBoard applications={apps} team={team} onMove={onMove} />
    </MemoryRouter>,
  )
  return onMove
}

describe('PipelineBoard', () => {
  it('agrupa las tarjetas por etapa con su conteo', () => {
    renderBoard()
    expect(within(screen.getByRole('region', { name: 'Recibido' })).getByText('Carlos Rojas')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Entrevista' })).getByText('María Soto')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Recibido' })).getByText('Daniela · recién')).toBeInTheDocument()
  })

  it('permite mover de etapa con teclado (sin arrastrar)', async () => {
    const onMove = renderBoard()
    const user = userEvent.setup()
    const select = screen.getByRole('combobox', { name: 'Mover a Carlos Rojas a otra etapa' })
    expect(select).toHaveValue('recibido')
    select.focus()
    await user.selectOptions(select, 'evaluacion_psicolaboral')
    expect(onMove).toHaveBeenCalledWith('a1', 'evaluacion_psicolaboral')
  })

  it('no rompe si el guardado falla', async () => {
    const onMove = renderBoard(vi.fn().mockImplementation(async () => { throw new Error('x') }))
    await userEvent.setup().selectOptions(screen.getByRole('combobox', { name: 'Mover a María Soto a otra etapa' }), 'oferta')
    expect(onMove).toHaveBeenCalled()
  })
})
