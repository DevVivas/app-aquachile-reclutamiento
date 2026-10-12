import FormAlert from './components/FormAlert.jsx'
import FormField from './components/FormField.jsx'
import { FAMILIAS_CARGO, INPUT_CLASSNAME } from './constants.js'
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
    <div className="min-h-screen bg-slate-50 px-4 pb-12 text-slate-900">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-center py-5 sm:py-7">
        <a
          href="/"
          aria-label="AquaChile, ir al inicio"
          className="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700"
        >
          <img src="/aquachile-logo.webp" alt="AquaChile" className="h-auto w-32 sm:w-36" />
        </a>
      </header>
      <main className="mx-auto mt-8 w-full max-w-xl sm:mt-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.24)] sm:p-10">
          <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
            <h1 className="text-center text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl">
              Solicitud de Evaluación
            </h1>
          </div>

          {message && <FormAlert type={message.type}>{message.text}</FormAlert>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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
                {FAMILIAS_CARGO.map((family) => (
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
                className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition-colors file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:border-slate-400 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
              />
            </FormField>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg bg-teal-800 px-4 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Creando expediente y carpetas...' : 'Iniciar Evaluación'}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
