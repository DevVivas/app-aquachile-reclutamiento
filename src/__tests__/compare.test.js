import { describe, expect, it } from 'vitest'
import { leadersByCriterion, parseIds, sameRole } from '@/pages/compare/compare.js'

const id = (n) => `00000000-0000-4000-8000-00000000000${n}`
const app = (n, score, breakdown, title = 'Jefe de Planta') => ({
  id: id(n),
  job_title: title,
  job_family: 'Operaciones y Logística',
  ai_score: score,
  ai_analysis: { rubric: { breakdown } },
})

describe('comparación', () => {
  it('parseIds acepta 2-3 UUID válidos, sin duplicados', () => {
    expect(parseIds(`?ids=${id(1)},${id(2)}`)).toEqual([id(1), id(2)])
    expect(parseIds(`?ids=${id(1)},${id(1)},nope,${id(2)},${id(3)},${id(4)}`)).toEqual([id(1), id(2), id(3)])
    expect(parseIds('')).toEqual([])
  })

  it('marca al líder de cada criterio, con empates y sin líder si todos son 0', () => {
    const leaders = leadersByCriterion([
      app(1, 92, { leadership: 35, experience: 20, familyMatch: 10, roleMatch: 0, education: 8 }),
      app(2, 52, { leadership: 0, experience: 20, familyMatch: 13, roleMatch: 0, education: 6 }),
    ])
    expect(leaders.total).toEqual([id(1)])
    expect(leaders.leadership).toEqual([id(1)])
    expect(leaders.experience).toEqual([id(1), id(2)])
    expect(leaders.familyMatch).toEqual([id(2)])
    expect(leaders.roleMatch).toEqual([])
  })

  it('detecta si postulan al mismo cargo', () => {
    expect(sameRole([app(1, 1, {}), app(2, 1, {}, ' jefe de planta ')])).toBe(true)
    expect(sameRole([app(1, 1, {}), app(2, 1, {}, 'Operario')])).toBe(false)
  })
})
