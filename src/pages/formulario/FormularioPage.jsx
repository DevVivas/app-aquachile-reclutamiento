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
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Solicitud de Evaluación Psicolaboral
        </h2>
        <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">
          Ingresa los antecedentes del candidato para generar el entorno y las plantillas automáticas.
        </p>

        {message && <FormAlert type={message.type}>{message.text}</FormAlert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Nombre Completo del Candidato:">
            <input
              type="text"
              name="candidateName"
              required
              placeholder="Ej: Juan Pérez Martínez"
              value={formData.candidateName}
              onChange={handleInputChange}
              className={INPUT_CLASSNAME}
            />
          </FormField>

          <FormField label="Familia de Cargo:">
            <select
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

          <FormField label="Nombre del Cargo:">
            <input
              type="text"
              name="jobTitle"
              required
              placeholder="Ej: Analista de Procesos"
              value={formData.jobTitle}
              onChange={handleInputChange}
              className={INPUT_CLASSNAME}
            />
          </FormField>

          <FormField label="Curriculum Vitae (PDF o Word):">
            <input
              ref={fileInputRef}
              type="file"
              name="cvFile"
              required
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? 'Creando expediente y carpetas...' : 'Iniciar Evaluación'}
          </button>
        </form>
      </div>
    </div>
  )
}
