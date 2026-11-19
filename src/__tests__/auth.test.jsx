import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '@/auth/authContext.js'
import RequireStaff from '@/auth/RequireStaff.jsx'

vi.mock('@/lib/supabase.js', () => ({ supabase: {}, functionsUrl: (n) => n }))

function renderWith(auth, { adminOnly = false } = {}) {
  const value = { loading: false, user: null, profile: null, isStaff: false, isAdmin: false, signOut: vi.fn(), refreshProfile: vi.fn(), ...auth }
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<p>pantalla login</p>} />
          <Route path="/dashboard" element={<RequireStaff adminOnly={adminOnly}><p>panel privado</p></RequireStaff>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('RequireStaff', () => {
  it('sin sesión redirige al login', () => {
    renderWith({})
    expect(screen.getByText('pantalla login')).toBeInTheDocument()
  })

  it('cuenta no aprobada ve la pantalla de espera, no el panel', () => {
    renderWith({ user: { id: 'u' }, profile: { full_name: 'Nueva Persona', approved: false } })
    expect(screen.getByRole('heading', { name: 'Cuenta pendiente de aprobación' })).toBeInTheDocument()
    expect(screen.queryByText('panel privado')).not.toBeInTheDocument()
  })

  it('miembro aprobado entra', () => {
    renderWith({ user: { id: 'u' }, profile: { approved: true }, isStaff: true })
    expect(screen.getByText('panel privado')).toBeInTheDocument()
  })
})
