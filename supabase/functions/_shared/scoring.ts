// Rúbrica determinista de afinidad CV ↔ cargo.
// Módulo puro (sin APIs de Deno ni de Node): lo usan las Edge Functions y los tests de Vitest.

export type Fit = 'alto' | 'medio' | 'bajo'

export interface RubricBreakdown {
  leadership: number
  experience: number
  familyMatch: number
  roleMatch: number
  education: number
}

export interface RubricResult {
  score: number
  fit: Fit
  requiresLeadership: boolean
  weights: RubricBreakdown
  breakdown: RubricBreakdown
  signals: {
    leadershipEvidence: string[]
    maxTeamSize: number | null
    yearsExperience: number | null
    familyKeywords: string[]
    roleKeywords: string[]
    education: string | null
  }
}

export const JOB_FAMILIES = [
  'Operaciones y Logística',
  'Administración y Finanzas',
  'Comercial y Ventas',
  'Tecnología e Informática',
  'Jefaturas y Gerencia',
] as const

const FAMILY_KEYWORDS: Record<string, string[]> = {
  'Operaciones y Logística': [
    'logística', 'operaciones', 'producción', 'planta', 'bodega', 'inventario', 'despacho',
    'cadena de suministro', 'abastecimiento', 'transporte', 'acuicultura', 'salmón', 'centro de cultivo',
    'mantención', 'procesos', 'lean', 'calidad', 'seguridad', 'turnos', 'distribución', 'almacén',
  ],
  'Administración y Finanzas': [
    'contabilidad', 'contable', 'finanzas', 'financiero', 'presupuesto', 'tesorería', 'auditoría',
    'impuestos', 'tributario', 'IFRS', 'control de gestión', 'costos', 'Excel', 'ERP', 'SAP',
    'remuneraciones', 'administración', 'conciliación', 'facturación', 'cobranza',
  ],
  'Comercial y Ventas': [
    'ventas', 'comercial', 'clientes', 'cartera', 'negociación', 'key account', 'KAM', 'CRM',
    'exportación', 'marketing', 'retail', 'cuentas clave', 'metas', 'prospección', 'postventa',
    'licitaciones', 'mercado', 'canal',
  ],
  'Tecnología e Informática': [
    'software', 'desarrollo', 'programación', 'sistemas', 'redes', 'infraestructura', 'cloud',
    'AWS', 'Azure', 'SQL', 'Python', 'JavaScript', 'Java', 'soporte', 'ciberseguridad', 'datos',
    'Power BI', 'DevOps', 'API', 'base de datos', 'React', 'Linux',
  ],
  'Jefaturas y Gerencia': [
    'estrategia', 'estratégico', 'gestión', 'liderazgo', 'equipos', 'presupuesto', 'KPI',
    'planificación', 'directorio', 'P&L', 'gerencia', 'transformación', 'mejora continua',
    'indicadores', 'stakeholders', 'negociación',
  ],
}

// Cargos que implican dirigir personas.
const LEADERSHIP_TITLE = /\b(jef[ea]s?|jefatura|gerente|subgerente|gerencia|supervisor[a]?|coordinador[a]?|lider|encargad[oa]|director[a]?|head|manager|lead|capataz|superintendente|administrador[a]? de (centro|planta))\b/

// Evidencia de liderazgo dentro del CV.
const LEADERSHIP_EVIDENCE = [
  /\b(jef[ea]|jefatura|gerente|subgerente|supervisor[a]?|coordinador[a]?|encargad[oa]|director[a]?|head of|manager|team lead|lider de equipo|capataz|superintendente)\b/,
  /\bliderazgo\b|\blidere?\b|\blidera(ndo|r|ba)?\b/,
  /\ba cargo de\b|\bpersonal a cargo\b|\bequipo de \d+\b|\bdirigi(r|endo)?\b|\bsupervis(e|ar|ion|ando)\b/,
]

const TEAM_SIZE = /(?:a cargo de|equipo de|lider(?:ando)?(?: de)?(?: un equipo de)?|supervision de|dirigiendo a)\s+(\d{1,4})\s+(?:personas|colaboradores|trabajadores|profesionales|operarios|tecnicos|personas a cargo)/g

const STOPWORDS = new Set([
  'de', 'del', 'la', 'las', 'los', 'el', 'en', 'y', 'e', 'o', 'u', 'para', 'por', 'con', 'a', 'al',
  'un', 'una', 'area', 'cargo',
])

export function normalize(text: string): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\S\n]+/g, ' ')
}

export function requiresLeadership(jobTitle: string, jobFamily: string): boolean {
  return jobFamily === 'Jefaturas y Gerencia' || LEADERSHIP_TITLE.test(normalize(jobTitle))
}

function lines(text: string): string[] {
  return text
    .split(/\n|(?<=[.;•·])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 3)
}

