import { useRef, useState } from 'react'
import { iniciarEvaluacion } from '@/services/evaluacionesService.js'
import { INITIAL_FORM_STATE } from '../constants.js'

export function useEvaluacionForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData((prev) => ({ ...prev, cvFile: file }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.cvFile) {
      setMessage({ type: 'error', text: 'Por favor, adjunta el CV del candidato.' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      await iniciarEvaluacion(formData)

      setMessage({
        type: 'success',
        text: 'Solicitud enviada correctamente. Se ha creado la carpeta y las plantillas asociadas.',
      })

      setFormData(INITIAL_FORM_STATE)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Ocurrió un error al enviar la evaluación. Intenta nuevamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    formData,
    loading,
    message,
    fileInputRef,
    handleInputChange,
    handleFileChange,
    handleSubmit,
  }
}
