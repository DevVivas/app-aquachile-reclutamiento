import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, FileText, Loader2, Upload } from 'lucide-react'
import { AuthCard, AuthLogo, AuthScreen, Stagger } from '@/components/ui/auth-card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input, Select } from '@/components/ui/input.jsx'
import { ROUTES } from '@/constants/routes.js'
import { cn } from '@/lib/utils.js'
import FormAlert from './components/FormAlert.jsx'
import FormField from './components/FormField.jsx'
import { CV_ACCEPT, FAMILIAS_CARGO, MAX_CV_MB } from './constants.js'
import { useEvaluacionForm } from './hooks/useEvaluacionForm.js'

const errorProps = (errors, name) =>
  errors[name] ? { 'aria-invalid': true, 'aria-describedby': `${name}-error` } : {}

export default function FormularioPage() {
  const {
    formData,
    website,
    setWebsite,
    loading,
    message,
    fieldErrors,
    submitted,
    fileInputRef,
    handleInputChange,
    handleFileChange,
    selectFile,
    handleSubmit,
    reset,
  } = useEvaluacionForm()
  const [dragging, setDragging] = useState(false)

  if (submitted) {
    return (
      <AuthScreen>
        <AuthCard className="max-w-md">
          <Stagger className="space-y-2 text-center">
            <AuthLogo />
            <CheckCircle2 className="mx-auto size-10 text-green-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold tracking-tight">¡Postulación recibida!</h1>
            <p className="text-sm text-muted">
              Gracias, {submitted.name}. Tu CV para <strong className="text-ink">{submitted.jobTitle}</strong> ya está
              en manos de nuestro equipo de selección. Te contactaremos si tu perfil avanza.
            </p>
          </Stagger>
          <Stagger>
            <Button variant="outline" className="w-full" onClick={reset}>Enviar otra postulación</Button>
          </Stagger>
        </AuthCard>
      </AuthScreen>
    )
  }

  return (
    <AuthScreen>
      <AuthCard className="max-w-lg">
        <Stagger className="space-y-1 text-center">
          <AuthLogo />
          <h1 className="text-xl font-semibold tracking-tight">Postula a AquaChile</h1>
          <p className="text-sm leading-snug text-muted">
            Completa tus datos y adjunta tu CV. Nuestro equipo de selección revisará tu perfil.
          </p>
        </Stagger>

        {message && <FormAlert type={message.type}>{message.text}</FormAlert>}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate={false}>
          {/* Honeypot: invisible para personas, los bots lo rellenan. */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="website">Sitio web</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          <Stagger>
            <FormField label="Nombre completo" htmlFor="candidateName" error={fieldErrors.candidateName}>
              <Input
                id="candidateName"
                name="candidateName"
                required
                minLength={2}
                maxLength={120}
                autoComplete="name"
                placeholder="Ej: Juan Pérez Martínez"
                value={formData.candidateName}
                onChange={handleInputChange}
                {...errorProps(fieldErrors, 'candidateName')}
              />
            </FormField>
          </Stagger>

          <Stagger className="grid gap-3 sm:grid-cols-2">
            <FormField label="Correo" htmlFor="candidateEmail" optional error={fieldErrors.candidateEmail}>
              <Input
                id="candidateEmail"
                name="candidateEmail"
                type="email"
                maxLength={254}
                autoComplete="email"
                placeholder="nombre@correo.cl"
                value={formData.candidateEmail}
                onChange={handleInputChange}
                {...errorProps(fieldErrors, 'candidateEmail')}
              />
            </FormField>
            <FormField label="Teléfono" htmlFor="candidatePhone" optional error={fieldErrors.candidatePhone}>
              <Input
                id="candidatePhone"
                name="candidatePhone"
                type="tel"
                maxLength={20}
                autoComplete="tel"
                placeholder="+56 9 1234 5678"
                value={formData.candidatePhone}
                onChange={handleInputChange}
                {...errorProps(fieldErrors, 'candidatePhone')}
              />
            </FormField>
          </Stagger>

          <Stagger className="grid gap-3 sm:grid-cols-2">
            <FormField label="Familia de cargo" htmlFor="jobFamily" error={fieldErrors.jobFamily}>
              <Select id="jobFamily" name="jobFamily" required value={formData.jobFamily} onChange={handleInputChange} {...errorProps(fieldErrors, 'jobFamily')}>
                <option value="" disabled>Selecciona una familia</option>
                {FAMILIAS_CARGO.map((family) => (
                  <option key={family} value={family}>{family}</option>
                ))}
              </Select>
            </FormField>
            <FormField label="Cargo al que postulas" htmlFor="jobTitle" error={fieldErrors.jobTitle}>
              <Input
                id="jobTitle"
                name="jobTitle"
                required
                minLength={2}
                maxLength={120}
                placeholder="Ej: Jefe de Centro"
                value={formData.jobTitle}
                onChange={handleInputChange}
                {...errorProps(fieldErrors, 'jobTitle')}
              />
            </FormField>
          </Stagger>

          <Stagger>
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                selectFile(e.dataTransfer.files?.[0])
              }}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg border border-dashed bg-canvas p-2.5 transition-colors',
                dragging ? 'border-brand bg-brand-soft' : fieldErrors.cv ? 'border-red-300' : 'border-line',
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" data-testid="cv-name">
                    {formData.cvFile ? formData.cvFile.name : 'Curriculum Vitae'}
                  </p>
                  <p className={cn('text-xs', fieldErrors.cv ? 'text-red-700' : 'text-muted')}>
                    {fieldErrors.cv ?? `PDF o Word, máx. ${MAX_CV_MB} MB · puedes arrastrarlo aquí`}
                  </p>
                </div>
              </div>
              <Button type="button" variant="outline" className="h-9 px-3" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" aria-hidden="true" />
                {formData.cvFile ? 'Cambiar' : 'Subir'}
              </Button>
              <input
                ref={fileInputRef}
                id="cvFile"
                type="file"
                name="cvFile"
                accept={CV_ACCEPT}
                onChange={handleFileChange}
                className="sr-only"
                tabIndex={-1}
                aria-label="Curriculum Vitae (PDF o Word)"
              />
            </div>
          </Stagger>

          <Stagger>
            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {loading ? 'Enviando postulación…' : 'Enviar postulación'}
            </Button>
          </Stagger>

          <Stagger>
            <p className="text-center text-xs text-muted">
              ¿Eres parte del equipo de selección?{' '}
              <Link to={ROUTES.LOGIN} className="font-medium text-brand hover:underline">Ingresa al panel</Link>
            </p>
          </Stagger>
        </form>
      </AuthCard>
    </AuthScreen>
  )
}
