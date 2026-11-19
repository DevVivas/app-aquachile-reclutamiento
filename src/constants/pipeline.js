// Etapas del proceso de selección (mismo orden y valores que el CHECK de la tabla applications).
export const STAGES = [
  { value: 'recibido', label: 'Recibido', short: 'Recibido', tone: 'slate' },
  { value: 'revision_cv', label: 'Revisión de CV', short: 'Revisión CV', tone: 'blue' },
  { value: 'entrevista', label: 'Entrevista', short: 'Entrevista', tone: 'violet' },
  { value: 'evaluacion_psicolaboral', label: 'Evaluación psicolaboral', short: 'Ev. psicolaboral', tone: 'amber' },
  { value: 'oferta', label: 'Oferta', short: 'Oferta', tone: 'teal' },
  { value: 'contratado', label: 'Contratado', short: 'Contratado', tone: 'green' },
  { value: 'descartado', label: 'Descartado', short: 'Descartado', tone: 'red' },
]

export const STAGE_BY_VALUE = Object.fromEntries(STAGES.map((stage) => [stage.value, stage]))

// Etapas activas (avanzan en orden); "descartado" se aplica desde cualquier etapa.
export const ACTIVE_STAGES = STAGES.filter((stage) => stage.value !== 'descartado')

export function nextStage(value) {
  const index = ACTIVE_STAGES.findIndex((stage) => stage.value === value)
  return index >= 0 && index < ACTIVE_STAGES.length - 1 ? ACTIVE_STAGES[index + 1] : null
}

export const ROLES = {
  admin: 'Administrador',
  reclutador: 'Reclutador/a',
  rrhh: 'RR.HH.',
  psicologo: 'Psicólogo/a laboral',
}

export const SIGNUP_ROLES = ['reclutador', 'rrhh', 'psicologo']

export const FIT = {
  alto: { label: 'Afinidad alta', tone: 'green' },
  medio: { label: 'Afinidad media', tone: 'amber' },
  bajo: { label: 'Afinidad baja', tone: 'red' },
}

export const JOB_FAMILIES = [
  'Operaciones y Logística',
  'Administración y Finanzas',
  'Comercial y Ventas',
  'Tecnología e Informática',
  'Jefaturas y Gerencia',
]
