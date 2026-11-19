import { describe, expect, it } from 'vitest'
import {
  detectEducation,
  estimateYears,
  findLeadershipEvidence,
  fitFor,
  heuristicSummary,
  maxTeamSize,
  normalize,
  requiresLeadership,
  scoreCv,
  titleKeywords,
} from '../../supabase/functions/_shared/scoring.ts'
import { CV_DEV, CV_JEFE, CV_SIN_LIDERAZGO } from './fixtures.js'

const NOW = new Date('2026-11-18T12:00:00Z')

describe('normalize', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalize('Jefe de Producción ÑANDÚ')).toBe('jefe de produccion nandu')
  })
})

describe('requiresLeadership', () => {
  it.each([
    ['Jefe de Centro', 'Operaciones y Logística', true],
    ['Jefa de Turno', 'Operaciones y Logística', true],
    ['Supervisor de Planta', 'Operaciones y Logística', true],
    ['Coordinadora Comercial', 'Comercial y Ventas', true],
    ['Analista de Procesos', 'Jefaturas y Gerencia', true],
    ['Analista contable', 'Administración y Finanzas', false],
    ['Operario de planta', 'Operaciones y Logística', false],
  ])('%s / %s → %s', (title, family, expected) => {
    expect(requiresLeadership(title, family)).toBe(expected)
  })
})

describe('señales del CV', () => {
  it('encuentra evidencia de liderazgo y tamaño de equipo', () => {
    const evidence = findLeadershipEvidence(CV_JEFE)
    expect(evidence.length).toBeGreaterThanOrEqual(2)
    expect(evidence.some((line) => line.includes('Jefe de Centro'))).toBe(true)
    expect(maxTeamSize(CV_JEFE)).toBe(25)
  })

  it('no inventa liderazgo donde no lo hay', () => {
    expect(findLeadershipEvidence(CV_SIN_LIDERAZGO)).toEqual([])
    expect(maxTeamSize(CV_SIN_LIDERAZGO)).toBeNull()
  })

  it('estima años uniendo rangos y "actualidad"', () => {
    expect(estimateYears(CV_JEFE, NOW)).toBe(15) // 2011 → 2026
    expect(estimateYears(CV_SIN_LIDERAZGO, NOW)).toBe(6) // 2018 → 2024
    expect(estimateYears('Cuento con 8 años de experiencia en ventas', NOW)).toBe(8)
    expect(estimateYears('sin fechas', NOW)).toBeNull()
  })

  it('no suma dos veces trabajos que se solapan', () => {
    expect(estimateYears('2010 - 2015 empresa A. 2012 - 2014 empresa B.', NOW)).toBe(5)
  })

  it('detecta nivel educacional', () => {
    expect(detectEducation(CV_JEFE).level).toBe('Postgrado')
    expect(detectEducation(CV_SIN_LIDERAZGO).level).toBe('Técnica')
    expect(detectEducation(CV_DEV).level).toBe('Universitaria')
    expect(detectEducation('hola').level).toBeNull()
  })

  it('extrae palabras clave del cargo sin stopwords', () => {
    expect(titleKeywords('Jefe de Centro de Cultivo')).toEqual(['jefe', 'centro', 'cultivo'])
  })
})

describe('scoreCv — jefatura premia liderazgo', () => {
  const jobTitle = 'Jefe de Centro de Cultivo'
  const jobFamily = 'Operaciones y Logística'

  it('un CV con jefaturas previas puntúa alto', () => {
    const result = scoreCv({ cvText: CV_JEFE, jobTitle, jobFamily, now: NOW })
    expect(result.requiresLeadership).toBe(true)
    expect(result.fit).toBe('alto')
    expect(result.score).toBeGreaterThanOrEqual(70)
    expect(result.breakdown.leadership).toBeGreaterThan(25)
  })

  it('un CV sin liderazgo puntúa menos y nunca "alto"', () => {
    const lider = scoreCv({ cvText: CV_JEFE, jobTitle, jobFamily, now: NOW })
    const sin = scoreCv({ cvText: CV_SIN_LIDERAZGO, jobTitle, jobFamily, now: NOW })
    expect(sin.score).toBeLessThan(lider.score - 20)
    expect(sin.score).toBeLessThanOrEqual(55)
    expect(sin.fit).not.toBe('alto')
    expect(sin.breakdown.leadership).toBe(0)
  })

  it('para un cargo sin jefatura el liderazgo pesa poco', () => {
    const result = scoreCv({ cvText: CV_SIN_LIDERAZGO, jobTitle: 'Operaria de planta', jobFamily, now: NOW })
    expect(result.requiresLeadership).toBe(false)
    expect(result.weights.leadership).toBe(10)
    expect(result.score).toBeGreaterThan(scoreCv({ cvText: CV_SIN_LIDERAZGO, jobTitle, jobFamily, now: NOW }).score)
  })

  it('familia equivocada baja la afinidad', () => {
    const dev = scoreCv({ cvText: CV_DEV, jobTitle: 'Desarrollador de software', jobFamily: 'Tecnología e Informática', now: NOW })
    const devEnVentas = scoreCv({ cvText: CV_DEV, jobTitle: 'Ejecutivo de ventas', jobFamily: 'Comercial y Ventas', now: NOW })
    expect(dev.score).toBeGreaterThan(devEnVentas.score)
  })

  it('un perfil de otra área (TI para jefe de centro) queda en baja afinidad', () => {
    const result = scoreCv({ cvText: CV_DEV, jobTitle, jobFamily, now: NOW })
    expect(result.score).toBeLessThanOrEqual(40)
    expect(result.fit).toBe('bajo')
  })

  it('CV vacío o ilegible queda en baja afinidad', () => {
    const result = scoreCv({ cvText: '', jobTitle, jobFamily, now: NOW })
    expect(result.score).toBeLessThanOrEqual(25)
    expect(result.fit).toBe('bajo')
  })

  it('el puntaje siempre está entre 0 y 100 y es la suma del desglose (salvo topes)', () => {
    const result = scoreCv({ cvText: CV_JEFE, jobTitle, jobFamily, now: NOW })
    const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0)
    expect(result.score).toBe(Math.min(100, sum))
  })
})

describe('fitFor y resumen heurístico', () => {
  it('umbrales', () => {
    expect(fitFor(70)).toBe('alto')
    expect(fitFor(69)).toBe('medio')
    expect(fitFor(45)).toBe('medio')
    expect(fitFor(44)).toBe('bajo')
  })

  it('explica la falta de liderazgo para una jefatura', () => {
    const rubric = scoreCv({ cvText: CV_SIN_LIDERAZGO, jobTitle: 'Jefe de Planta', jobFamily: 'Operaciones y Logística', now: NOW })
    const summary = heuristicSummary(rubric, 'Jefe de Planta')
    expect(summary.summary).toContain('No registra roles de jefatura')
    expect(summary.concerns.join(' ')).toMatch(/exige liderazgo/)
  })
})

describe('palabras clave con tildes', () => {
  it('coinciden con texto sin tildes y se muestran con su forma correcta', () => {
    const result = scoreCv({ cvText: 'Experiencia en logistica y produccion de salmon en planta. '.repeat(3), jobTitle: 'Operario', jobFamily: 'Operaciones y Logística', now: NOW })
    expect(result.signals.familyKeywords).toEqual(expect.arrayContaining(['logística', 'producción', 'salmón', 'planta']))
  })
})
