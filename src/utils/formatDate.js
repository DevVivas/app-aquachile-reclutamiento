const dateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

// Recibe una fecha ISO (YYYY-MM-DD) y la muestra como "29 sept 2026"
export function formatDate(isoDate) {
  return dateFormatter.format(new Date(`${isoDate}T12:00:00`))
}
