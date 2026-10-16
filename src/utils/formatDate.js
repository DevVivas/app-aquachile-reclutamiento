const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDate(isoDate) {
  return dateFormatter.format(new Date(`${isoDate}T12:00:00Z`))
}
