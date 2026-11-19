import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FormularioPage from '@/pages/formulario/FormularioPage.jsx'
import { validateCvFile } from '@/pages/formulario/hooks/useEvaluacionForm.js'
import { submitApplication } from '@/services/applicationsService.js'

vi.mock('@/services/applicationsService.js', () => ({ submitApplication: vi.fn() }))

const pdf = (name = 'cv.pdf', size = 1000) => new File([new Uint8Array(size)], name, { type: 'application/pdf' })

function renderPage() {
  return render(
    <MemoryRouter>
      <FormularioPage />
    </MemoryRouter>,
  )
}

async function fillValid(user) {
  await user.type(screen.getByLabelText('Nombre completo'), 'Ana Rojas Pérez')
  await user.type(screen.getByLabelText(/Correo/), 'ana@correo.cl')
  await user.selectOptions(screen.getByLabelText('Familia de cargo'), 'Operaciones y Logística')
  await user.type(screen.getByLabelText('Cargo al que postulas'), 'Jefa de Turno')
  await user.upload(screen.getByLabelText('Curriculum Vitae (PDF o Word)'), pdf())
}

describe('validateCvFile', () => {
  it('acepta PDF/Word y rechaza otros formatos, vacíos o > 10 MB', () => {
    expect(validateCvFile(pdf())).toBeNull()
    expect(validateCvFile(pdf('cv.docx'))).toBeNull()
    expect(validateCvFile(null)).toMatch(/Adjunta/)
    expect(validateCvFile(pdf('foto.png'))).toMatch(/PDF o Word/)
    expect(validateCvFile(pdf('cv.pdf', 0))).toMatch(/vacío/)
    expect(validateCvFile(pdf('cv.pdf', 11 * 1024 * 1024))).toMatch(/10 MB/)
  })
})

describe('FormularioPage', () => {
  beforeEach(() => vi.mocked(submitApplication).mockReset())

  it('envía la postulación con los datos del formulario y muestra confirmación', async () => {
    vi.mocked(submitApplication).mockResolvedValue({ id: '1', folder: 'ana-rojas-perez' })
    const user = userEvent.setup()
    renderPage()
    await fillValid(user)
    expect(screen.getByTestId('cv-name')).toHaveTextContent('cv.pdf')

    await user.click(screen.getByRole('button', { name: 'Enviar postulación' }))

    expect(await screen.findByRole('heading', { name: '¡Postulación recibida!' })).toBeInTheDocument()
    expect(screen.getByText('Jefa de Turno')).toBeInTheDocument()
    expect(submitApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateName: 'Ana Rojas Pérez',
        candidateEmail: 'ana@correo.cl',
        jobFamily: 'Operaciones y Logística',
        jobTitle: 'Jefa de Turno',
        website: '',
        cvFile: expect.any(File),
      }),
    )
  })

  it('rechaza un archivo no permitido sin llamar al backend', async () => {
    const user = userEvent.setup({ applyAccept: false })
    renderPage()
    await user.upload(screen.getByLabelText('Curriculum Vitae (PDF o Word)'), pdf('virus.exe'))
    expect(screen.getByText(/debe ser PDF o Word/)).toBeInTheDocument()
    expect(submitApplication).not.toHaveBeenCalled()
  })

  it('permite enviar otra postulación tras el éxito', async () => {
    vi.mocked(submitApplication).mockResolvedValue({ id: '1' })
    const user = userEvent.setup()
    renderPage()
    await fillValid(user)
    await user.click(screen.getByRole('button', { name: 'Enviar postulación' }))
    await user.click(await screen.findByRole('button', { name: 'Enviar otra postulación' }))
    await waitFor(() => expect(screen.getByLabelText('Nombre completo')).toHaveValue(''))
  })
})
