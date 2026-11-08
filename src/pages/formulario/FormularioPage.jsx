import { FileText, Loader2, Upload } from 'lucide-react'
import { AuthCard, Stagger } from '@/components/ui/auth-card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input, Select } from '@/components/ui/input.jsx'
import FormAlert from './components/FormAlert.jsx'
import FormField from './components/FormField.jsx'
import { FAMILIAS_CARGO } from './constants.js'
import { useEvaluacionForm } from './hooks/useEvaluacionForm.js'

export default function FormularioPage() {
  const {
    formData,
    loading,
    message,
    fileInputRef,
    handleInputChange,
    handleFileChange,
    handleSubmit,
  } = useEvaluacionForm()

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <AuthCard className="max-w-lg">
        <Stagger className="space-y-1.5 text-center">
          <img src="/aquachile-logo.webp" alt="AquaChile" className="mx-auto mb-2 h-14" />
          <h1 className="text-xl font-semibold tracking-tight">Solicitud de Evaluación Psicolaboral</h1>
          <p className="text-sm leading-relaxed text-muted">
            Ingresa los antecedentes del candidato para generar el entorno y las plantillas automáticas.
          </p>
        </Stagger>

        {message && <FormAlert type={message.type}>{message.text}</FormAlert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Stagger>
            <FormField label="Nombre completo del candidato" htmlFor="candidateName">
              <Input
                id="candidateName"
                name="candidateName"
                required
                placeholder="Ej: Juan Pérez Martínez"
                value={formData.candidateName}
                onChange={handleInputChange}
              />
            </FormField>
          </Stagger>

          <Stagger>
            <FormField label="Familia de cargo" htmlFor="jobFamily">
              <Select id="jobFamily" name="jobFamily" required value={formData.jobFamily} onChange={handleInputChange}>
                <option value="" disabled>Selecciona una familia de cargo</option>
                {FAMILIAS_CARGO.map((family) => (
                  <option key={family} value={family}>{family}</option>
                ))}
              </Select>
            </FormField>
          </Stagger>

          <Stagger>
            <FormField label="Nombre del cargo" htmlFor="jobTitle">
              <Input
                id="jobTitle"
                name="jobTitle"
                required
                placeholder="Ej: Analista de Procesos"
                value={formData.jobTitle}
                onChange={handleInputChange}
              />
            </FormField>
          </Stagger>

          <Stagger>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas p-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <FileText className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {formData.cvFile ? formData.cvFile.name : 'Curriculum Vitae'}
                  </p>
                  <p className="text-xs text-muted">PDF o Word</p>
                </div>
              </div>
              <Button type="button" variant="outline" className="h-9 px-3" onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" aria-hidden="true" />
                {formData.cvFile ? 'Cambiar' : 'Subir'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                name="cvFile"
                required
                accept=".pdf,.doc,.docx"
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
              {loading ? 'Creando expediente y carpetas…' : 'Iniciar evaluación'}
            </Button>
          </Stagger>
        </form>
      </AuthCard>
    </main>
  )
}
