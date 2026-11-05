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
  const [showPassword, setShowPassword] = useState(false)

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
    <div className="formulario-background text-slate-900">
      <img src="/barra.png" alt="" aria-hidden="true" className="page-bar" />
      <main className="page-main">
        <section className="form-card mx-auto w-full max-w-xl">
          <header className="mb-4 text-center">
            <img
              src="/aquachile-logo.webp"
              alt="AquaChile"
              className="mx-auto mb-4 h-auto w-36 sm:w-40"
            />
            <h1 className="m-0 text-xl font-semibold leading-7 text-[var(--ui-color-slate)]">
              Acceso administración
            </h1>
            <p className="mt-1 text-sm text-[var(--ui-color-muted)]">
              Ingresa con tu cuenta para gestionar las solicitudes.
            </p>
          </header>

          {error && (
            <p
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} aria-busy={submitting} className="flex flex-col gap-3">
            <div>
              <label htmlFor="email" className="field-label">
                Correo
              </label>
              <input
                id="email"
                className="form-input"
                type="email"
                name="email"
                autoComplete="username"
                placeholder="nombre@empresa.cl"
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(error)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Contraseña
              </label>
              <div className="validated-input-wrap">
                <input
                  id="password"
                  className="form-input"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(error)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="ui-button-primary mt-1 w-full px-4 py-3 text-base"
            >
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </section>
      </main>
      <footer className="landscape-footer">
        <img src="/paisaje.png" alt="" aria-hidden="true" className="landscape-footer-image" />
        <img src="/barra.png" alt="" aria-hidden="true" className="landscape-footer-bar" />
      </footer>
    </div>
  )
}
