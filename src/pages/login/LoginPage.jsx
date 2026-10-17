import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth.js'
import { ROUTES } from '@/constants/routes.js'

export default function LoginPage() {
  const { status, login } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const destination = location.state?.from || ROUTES.ADMIN

  if (status === 'authenticated') {
    return <Navigate to={destination} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login(form.email.trim(), form.password)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="formulario-background flex min-h-screen flex-col text-slate-900">
      <img src="/barra.png" alt="" aria-hidden="true" className="block h-auto w-full" />
      <main className="relative z-10 mx-auto mt-8 w-full max-w-xl flex-1 px-4 pb-12 sm:mt-12">
        <section className="form-card sm:min-h-[653px]">
          <header className="mb-8 flex justify-center">
            <img
              src="/aquachile-logo.webp"
              alt="AquaChile"
              className="h-auto w-56 sm:w-64"
            />
          </header>

          {error && (
            <p
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <input
              className="form-input"
              type="email"
              name="email"
              aria-label="Correo"
              autoComplete="username"
              placeholder="Correo"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              className="form-input"
              type="password"
              name="password"
              aria-label="Contraseña"
              autoComplete="current-password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              disabled={submitting}
              className="ui-button-primary mt-2 w-full px-4 py-4 text-base shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99]"
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </section>
      </main>
      <footer className="landscape-footer">
        <img src="/paisaje.png" alt="" aria-hidden="true" className="block h-auto w-full" />
        <img src="/barra.png" alt="" aria-hidden="true" className="landscape-footer-bar" />
      </footer>
    </div>
  )
}
