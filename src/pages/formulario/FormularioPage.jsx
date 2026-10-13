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
        <section className="rounded-2xl border border-white/30 bg-slate-950/55 p-6 text-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.75)] backdrop-blur-xl sm:p-10">
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            <FormField
              label="Nombre Completo del Candidato:"
              htmlFor="candidateName"
            >
              <input
                id="candidateName"
                type="text"
                name="candidateName"
                required
                placeholder="Ej: Juan Pérez Martínez"
                value={formData.candidateName}
                onChange={handleInputChange}
                className={INPUT_CLASSNAME}
              />
            </FormField>

            <FormField label="Familia de Cargo:" htmlFor="jobFamily">
              <select
                id="jobFamily"
                name="jobFamily"
                required
                value={formData.jobFamily}
                onChange={handleInputChange}
                className={INPUT_CLASSNAME}
              >
                <option value="" disabled className="text-gray-400">
                  Selecciona una familia de cargo
                </option>
                {JOB_FAMILIES.map((family) => (
                  <option key={family} value={family} className="text-gray-900 bg-white">
                    {family}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Nombre del Cargo:" htmlFor="jobTitle">
              <input
                id="jobTitle"
                type="text"
                name="jobTitle"
                required
                placeholder="Ej: Analista de Procesos"
                value={formData.jobTitle}
                onChange={handleInputChange}
                className={INPUT_CLASSNAME}
              />
            </FormField>

            <FormField label="Curriculum Vitae (PDF o Word):" htmlFor="cvFile">
              <input
                id="cvFile"
                ref={fileInputRef}
                type="file"
                name="cvFile"
                required
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                aria-describedby="cvFile-help"
                className="form-input block w-full cursor-pointer rounded-lg border border-dashed border-white/50 bg-white/10 px-4 py-3 text-sm text-white shadow-sm transition file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-teal-600 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white file:shadow-sm file:transition-colors hover:border-white/70 hover:bg-white/15 file:hover:bg-teal-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
              />
              <p id="cvFile-help" aria-live="polite" className="text-sm text-slate-200">
                {formData.cvFile?.name ?? 'Ningún archivo seleccionado'}
              </p>
            </FormField>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-teal-500 px-4 py-4 text-base font-bold text-white shadow-md shadow-teal-950/25 transition duration-150 hover:-translate-y-0.5 hover:bg-teal-400 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creando expediente y carpetas...' : 'Iniciar Evaluación'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
