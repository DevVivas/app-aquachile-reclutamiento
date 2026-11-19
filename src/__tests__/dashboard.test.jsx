import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { nextStage, STAGES } from '@/constants/pipeline.js'
import AiPanel from '@/pages/dashboard/components/AiPanel.jsx'
import AssigneeSelect from '@/pages/dashboard/components/AssigneeSelect.jsx'
import { ScoreBadge } from '@/pages/dashboard/components/Badges.jsx'
import RequestsTable from '@/pages/dashboard/components/RequestsTable.jsx'
import { ALL, computeStats, filterApplications } from '@/pages/dashboard/filterApplications.js'

const team = [
  { id: 'u1', full_name: 'Daniela Pérez', role: 'psicologo', approved: true },
  { id: 'u2', full_name: 'Andrés Silva', role: 'reclutador', approved: true },
  { id: 'u3', full_name: 'Pendiente Pérez', role: 'rrhh', approved: false },
]

const apps = [
  { id: 'a1', candidate_name: 'Carlos Rojas', candidate_email: 'c@x.cl', job_title: 'Jefe de Centro', job_family: 'Operaciones y Logística', stage: 'recibido', assigned_to: null, ai_status: 'done', ai_score: 92, ai_fit: 'alto', created_at: '2026-11-18T10:00:00Z' },
  { id: 'a2', candidate_name: 'María Soto', job_title: 'Operaria', job_family: 'Operaciones y Logística', stage: 'entrevista', assigned_to: 'u1', ai_status: 'done', ai_score: 40, ai_fit: 'bajo', created_at: '2026-11-18T12:00:00Z' },
  { id: 'a3', candidate_name: 'José Núñez', job_title: 'Analista contable', job_family: 'Administración y Finanzas', stage: 'descartado', assigned_to: 'u2', ai_status: 'processing', ai_score: null, ai_fit: null, created_at: '2026-11-17T12:00:00Z' },
]

const base = { stage: ALL, query: '', assignee: ALL, family: ALL, sort: 'recent' }

describe('filterApplications', () => {
  it('ordena por fecha o por puntaje IA', () => {
    expect(filterApplications(apps, base, 'u1').map((a) => a.id)).toEqual(['a2', 'a1', 'a3'])
    expect(filterApplications(apps, { ...base, sort: 'score' }, 'u1').map((a) => a.id)).toEqual(['a1', 'a2', 'a3'])
  })

  it('filtra por responsable: mías, sin asignar o persona', () => {
    expect(filterApplications(apps, { ...base, assignee: 'me' }, 'u1').map((a) => a.id)).toEqual(['a2'])
    expect(filterApplications(apps, { ...base, assignee: 'none' }, 'u1').map((a) => a.id)).toEqual(['a1'])
    expect(filterApplications(apps, { ...base, assignee: 'u2' }, 'u1').map((a) => a.id)).toEqual(['a3'])
  })

  it('busca sin importar tildes y filtra por etapa y familia', () => {
    expect(filterApplications(apps, { ...base, query: 'nunez' }, 'u1').map((a) => a.id)).toEqual(['a3'])
    expect(filterApplications(apps, { ...base, query: 'JEFE' }, 'u1').map((a) => a.id)).toEqual(['a1'])
    expect(filterApplications(apps, { ...base, stage: 'entrevista' }, 'u1').map((a) => a.id)).toEqual(['a2'])
    expect(filterApplications(apps, { ...base, family: 'Administración y Finanzas' }, 'u1')).toHaveLength(1)
  })

  it('KPIs ignoran postulaciones cerradas', () => {
    expect(computeStats(apps, 'u1')).toEqual({ total: 3, unassigned: 1, mine: 1, highFit: 1, inEvaluation: 0 })
  })
})

describe('pipeline', () => {
  it('avanza en orden y no avanza desde la última etapa activa', () => {
    expect(nextStage('recibido').value).toBe('revision_cv')
    expect(nextStage('oferta').value).toBe('contratado')
    expect(nextStage('contratado')).toBeNull()
    expect(nextStage('descartado')).toBeNull()
    expect(STAGES.at(-1).value).toBe('descartado')
  })
})

describe('AssigneeSelect', () => {
  it('solo ofrece miembros aprobados y notifica el cambio', async () => {
    const onChange = vi.fn().mockResolvedValue()
    const user = userEvent.setup()
    render(<AssigneeSelect value={null} team={team} onChange={onChange} />)
    const select = screen.getByRole('combobox', { name: 'Responsable' })
    expect(screen.queryByText(/Pendiente Pérez/)).not.toBeInTheDocument()
    await user.selectOptions(select, 'u1')
    expect(onChange).toHaveBeenCalledWith('u1')
  })

  it('se puede desasignar', async () => {
    const onChange = vi.fn().mockResolvedValue()
    const user = userEvent.setup()
    render(<AssigneeSelect value="u1" team={team} onChange={onChange} />)
    await user.selectOptions(screen.getByRole('combobox'), '')
    expect(onChange).toHaveBeenCalledWith(null)
  })
})

