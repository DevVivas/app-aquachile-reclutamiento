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
    <div className="formulario-background text-slate-900">
      <img src="/barra.png" alt="" aria-hidden="true" className="page-bar" />
      <main className="page-main">
        <section className="form-card mx-auto w-full max-w-xl">
          <header className="mb-4 flex justify-center">
            <a
              href="/"
              aria-label="AquaChile, ir al inicio"
              className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
            >
              <img
                src="/aquachile-logo.webp"
                alt="AquaChile"
                className="h-auto w-36 sm:w-40"
              />
            </a>
          </header>
          {message && <FormAlert type={message.type}>{message.text}</FormAlert>}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
            <ValidatedTextInput
              id="candidateName"
              name="candidateName"
              label="Nombre completo del candidato"
              hint={`Entre ${CANDIDATE_NAME_MIN_LENGTH} y ${CANDIDATE_NAME_MAX_LENGTH} caracteres.`}
              placeholder="Ej. María González Pérez"
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

            <FormField label="Familia del cargo" htmlFor="jobFamily">
              <select
                id="jobFamily"
                name="jobFamily"
                required
                value={formData.jobFamily}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="" disabled>
                  Selecciona una familia
                </option>
                {JOB_FAMILIES.map((family) => (
                  <option key={family} value={family}>
                    {family}
                  </option>
                ))}
              </select>
            </FormField>

            <ValidatedTextInput
              id="jobTitle"
              name="jobTitle"
              label="Nombre del cargo"
              placeholder="Ej. Jefe de Planta"
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

            <FormField label="Curriculum Vitae" htmlFor="cvFile">
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
                  {formData.cvFile?.name ?? 'PDF o Word, ningún archivo seleccionado'}
                </p>
              </div>
            </FormField>

            <button
              type="submit"
              disabled={loading}
              className="ui-button-primary mt-1 w-full px-4 py-3 text-base"
            >
              {loading ? 'Enviando solicitud…' : 'Iniciar evaluación'}
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
        <img src="/paisaje.png" alt="" aria-hidden="true" className="landscape-footer-image" />
        <img src="/barra.png" alt="" aria-hidden="true" className="landscape-footer-bar" />
      </footer>
    </div>
  )
}
