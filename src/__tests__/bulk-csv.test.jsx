import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import BulkBar from '@/pages/dashboard/components/BulkBar.jsx'
import RequestsTable from '@/pages/dashboard/components/RequestsTable.jsx'
import { applicationsToCsv, csvCell } from '@/utils/csv.js'

const team = [{ id: 'u1', full_name: 'Daniela Pérez', role: 'psicologo', approved: true }]
const apps = [
  { id: 'a1', candidate_name: 'Carlos Rojas', candidate_email: 'c@x.cl', job_title: 'Jefe; de "Centro"', job_family: 'Operaciones y Logística', stage: 'entrevista', assigned_to: 'u1', ai_status: 'done', ai_score: 92, ai_fit: 'alto', created_at: '2026-11-18T10:00:00Z' },
  { id: 'a2', candidate_name: '=HYPERLINK("http://x")', job_title: 'Operaria', job_family: 'Operaciones y Logística', stage: 'recibido', assigned_to: null, ai_status: 'pending', ai_score: null, ai_fit: null, created_at: '2026-11-19T10:00:00Z' },
]

describe('CSV', () => {
  it('escapa separadores, comillas y saltos', () => {
    expect(csvCell('simple')).toBe('simple')
    expect(csvCell('a;b')).toBe('"a;b"')
    expect(csvCell('di "hola"')).toBe('"di ""hola"""')
    expect(csvCell(null)).toBe('')
  })

  it('neutraliza fórmulas (inyección CSV)', () => {
    expect(csvCell('=1+1')).toBe("'=1+1")
    expect(csvCell('+56 9 1234')).toBe("'+56 9 1234")
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)")
  })

  it('genera encabezados en español, BOM y etiquetas legibles', () => {
    const csv = applicationsToCsv(apps, team)
    expect(csv.startsWith('\uFEFF')).toBe(true)
    const [header, first, second] = csv.slice(1).split('\r\n')
    expect(header).toBe('Postulante;Correo;Cargo;Familia de cargo;Etapa;Puntaje IA;Afinidad IA;Responsable;Recibido')
    expect(first).toBe('Carlos Rojas;c@x.cl;"Jefe; de ""Centro""";Operaciones y Logística;Entrevista;92;alto;Daniela Pérez;2026-11-18')
    expect(second.startsWith(`"'=HYPERLINK(""http://x"")"`)).toBe(true)
  })
})

describe('selección en la tabla', () => {
  it('marca filas sin abrir el detalle y "seleccionar todas" alterna', async () => {
    const onToggle = vi.fn()
    const onToggleAll = vi.fn()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <RequestsTable applications={apps} team={team} onAssign={vi.fn()} selected={new Set(['a1'])} onToggle={onToggle} onToggleAll={onToggleAll} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('checkbox', { name: 'Seleccionar a Carlos Rojas' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Seleccionar todas las postulaciones visibles' })).toHaveProperty('indeterminate', true)
    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar a =HYPERLINK("http://x")' }))
    expect(onToggle).toHaveBeenCalledWith('a2')
    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar todas las postulaciones visibles' }))
    expect(onToggleAll).toHaveBeenCalledWith(['a1', 'a2'])
  })
})

describe('BulkBar', () => {
  it('asigna y mueve las seleccionadas e informa el resultado', async () => {
    const onAssign = vi.fn().mockResolvedValue({ ok: 2, failed: 0 })
    const onMove = vi.fn().mockResolvedValue({ ok: 1, failed: 1 })
    const user = userEvent.setup()
    render(<MemoryRouter><BulkBar count={2} ids={['a1', 'a2']} team={team} onAssign={onAssign} onMove={onMove} onClear={vi.fn()} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Comparar' })).toHaveAttribute('href', '/dashboard/comparar?ids=a1,a2')
    expect(screen.getByText('2 seleccionadas')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Asignar responsable a las seleccionadas'), 'u1')
    expect(onAssign).toHaveBeenCalledWith('u1')
    expect(await screen.findByText('2 actualizadas')).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Mover las seleccionadas a una etapa'), 'entrevista')
    expect(onMove).toHaveBeenCalledWith('entrevista')
    expect(await screen.findByText('1 actualizadas, 1 con error')).toBeInTheDocument()
  })

  it('"Quitar responsable" envía null', async () => {
    const onAssign = vi.fn().mockResolvedValue({ ok: 1, failed: 0 })
    render(<MemoryRouter><BulkBar count={1} ids={['a1']} team={team} onAssign={onAssign} onMove={vi.fn()} onClear={vi.fn()} /></MemoryRouter>)
    expect(screen.queryByRole('link', { name: 'Comparar' })).not.toBeInTheDocument()
    await userEvent.setup().selectOptions(screen.getByLabelText('Asignar responsable a las seleccionadas'), 'none')
    expect(onAssign).toHaveBeenCalledWith(null)
  })
})
