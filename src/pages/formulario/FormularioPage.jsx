import FormAlert from './components/FormAlert.jsx'
import FormField from './components/FormField.jsx'
import { JOB_FAMILIES } from '@/constants/jobFamilies.js'
import { INPUT_CLASSNAME } from './constants.js'
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
    <div className="formulario-background min-h-screen px-4 pb-12 text-slate-900">
      <main className="mx-auto mt-8 w-full max-w-xl sm:mt-12">
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <input
              id="candidateName"
              type="text"
              name="candidateName"
              required
              aria-label="Nombre completo del candidato"
              placeholder="Nombre completo del candidato"
              value={formData.candidateName}
              onChange={handleInputChange}
              className={INPUT_CLASSNAME}
            />

            <select
              id="jobFamily"
              name="jobFamily"
              required
              aria-label="Familia del cargo"
              value={formData.jobFamily}
              onChange={handleInputChange}
              className={INPUT_CLASSNAME}
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

            <input
              id="jobTitle"
              type="text"
              name="jobTitle"
              required
              aria-label="Nombre del cargo"
              placeholder="Nombre del cargo"
              value={formData.jobTitle}
              onChange={handleInputChange}
              className={INPUT_CLASSNAME}
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
    </div>
  )
}