export function findLeadershipEvidence(cvText: string, original = cvText): string[] {
  const norm = normalize(cvText)
  const normLines = lines(norm)
  const origLines = lines(original)
  const sameShape = normLines.length === origLines.length
  const evidence: string[] = []
  normLines.forEach((line, index) => {
    if (LEADERSHIP_EVIDENCE.some((re) => re.test(line))) {
      const source = sameShape ? origLines[index] : line
      evidence.push(source.length > 140 ? `${source.slice(0, 137)}…` : source)
    }
  })
  return [...new Set(evidence)].slice(0, 6)
}

export function maxTeamSize(cvText: string): number | null {
  const norm = normalize(cvText)
  let max: number | null = null
  for (const match of norm.matchAll(TEAM_SIZE)) {
    const size = Number(match[1])
    if (size > 0 && size < 10000) max = Math.max(max ?? 0, size)
  }
  return max
}

export function estimateYears(cvText: string, now = new Date()): number | null {
  const norm = normalize(cvText)
  const currentYear = now.getFullYear()

  const explicit = [...norm.matchAll(/(\d{1,2})\+?\s*anos de experiencia/g)].map((m) => Number(m[1]))

  const ranges: Array<[number, number]> = []
  const rangeRe = /\b((?:19|20)\d{2})\s*(?:-|–|—|a|al|hasta)\s*((?:19|20)\d{2}|actualidad|presente|actual|hoy|la fecha)\b/g
  for (const m of norm.matchAll(rangeRe)) {
    const start = Number(m[1])
    const end = /^\d+$/.test(m[2]) ? Number(m[2]) : currentYear
    if (start <= end && end <= currentYear + 1 && start >= 1960) ranges.push([start, Math.min(end, currentYear)])
  }

  let fromRanges: number | null = null
  if (ranges.length) {
    // Une intervalos solapados para no contar dos veces trabajos paralelos.
    ranges.sort((a, b) => a[0] - b[0])
    let total = 0
    let [curStart, curEnd] = ranges[0]
    for (const [start, end] of ranges.slice(1)) {
      if (start <= curEnd) curEnd = Math.max(curEnd, end)
      else {
        total += curEnd - curStart
        ;[curStart, curEnd] = [start, end]
      }
    }
    total += curEnd - curStart
    fromRanges = total
  }

  const candidates = [...explicit, ...(fromRanges !== null ? [fromRanges] : [])]
  return candidates.length ? Math.min(45, Math.max(...candidates)) : null
}

export function matchKeywords(cvText: string, keywords: string[]): string[] {
  const norm = normalize(cvText)
  return keywords.filter((kw) => new RegExp(`\\b${escapeRe(normalize(kw))}\\b`).test(norm))
}

export function titleKeywords(jobTitle: string): string[] {
  return [...new Set(
    normalize(jobTitle)
      .split(/[^a-z0-9ñ&]+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word)),
  )]
}

