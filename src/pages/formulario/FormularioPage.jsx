import { useEffect, useRef } from 'react'
import FormAlert from './components/FormAlert.jsx'
import FormField from './components/FormField.jsx'
import ValidatedTextInput from './components/ValidatedTextInput.jsx'
import { JOB_FAMILIES } from '@/constants/jobFamilies.js'
import {
  CANDIDATE_NAME_MAX_LENGTH,
  CANDIDATE_NAME_MIN_LENGTH,
  JOB_TITLE_MIN_LENGTH,
  JOB_TITLE_MAX_LENGTH,
  validateCandidateName,
  validateJobTitle,
} from './constants.js'
import { useEvaluacionForm } from './hooks/useEvaluacionForm.js'

export default function FormularioPage() {
  const {
    formData,
    loading,
    message,
    success,
    fileInputRef,
    handleInputChange,
    handleBlur,
    handleFileChange,
    handleSubmit,
    closeSuccess,
    validationErrors,
  } = useEvaluacionForm()
  const successDialogRef = useRef(null)

  useEffect(() => {
    if (success && successDialogRef.current && !successDialogRef.current.open) {
      successDialogRef.current.showModal()
    }
  }, [success])

  return (
    <div className="formulario-background flex min-h-screen flex-col text-slate-900">
      <img src="/barra.png" alt="" aria-hidden="true" className="block h-auto w-full" />
      <main className="relative z-10 mx-auto mt-8 w-full max-w-xl flex-1 px-4 pb-12 sm:mt-12">
        <section className="form-card">
          <header className="mb-8 flex justify-center">
            <a
              href="/"
              aria-label="AquaChile, ir al inicio"
              className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
            >
              <img
                src="/aquachile-logo.webp"
                alt="AquaChile"
                className="h-auto w-56 sm:w-64"
              />
            </a>
          </header>
          {message && <FormAlert type={message.type}>{message.text}</FormAlert>}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            <ValidatedTextInput
              id="candidateName"
              name="candidateName"
              aria-label="Nombre completo del candidato"
              placeholder="Nombre completo del candidato"
              value={formData.candidateName}
              minLength={CANDIDATE_NAME_MIN_LENGTH}
              maxLength={CANDIDATE_NAME_MAX_LENGTH}
              isValid={
                formData.candidateName.trim().length > 0 &&
                !validateCandidateName(formData.candidateName)
              }
              validationError={validationErrors.candidateName}
              onChange={handleInputChange}
              onBlur={handleBlur}
            />

            <select
              id="jobFamily"
              name="jobFamily"
              required
              aria-label="Familia del cargo"
              value={formData.jobFamily}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="" disabled className="text-gray-400">
                Familia del cargo
              </option>
              {JOB_FAMILIES.map((family) => (
                <option key={family} value={family} className="text-gray-900 bg-white">
                  {family}
                </option>
              ))}
            </select>

            <ValidatedTextInput
              id="jobTitle"
              name="jobTitle"
              aria-label="Nombre del cargo"
              placeholder="Nombre del cargo"
              value={formData.jobTitle}
              minLength={JOB_TITLE_MIN_LENGTH}
              maxLength={JOB_TITLE_MAX_LENGTH}
              isValid={
                formData.jobTitle.trim().length > 0 &&
                !validateJobTitle(formData.jobTitle)
              }
              validationError={validationErrors.jobTitle}
              onChange={handleInputChange}
              onBlur={handleBlur}
            />

            <FormField label="Curriculum Vitae (PDF o Word):" htmlFor="cvFile">
              <div className="file-picker">
                <input
                  id="cvFile"
                  ref={fileInputRef}
                  type="file"
                  name="cvFile"
                  required
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  aria-describedby="cvFile-help"
                  className="file-picker-input"
                />
                <label className="file-picker-button" htmlFor="cvFile">
                  Seleccionar archivo
                </label>
                <p id="cvFile-help" aria-live="polite" className="file-picker-name">
                  {formData.cvFile?.name ?? 'Ningún archivo seleccionado'}
                </p>
              </div>
            </FormField>

            <button
              type="submit"
              disabled={loading}
              className="ui-button-primary mt-2 w-full px-4 py-4 text-base shadow-md hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:scale-[0.99]"
            >
              {loading ? 'Creando expediente y carpetas...' : 'Iniciar Evaluación'}
            </button>
          </form>
        </section>
      </main>
      <dialog
        ref={successDialogRef}
        className="success-dialog"
        aria-labelledby="success-dialog-title"
        onClose={closeSuccess}
      >
        <div className="success-dialog-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m6 12.5 4 4L18.5 8" />
          </svg>
        </div>
        <h2 id="success-dialog-title">Solicitud enviada</h2>
        <p>Tu solicitud se ha enviado correctamente.</p>
        <button
          type="button"
          autoFocus
          className="ui-button-primary success-dialog-button"
          onClick={() => successDialogRef.current?.close()}
        >
          Aceptar
        </button>
      </dialog>
      <footer className="landscape-footer">
        <img src="/paisaje.png" alt="" aria-hidden="true" className="block h-auto w-full" />
        <img src="/barra.png" alt="" aria-hidden="true" className="landscape-footer-bar" />
      </footer>
    </div>
  )
}
