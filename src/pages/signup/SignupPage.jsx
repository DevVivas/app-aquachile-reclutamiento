import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthCard, AuthLogo, AuthScreen, Stagger } from '@/components/ui/auth-card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input, Select } from '@/components/ui/input.jsx'
import { ROLES, SIGNUP_ROLES } from '@/constants/pipeline.js'
import { ROUTES } from '@/constants/routes.js'
import FormAlert from '@/pages/formulario/components/FormAlert.jsx'
import FormField from '@/pages/formulario/components/FormField.jsx'
import { signup } from '@/services/authService.js'

const INITIAL = { fullName: '', email: '', password: '', role: 'reclutador', website: '' }

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fields, setFields] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    setFields((previous) => ({ ...previous, [name]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await signup({ ...form, fullName: form.fullName.trim(), email: form.email.trim() })
      navigate(ROUTES.ADMIN, { replace: true })
    } catch (signupError) {
      setError(signupError.message)
      setFields(signupError.fields ?? {})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthScreen>
      <AuthCard className="max-w-sm">
        <Stagger className="space-y-1 text-center">
          <AuthLogo />
          <h1 className="text-xl font-semibold tracking-tight">Solicitar acceso</h1>
          <p className="text-sm text-muted">Un administrador aprobará tu cuenta.</p>
        </Stagger>

        {error && <FormAlert type="error">{error}</FormAlert>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="signup-website">Sitio web</label>
            <input id="signup-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={handleChange} />
          </div>
          <Stagger>
            <FormField label="Nombre completo" htmlFor="fullName" error={fields.fullName}>
              <Input id="fullName" name="fullName" autoComplete="name" minLength={3} maxLength={120} value={form.fullName} onChange={handleChange} required />
            </FormField>
          </Stagger>
          <Stagger>
            <FormField label="Correo corporativo" htmlFor="email" error={fields.email}>
              <Input id="email" type="email" name="email" autoComplete="email" maxLength={254} value={form.email} onChange={handleChange} required />
            </FormField>
          </Stagger>
          <Stagger>
            <FormField label="Contraseña" htmlFor="password" error={fields.password}>
              <Input
                id="password"
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                placeholder="Mínimo 8 caracteres, letras y números"
                value={form.password}
                onChange={handleChange}
                required
              />
            </FormField>
          </Stagger>
          <Stagger>
            <FormField label="Tu rol" htmlFor="role">
              <Select id="role" name="role" value={form.role} onChange={handleChange}>
                {SIGNUP_ROLES.map((role) => (
                  <option key={role} value={role}>{ROLES[role]}</option>
                ))}
              </Select>
            </FormField>
          </Stagger>
          <Stagger>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </Stagger>
          <Stagger>
            <p className="text-center text-xs text-muted">
              ¿Ya tienes cuenta?{' '}
              <Link to={ROUTES.LOGIN} className="font-medium text-brand hover:underline">Ingresa</Link>
            </p>
          </Stagger>
        </form>
      </AuthCard>
    </AuthScreen>
  )
}
