import { STAGE_BY_VALUE } from '@/constants/pipeline.js'

// Excel en es-CL usa ";" como separador. El BOM hace que abra bien las tildes.
const SEPARATOR = ';'
const BOM = '﻿'

/**
 * Escapa una celda. Las que empiezan con = + - @ (o tab/CR) se prefijan con ' para que
 * Excel no las ejecute como fórmula (inyección CSV: el nombre lo escribe el postulante).
 */
export function csvCell(value) {
  let text = value == null ? '' : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function applicationsToCsv(applications, team) {
  const nameById = Object.fromEntries(team.map((member) => [member.id, member.full_name]))
  const header = ['Postulante', 'Correo', 'Cargo', 'Familia de cargo', 'Etapa', 'Puntaje IA', 'Afinidad IA', 'Responsable', 'Recibido']
  const rows = applications.map((app) => [
    app.candidate_name,
    app.candidate_email ?? '',
    app.job_title,
    app.job_family,
    STAGE_BY_VALUE[app.stage]?.label ?? app.stage,
    app.ai_score ?? '',
    app.ai_fit ?? '',
    nameById[app.assigned_to] ?? '',
    app.created_at?.slice(0, 10) ?? '',
  ])
  return BOM + [header, ...rows].map((row) => row.map(csvCell).join(SEPARATOR)).join('\r\n')
}

export function downloadCsv(content, fileName) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: fileName })
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
