import { useRef, useState } from 'react'
import { submitApplication } from '@/services/applicationsService.js'
import { INITIAL_FORM_STATE, MAX_CV_MB } from '../constants.js'

const VALID_EXT = /\.(pdf|docx?)$/i

export function validateCvFile(file) {
  if (!file) return 'Adjunta tu CV.'
  if (!VALID_EXT.test(file.name)) return 'El CV debe ser PDF o Word (.doc, .docx).'
  if (file.size > MAX_CV_MB * 1024 * 1024) return `El CV no puede superar ${MAX_CV_MB} MB.`
  if (file.size === 0) return 'El archivo está vacío.'
  return null
}

export function useEvaluacionForm() {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE)
  const [website, setWebsite] = useState('') // honeypot
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitted, setSubmitted] = useState(null)
  const fileInputRef = useRef(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const selectFile = (file) => {
    if (!file) return
    const error = validateCvFile(file)
    setFieldErrors((prev) => ({ ...prev, cv: error ?? undefined }))
    setFormData((prev) => ({ ...prev, cvFile: error ? null : file }))
  }

  const handleFileChange = (e) => selectFile(e.target.files?.[0])

  const reset = () => {
    setFormData(INITIAL_FORM_STATE)
    setSubmitted(null)
    setMessage(null)
    setFieldErrors({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cvError = validateCvFile(formData.cvFile)
    if (cvError) {
      setFieldErrors((prev) => ({ ...prev, cv: cvError }))
      setMessage({ type: 'error', text: cvError })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      await submitApplication({ ...formData, website })
      setSubmitted({ name: formData.candidateName.trim().split(/\s+/)[0], jobTitle: formData.jobTitle.trim() })
      setFormData(INITIAL_FORM_STATE)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      setFieldErrors(error.fields ?? {})
      setMessage({
        type: 'error',
        text: error.fields ? 'Revisa los campos marcados.' : 'Ocurrió un error al enviar tu postulación. Intenta nuevamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  return {
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
  }
}
