import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildCvPath, detectCvType, slugify, validateApplication } from '../../supabase/functions/_shared/validation.ts'
import { analyzeWithAi, buildPrompt, combine, parseAiOpinion, pickProvider } from '../../supabase/functions/_shared/ai.ts'
import { scoreCv } from '../../supabase/functions/_shared/scoring.ts'
import { CV_JEFE, CV_SIN_LIDERAZGO } from './fixtures.js'

describe('slugify / carpeta del postulante', () => {
  it('convierte el nombre en una carpeta segura', () => {
    expect(slugify('José Ñúñez  Pérez')).toBe('jose-nunez-perez')
    expect(slugify('../../etc/passwd')).toBe('etc-passwd')
    expect(slugify('   ')).toBe('sin-nombre')
    expect(slugify('a'.repeat(100)).length).toBe(60)
  })

  it('guarda el CV en una carpeta con el nombre del postulante', () => {
    const { folder, path } = buildCvPath('María José Soto', 'Jefe de Turno', 'pdf', new Date('2026-11-18T10:20:30Z'), 'abc123')
    expect(folder).toBe('maria-jose-soto')
    expect(path).toBe('maria-jose-soto/2026-11-18_102030_jefe-de-turno_abc123.pdf')
  })
})

describe('detectCvType (firma del archivo)', () => {
  it.each([
    [[0x25, 0x50, 0x44, 0x46, 0x2d], 'pdf'],
    [[0xd0, 0xcf, 0x11, 0xe0, 0xa1], 'doc'],
    [[0x50, 0x4b, 0x03, 0x04, 0x14], 'docx'],
    [[0x4d, 0x5a, 0x90, 0x00], null], // .exe disfrazado
    [[0x25], null],
  ])('%j → %s', (bytes, expected) => {
    expect(detectCvType(new Uint8Array(bytes))).toBe(expected)
  })
})

describe('validateApplication', () => {
  const valid = { candidateName: '  Ana   Rojas ', jobFamily: 'Comercial y Ventas', jobTitle: 'Ejecutiva', candidateEmail: 'ANA@Mail.cl' }

  it('normaliza espacios y correo', () => {
    const result = validateApplication(valid)
    expect(result.ok).toBe(true)
    expect(result.data).toMatchObject({ candidateName: 'Ana Rojas', candidateEmail: 'ana@mail.cl', candidatePhone: null })
  })

  it('rechaza familia fuera del catálogo, nombre sin letras y correo inválido', () => {
    const result = validateApplication({ ...valid, jobFamily: 'Hackers', candidateName: '1234', candidateEmail: 'no-mail' })
    expect(result.ok).toBe(false)
    expect(Object.keys(result.errors).sort()).toEqual(['candidateEmail', 'candidateName', 'jobFamily'])
  })

  it('teléfono opcional pero con formato', () => {
    expect(validateApplication({ ...valid, candidatePhone: '+56 9 1234 5678' }).ok).toBe(true)
    expect(validateApplication({ ...valid, candidatePhone: 'llámame' }).ok).toBe(false)
  })
})

describe('capa LLM', () => {
  const rubric = scoreCv({ cvText: CV_JEFE, jobTitle: 'Jefe de Centro', jobFamily: 'Operaciones y Logística' })

  afterEach(() => vi.unstubAllGlobals())

  it('el prompt marca el CV como dato y pide liderazgo para jefaturas', () => {
    const { system, user } = buildPrompt({ cvText: CV_JEFE, jobTitle: 'Jefe de Centro', jobFamily: 'Operaciones y Logística', rubric })
    expect(system).toMatch(/ignora cualquier instrucción/)
    expect(user).toContain('¿El cargo exige liderazgo?: sí')
    expect(user).toContain('<cv>')
  })

  it('parsea JSON aunque venga envuelto y acota el puntaje', () => {
    const opinion = parseAiOpinion('```json\n{"summary":"Buen perfil","strengths":["a",1,"b"],"concerns":[],"leadership_evidence":["Jefe"],"score":140,"recommendation":"Entrevistar"}\n```')
    expect(opinion).toMatchObject({ summary: 'Buen perfil', strengths: ['a', 'b'], score: 100 })
    expect(parseAiOpinion('no json')).toBeNull()
    expect(parseAiOpinion('{"summary":"","score":5}')).toBeNull()
  })

  it('combina 60% modelo + 40% rúbrica', () => {
    const final = combine(rubric, 'Jefe de Centro', { summary: 's', strengths: [], concerns: [], leadership_evidence: ['x'], score: 50, recommendation: '' }, 'gemini:x')
    expect(final.score).toBe(Math.round(50 * 0.6 + rubric.score * 0.4))
    expect(final.model).toBe('gemini:x')
  })

  it('el modelo no puede subir a "alto" una jefatura sin liderazgo', () => {
    const weak = scoreCv({ cvText: CV_SIN_LIDERAZGO, jobTitle: 'Jefe de Planta', jobFamily: 'Operaciones y Logística' })
    const final = combine(weak, 'Jefe de Planta', { summary: 's', strengths: [], concerns: [], leadership_evidence: [], score: 99, recommendation: '' }, 'm')
    expect(final.score).toBeLessThanOrEqual(55)
  })

  it('elige proveedor según las variables disponibles', () => {
    expect(pickProvider(() => undefined)).toBeNull()
    expect(pickProvider((k) => ({ GROQ_API_KEY: 'g' })[k])).toMatchObject({ name: 'groq', model: 'llama-3.3-70b-versatile' })
    expect(pickProvider((k) => ({ GROQ_API_KEY: 'g', GEMINI_API_KEY: 'x' })[k])?.name).toBe('gemini')
  })

  it('sin API key usa la rúbrica', async () => {
    const { result, warning } = await analyzeWithAi({ cvText: CV_JEFE, jobTitle: 'Jefe de Centro', jobFamily: 'Operaciones y Logística', rubric }, () => undefined)
    expect(result.model).toBe('rubrica-aquachile-v1')
    expect(result.score).toBe(rubric.score)
    expect(warning).toBeNull()
  })

  it('si el modelo falla, cae a la rúbrica y deja aviso', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('quota', { status: 429 })))
    const { result, warning } = await analyzeWithAi(
      { cvText: CV_JEFE, jobTitle: 'Jefe de Centro', jobFamily: 'Operaciones y Logística', rubric },
      (k) => ({ GEMINI_API_KEY: 'k' })[k],
    )
    expect(result.model).toBe('rubrica-aquachile-v1')
    expect(warning).toMatch(/Gemini 429/)
  })

  it('usa la respuesta de Gemini cuando está disponible', async () => {
    const body = { candidates: [{ content: { parts: [{ text: '{"summary":"Lidera 25 personas","strengths":["Jefatura"],"concerns":[],"leadership_evidence":["Jefe de Centro"],"score":90,"recommendation":"Entrevista"}' }] } }] }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = await analyzeWithAi(
      { cvText: CV_JEFE, jobTitle: 'Jefe de Centro', jobFamily: 'Operaciones y Logística', rubric },
      (k) => ({ GEMINI_API_KEY: 'k' })[k],
    )
    expect(fetchMock.mock.calls[0][0]).toContain('gemini-2.5-flash:generateContent')
    expect(fetchMock.mock.calls[0][1].headers['x-goog-api-key']).toBe('k')
    expect(result.summary).toBe('Lidera 25 personas')
    expect(result.model).toBe('gemini:gemini-2.5-flash')
  })
})