export function detectEducation(cvText: string): { level: string | null; score: number } {
  const norm = normalize(cvText)
  if (/\b(magister|master|mba|doctorado|phd|diplomado|postitulo|postgrado)\b/.test(norm)) return { level: 'Postgrado', score: 1 }
  if (/\b(ingenier[oa]|ingenieria|licenciad[oa]|licenciatura|universidad|universitari[oa]|contador auditor|psicolog[oa])\b/.test(norm)) {
    return { level: 'Universitaria', score: 0.8 }
  }
  if (/\b(tecnico|tecnica|instituto|cft)\b/.test(norm)) return { level: 'Técnica', score: 0.55 }
  if (/\b(enseñanza media|ensenanza media|liceo|cuarto medio)\b/.test(norm)) return { level: 'Media', score: 0.3 }
  return { level: null, score: 0.2 }
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function leadershipScore(evidence: string[], teamSize: number | null): number {
  const base = [0, 0.5, 0.75, 0.9][Math.min(evidence.length, 3)] ?? 1
  const bonus = teamSize ? (teamSize >= 20 ? 0.15 : teamSize >= 5 ? 0.1 : 0.05) : 0
  return Math.min(1, base + (evidence.length >= 4 ? 0.1 : 0) + bonus)
}

function experienceScore(years: number | null): number {
  if (years === null) return 0.3
  if (years < 1) return 0.15
  if (years < 3) return 0.4
  if (years < 6) return 0.7
  if (years < 10) return 0.9
  return 1
}

export const FIT_LABEL: Record<Fit, string> = { alto: 'alta', medio: 'media', bajo: 'baja' }

export function fitFor(score: number): Fit {
  if (score >= 70) return 'alto'
  if (score >= 45) return 'medio'
  return 'bajo'
}

const WEIGHTS_LEADERSHIP: RubricBreakdown = { leadership: 35, experience: 20, familyMatch: 20, roleMatch: 15, education: 10 }
const WEIGHTS_INDIVIDUAL: RubricBreakdown = { leadership: 10, experience: 25, familyMatch: 30, roleMatch: 20, education: 15 }

export function scoreCv(input: { cvText: string; jobTitle: string; jobFamily: string; now?: Date }): RubricResult {
  const { cvText, jobTitle, jobFamily } = input
  const needsLeadership = requiresLeadership(jobTitle, jobFamily)
  const weights = needsLeadership ? WEIGHTS_LEADERSHIP : WEIGHTS_INDIVIDUAL

  const evidence = findLeadershipEvidence(cvText)
  const teamSize = maxTeamSize(cvText)
  const years = estimateYears(cvText, input.now)
  const familyList = FAMILY_KEYWORDS[jobFamily] ?? []
  const familyKeywords = matchKeywords(cvText, familyList)
  const roleTokens = titleKeywords(jobTitle)
  const roleKeywords = matchKeywords(cvText, roleTokens)
  const education = detectEducation(cvText)

  const parts: RubricBreakdown = {
    leadership: leadershipScore(evidence, teamSize),
    experience: experienceScore(years),
    familyMatch: familyList.length ? Math.min(1, familyKeywords.length / 6) : 0.5,
    roleMatch: roleTokens.length ? roleKeywords.length / roleTokens.length : 0.5,
    education: education.score,
  }

  const breakdown = Object.fromEntries(
    Object.entries(parts).map(([key, value]) => [key, Math.round(value * weights[key as keyof RubricBreakdown])]),
  ) as unknown as RubricBreakdown

  let score = Object.values(breakdown).reduce((sum, value) => sum + value, 0)
  // Un cargo de jefatura sin ninguna evidencia de liderazgo no puede quedar como afinidad alta.
  if (needsLeadership && evidence.length === 0) score = Math.min(score, 55)
  // Perfil de otra área: sin afinidad con la familia ni con el cargo.
  if (familyKeywords.length === 0 && roleKeywords.length === 0) score = Math.min(score, 40)
  if (!cvText || cvText.trim().length < 80) score = Math.min(score, 25)
  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    score,
    fit: fitFor(score),
    requiresLeadership: needsLeadership,
    weights,
    breakdown,
    signals: {
      leadershipEvidence: evidence,
      maxTeamSize: teamSize,
      yearsExperience: years,
      familyKeywords,
      roleKeywords,
      education: education.level,
    },
  }
}

// Resumen redactado sin LLM, a partir de la rúbrica (respaldo cuando no hay API key o falla el modelo).
export function heuristicSummary(rubric: RubricResult, jobTitle: string) {
  const { signals, requiresLeadership: needsLeadership } = rubric
  const strengths: string[] = []
  const concerns: string[] = []

  if (signals.yearsExperience !== null) {
    const y = signals.yearsExperience
    ;(y >= 3 ? strengths : concerns).push(`~${y} ${y === 1 ? 'año' : 'años'} de experiencia laboral detectada`)
  } else {
    concerns.push('No se pudo estimar los años de experiencia')
  }

  if (signals.leadershipEvidence.length) {
    strengths.push(
      `Experiencia de liderazgo${signals.maxTeamSize ? ` (equipos de hasta ${signals.maxTeamSize} personas)` : ''}`,
    )
  } else if (needsLeadership) {
    concerns.push('El cargo exige liderazgo y el CV no muestra jefaturas ni personas a cargo')
  }

  if (signals.familyKeywords.length >= 3) strengths.push(`Conocimientos afines: ${signals.familyKeywords.slice(0, 5).join(', ')}`)
  else concerns.push('Poca afinidad explícita con la familia de cargo')

  if (signals.roleKeywords.length) strengths.push(`Menciona el rol buscado (${signals.roleKeywords.join(', ')})`)
  if (signals.education) strengths.push(`Formación ${signals.education.toLowerCase()}`)
  else concerns.push('No se identifica formación académica')

  const leadershipText = needsLeadership
    ? signals.leadershipEvidence.length
      ? 'Cuenta con experiencia previa en roles de jefatura o supervisión, clave para este cargo.'
      : 'No registra roles de jefatura, lo que resta puntos para un cargo de liderazgo.'
    : ''

  const summary = [
    `Afinidad ${FIT_LABEL[rubric.fit]} (${rubric.score}/100) con el cargo "${jobTitle}".`,
    signals.yearsExperience !== null ? `Experiencia estimada de ${signals.yearsExperience} años.` : '',
    leadershipText,
    signals.familyKeywords.length ? `Áreas afines: ${signals.familyKeywords.slice(0, 4).join(', ')}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  const recommendation =
    rubric.fit === 'alto'
      ? 'Avanzar a entrevista'
      : rubric.fit === 'medio'
        ? 'Revisar CV en detalle antes de avanzar'
        : 'Baja prioridad para este cargo'

  return { summary, strengths, concerns, recommendation }
}
