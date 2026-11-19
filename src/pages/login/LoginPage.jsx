import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthCard, AuthLogo, AuthScreen, Stagger } from '@/components/ui/auth-card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { ROUTES } from '@/constants/routes.js'
import FormAlert from '@/pages/formulario/components/FormAlert.jsx'
import FormField from '@/pages/formulario/components/FormField.jsx'
import { login } from '@/services/authService.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

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
      navigate(location.state?.from || ROUTES.ADMIN, { replace: true })
    } catch (loginError) {
      setError(loginError.message)
      setForm((previous) => ({ ...previous, password: '' }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthScreen>
      <AuthCard className="max-w-sm">
        <Stagger className="space-y-1 text-center">
          <AuthLogo />
          <h1 className="text-xl font-semibold tracking-tight">Acceso al panel</h1>
          <p className="text-sm text-muted">Solo personal autorizado.</p>
        </Stagger>

        {error && <FormAlert type="error">{error}</FormAlert>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Stagger>
            <FormField label="Correo" htmlFor="email">
              <Input
                id="email"
                type="email"
                name="email"
                autoComplete="username"
                maxLength={254}
                value={form.email}
                onChange={handleChange}
                required
              />
            </FormField>
          </Stagger>
          <Stagger>
            <FormField label="Contraseña" htmlFor="password">
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="current-password"
                maxLength={128}
                value={form.password}
                onChange={handleChange}
                required
              />
            </FormField>
          </Stagger>
          <Stagger>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {submitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </Stagger>
        </form>
      </AuthCard>
    </AuthScreen>
  )
}
