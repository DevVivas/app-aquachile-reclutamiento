import { useRef, useState } from 'react'
import { iniciarEvaluacion } from '@/services/evaluacionesService.js'
import {
  capitalizeJobTitle,
  capitalizeName,
  INITIAL_FORM_STATE,
  validateCandidateName,
  validateJobTitle,
} from '../constants.js'

export function useEvaluacionForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const normalizedValue =
      name === 'candidateName'
        ? capitalizeName(value)
        : name === 'jobTitle'
          ? capitalizeJobTitle(value)
          : value

    setFormData((prev) => ({ ...prev, [name]: normalizedValue }))
  }

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData((prev) => ({ ...prev, cvFile: file }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)

    const nameError = validateCandidateName(formData.candidateName)
    const titleError = validateJobTitle(formData.jobTitle)
    if (nameError || titleError) {
      return
    }

    if (!formData.jobFamily || !formData.cvFile) {
      setMessage({
        type: 'error',
        text: 'Completa todos los campos y adjunta el CV del candidato.',
      })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      await iniciarEvaluacion(formData)

      setSuccess(true)
      setFormData(INITIAL_FORM_STATE)
      setTouched({})
      setSubmitted(false)
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
    success,
    fileInputRef,
    handleInputChange,
    handleBlur,
    handleFileChange,
    handleSubmit,
    closeSuccess: () => setSuccess(false),
    validationErrors: {
      candidateName:
        touched.candidateName || submitted
          ? validateCandidateName(formData.candidateName)
          : '',
      jobTitle:
        touched.jobTitle || submitted
          ? validateJobTitle(formData.jobTitle)
          : '',
    },
  }
}
