import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth.js'
import { ROUTES } from '@/constants/routes.js'
import { INPUT_CLASSNAME } from '@/pages/formulario/constants.js'

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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <img src="/aquachile-logo.webp" alt="AquaChile" className="mx-auto h-10" />
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">Acceso al panel</h1>
          <p className="mt-1 text-sm text-gray-500">Solo personal autorizado.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </p>
        )}

        <label className="block text-sm font-medium text-gray-700">
          Correo
          <input
            className={`${INPUT_CLASSNAME} mt-1.5`}
            type="email"
            name="email"
            autoComplete="username"
            value={form.email}
            onChange={handleChange}
            required
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Contraseña
          <input
            className={`${INPUT_CLASSNAME} mt-1.5`}
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  )
}
