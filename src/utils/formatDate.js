const formatoFecha = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })
const formatoFechaHora = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})
const relativa = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' })

const toDate = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value))

/** "18 nov 2026" — acepta "AAAA-MM-DD" o timestamp ISO. */
export function fechaFormato(value) {
  return formatoFecha.format(toDate(value))
}

export function fechaHoraFormato(value) {
  return formatoFechaHora.format(toDate(value))
}

/** "hace 5 minutos", "ayer"… */
export function haceCuanto(value, now = new Date()) {
  const seconds = Math.round((toDate(value) - now) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativa.format(Math.round(seconds / size), unit)
  }
  return 'recién'
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
