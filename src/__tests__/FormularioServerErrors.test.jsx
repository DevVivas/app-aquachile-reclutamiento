// Usa el servicio real con fetch simulado: valida el contrato HTTP con la Edge Function.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import FormularioPage from '@/pages/formulario/FormularioPage.jsx'

vi.mock('@/lib/supabase.js', () => ({ supabase: {}, functionsUrl: (name) => `https://test.supabase.co/functions/v1/${name}` }))

const respond = (status, body) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))

async function submitValid(user) {
  render(
    <MemoryRouter>
      <FormularioPage />
    </MemoryRouter>,
  )
  await user.type(screen.getByLabelText('Nombre completo'), 'Ana Rojas')
  await user.type(screen.getByLabelText(/Correo/), 'ana@correo.cl')
  await user.selectOptions(screen.getByLabelText('Familia de cargo'), 'Comercial y Ventas')
  await user.type(screen.getByLabelText('Cargo al que postulas'), 'Ejecutiva')
  await user.upload(screen.getByLabelText('Curriculum Vitae (PDF o Word)'), new File(['%PDF-1.4'], 'cv.pdf', { type: 'application/pdf' }))
  await user.click(screen.getByRole('button', { name: 'Enviar postulación' }))
}

describe('FormularioPage ↔ submit-application', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('envía multipart a la Edge Function con todos los campos', async () => {
    const fetchMock = respond(201, { id: 'x', folder: 'ana-rojas' })
    vi.stubGlobal('fetch', fetchMock)
    await submitValid(userEvent.setup())

    expect(await screen.findByText('¡Postulación recibida!')).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://test.supabase.co/functions/v1/submit-application')
    expect(init.method).toBe('POST')
    const body = init.body
    expect(body.get('candidateName')).toBe('Ana Rojas')
    expect(body.get('candidateEmail')).toBe('ana@correo.cl')
    expect(body.get('jobFamily')).toBe('Comercial y Ventas')
    expect(body.get('jobTitle')).toBe('Ejecutiva')
    expect(body.get('website')).toBe('')
    expect(body.get('cv').name).toBe('cv.pdf')
  })

  it('marca los campos inválidos que devuelve el servidor (422)', async () => {
    vi.stubGlobal('fetch', respond(422, { error: 'Datos inválidos', fields: { candidateEmail: 'Correo no válido.' } }))
    await submitValid(userEvent.setup())

    expect(await screen.findByText('Revisa los campos marcados.')).toBeInTheDocument()
    expect(screen.getByText('Correo no válido.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Correo/)).toHaveAttribute('aria-invalid', 'true')
  })

  it('muestra un error genérico si el servidor falla (500)', async () => {
    vi.stubGlobal('fetch', respond(500, { error: 'No se pudo guardar el CV' }))
    await submitValid(userEvent.setup())
    expect(await screen.findByText(/Ocurrió un error al enviar tu postulación/)).toBeInTheDocument()
  })
})