describe('RequestsTable', () => {
  it('muestra postulante, cargo, puntaje IA y permite asignar sin abrir el detalle', async () => {
    const onAssign = vi.fn().mockResolvedValue()
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <RequestsTable applications={apps} team={team} onAssign={onAssign} />
      </MemoryRouter>,
    )
    expect(screen.getAllByTestId('application-row')).toHaveLength(3)
    expect(screen.getByRole('link', { name: 'Carlos Rojas' })).toHaveAttribute('href', '/dashboard/postulaciones/a1')
    expect(screen.getByText('92')).toBeInTheDocument()
    expect(screen.getByLabelText('Análisis IA en curso')).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Responsable de Carlos Rojas' }), 'u2')
    expect(onAssign).toHaveBeenCalledWith('a1', 'u2')
  })

  it('muestra estado vacío', () => {
    render(
      <MemoryRouter>
        <RequestsTable applications={[]} team={team} onAssign={vi.fn()} emptyText="Nada por aquí" />
      </MemoryRouter>,
    )
    expect(screen.getByText('Nada por aquí')).toBeInTheDocument()
  })
})

describe('ScoreBadge y AiPanel', () => {
  it('badge según estado', () => {
    const { rerender } = render(<ScoreBadge status="error" />)
    expect(screen.getByText('Sin análisis')).toBeInTheDocument()
    rerender(<ScoreBadge status="done" score={71} fit="alto" />)
    expect(screen.getByTitle('Afinidad alta · puntaje IA 71/100')).toBeInTheDocument()
  })

  it('panel IA muestra resumen, desglose y evidencia de liderazgo', () => {
    const application = {
      ai_status: 'done',
      ai_score: 88,
      ai_fit: 'alto',
      ai_summary: 'Lidera equipos de 25 personas.',
      ai_model: 'rubrica-aquachile-v1',
      ai_analysis: {
        strengths: ['Jefatura previa'],
        concerns: ['Sin inglés'],
        recommendation: 'Avanzar a entrevista',
        rubric: {
          score: 88,
          requiresLeadership: true,
          weights: { leadership: 35, experience: 20, familyMatch: 20, roleMatch: 15, education: 10 },
          breakdown: { leadership: 35, experience: 20, familyMatch: 13, roleMatch: 10, education: 10 },
          signals: { leadershipEvidence: ['Jefe de Centro de Cultivo'] },
        },
      },
    }
    render(<AiPanel application={application} onReanalyze={vi.fn()} />)
    expect(screen.getByTestId('ai-summary')).toHaveTextContent('Lidera equipos de 25 personas.')
    expect(screen.getByText('Afinidad alta')).toBeInTheDocument()
    expect(screen.getByText('Jefatura previa')).toBeInTheDocument()
    expect(screen.getByText('Sin inglés')).toBeInTheDocument()
    expect(screen.getByText('“Jefe de Centro de Cultivo”')).toBeInTheDocument()
    expect(screen.getByText('35/35')).toBeInTheDocument()
    expect(screen.getByText(/pesa 35%/)).toBeInTheDocument()
  })

  it('re-analizar llama al servicio', async () => {
    const onReanalyze = vi.fn().mockResolvedValue()
    const user = userEvent.setup()
    render(<AiPanel application={{ ai_status: 'error', ai_error: 'timeout' }} onReanalyze={onReanalyze} />)
    expect(screen.getByRole('alert')).toHaveTextContent('timeout')
    await user.click(screen.getByRole('button', { name: /Re-analizar/ }))
    expect(onReanalyze).toHaveBeenCalled()
  })
})

describe('mergeNewer (eventos Realtime fuera de orden)', async () => {
  const { mergeNewer } = await import('@/pages/dashboard/hooks/useApplications.js')
  it('ignora un evento más viejo que el estado local', () => {
    const local = { id: 'a', stage: 'entrevista', updated_at: '2026-11-19T03:30:02.000Z' }
    const stale = { id: 'a', stage: 'recibido', ai_status: 'done', updated_at: '2026-11-19T03:30:01.000Z' }
    expect(mergeNewer(local, stale)).toBe(local)
  })
  it('aplica un evento más nuevo', () => {
    const local = { id: 'a', stage: 'recibido', ai_status: 'processing', updated_at: '2026-11-19T03:30:01.000Z' }
    const fresh = { id: 'a', stage: 'recibido', ai_status: 'done', updated_at: '2026-11-19T03:30:05.000Z' }
    expect(mergeNewer(local, fresh).ai_status).toBe('done')
  })
})
