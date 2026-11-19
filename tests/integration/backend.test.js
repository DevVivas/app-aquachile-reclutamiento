import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { slugify } from '../../supabase/functions/_shared/validation.ts'
import { client, env, fn, RUN_ID, signedIn, submit, waitForAnalysis } from './helpers.js'

const created = []
let admin

beforeAll(async () => {
  admin = await signedIn(env('E2E_ADMIN_EMAIL'), env('E2E_ADMIN_PASSWORD'))
})

afterAll(async () => {
  for (const { id, cv_path: path } of created) {
    await admin.from('applications').delete().eq('id', id)
    if (path) await admin.storage.from('cvs').remove([path])
  }
})

async function createApplication(payload) {
  const { status, body } = await submit(payload)
  expect(status, JSON.stringify(body)).toBe(201)
  const row = await waitForAnalysis(admin, body.id)
  created.push(row)
  return { body, row }
}

describe('seguridad: un visitante anónimo', () => {
  const anon = client()

  it('no puede leer postulaciones, equipo, notas ni historial', async () => {
    for (const table of ['applications', 'profiles', 'application_notes', 'application_events']) {
      const { data } = await anon.from(table).select('id').limit(1)
      expect(data ?? [], table).toEqual([])
    }
  })

  it('no puede insertar postulaciones directamente (solo vía Edge Function)', async () => {
    const { error } = await anon.from('applications').insert({ candidate_name: 'x', job_family: 'Comercial y Ventas', job_title: 'x', cv_folder: 'x', cv_path: 'x', cv_file_name: 'x', cv_mime: 'x', cv_size: 1 })
    expect(error).not.toBeNull()
  })

  it('no puede listar ni descargar CVs del bucket privado', async () => {
    const { data } = await anon.storage.from('cvs').list('', { limit: 5 })
    expect(data ?? []).toEqual([])
    const { error } = await anon.storage.from('cvs').createSignedUrl('cualquier/cv.pdf', 60)
    expect(error).not.toBeNull()
  })

  it('no puede re-analizar CVs', async () => {
    const response = await fetch(fn('analyze-application'), { method: 'POST', body: JSON.stringify({ id: crypto.randomUUID() }) })
    expect(response.status).toBe(401)
  })
})

describe('submit-application: validación', () => {
  it('rechaza familia de cargo fuera del catálogo (422)', async () => {
    const { status, body } = await submit({ name: 'Test Familia', family: 'Hackers', title: 'Jefe' })
    expect(status).toBe(422)
    expect(body.fields.jobFamily).toBeTruthy()
  })

  it('rechaza archivos que no son PDF/Word aunque digan .pdf (415)', async () => {
    const form = new FormData()
    form.set('candidateName', 'Test Ejecutable')
    form.set('jobFamily', 'Comercial y Ventas')
    form.set('jobTitle', 'Vendedor')
    form.set('cv', new Blob([new Uint8Array([0x4d, 0x5a, 0x90, 0, 1, 2, 3])], { type: 'application/pdf' }), 'cv.pdf')
    const response = await fetch(fn('submit-application'), { method: 'POST', body: form })
    expect(response.status).toBe(415)
  })

  it('solo acepta POST', async () => {
    const response = await fetch(fn('submit-application'))
    expect(response.status).toBe(405)
  })

  it('el honeypot simula éxito pero no guarda nada', async () => {
    const name = `Bot Honeypot ${RUN_ID}`
    const { status } = await submit({ name, family: 'Comercial y Ventas', title: 'Spam', website: 'http://spam.example' })
    expect(status).toBe(201)
    const { data } = await admin.from('applications').select('id').eq('candidate_name', name)
    expect(data).toEqual([])
  })
})

describe('flujo completo: postulación → Storage → IA', () => {
  const leaderName = `IT Líder Pérez ${RUN_ID}`
  const operatorName = `IT Operaria Soto ${RUN_ID}`
  let leader
  let operator

  beforeAll(async () => {
    ;[leader, operator] = await Promise.all([
      createApplication({ name: leaderName, family: 'Operaciones y Logística', title: 'Jefe de Centro de Cultivo', file: 'cv-jefe.pdf', email: 'lider@example.com' }),
      createApplication({ name: operatorName, family: 'Operaciones y Logística', title: 'Jefe de Centro de Cultivo', file: 'cv-operaria.pdf' }),
    ])
  })

  it('guarda el CV en una carpeta con el nombre del postulante', async () => {
    const folder = slugify(leaderName)
    expect(leader.body.folder).toBe(folder)
    expect(leader.row.cv_folder).toBe(folder)
    expect(leader.row.cv_path.startsWith(`${folder}/`)).toBe(true)
    const { data: files } = await admin.storage.from('cvs').list(folder)
    expect(files.map((file) => `${folder}/${file.name}`)).toContain(leader.row.cv_path)
  })

  it('guarda los datos del formulario', () => {
    expect(leader.row).toMatchObject({
      candidate_name: leaderName,
      candidate_email: 'lider@example.com',
      job_family: 'Operaciones y Logística',
      job_title: 'Jefe de Centro de Cultivo',
      stage: 'recibido',
      assigned_to: null,
      cv_mime: 'application/pdf',
    })
  })

  it('la IA analiza el CV y premia la experiencia de jefatura para un cargo de jefe', () => {
    expect(leader.row.ai_status).toBe('done')
    expect(operator.row.ai_status).toBe('done')
    expect(leader.row.ai_summary.length).toBeGreaterThan(40)
    expect(leader.row.ai_analysis.rubric.requiresLeadership).toBe(true)
    expect(leader.row.ai_analysis.rubric.signals.leadershipEvidence.length).toBeGreaterThan(0)
    expect(operator.row.ai_analysis.rubric.signals.leadershipEvidence).toEqual([])
    expect(leader.row.ai_score).toBeGreaterThan(operator.row.ai_score)
    expect(leader.row.ai_fit).toBe('alto')
    expect(operator.row.ai_fit).not.toBe('alto')
  })

  it('extrae el texto del PDF', () => {
    expect(leader.row.cv_text).toMatch(/Jefe de Centro de Cultivo/)
  })

  it('el equipo puede ver el CV mediante URL firmada', async () => {
    const { data, error } = await admin.storage.from('cvs').createSignedUrl(leader.row.cv_path, 60)
    expect(error).toBeNull()
    const pdf = await fetch(data.signedUrl)
    expect(pdf.status).toBe(200)
    expect(new TextDecoder().decode((await pdf.arrayBuffer()).slice(0, 4))).toBe('%PDF')
  })

  it('asignar evaluador y mover de etapa queda auditado', async () => {
    const { data: team } = await admin.from('profiles').select('id, role').eq('approved', true).neq('role', 'admin').limit(1)
    const evaluator = team[0].id

    const { error: assignError } = await admin.from('applications').update({ assigned_to: evaluator }).eq('id', leader.row.id)
    expect(assignError).toBeNull()
    const { error: stageError } = await admin.from('applications').update({ stage: 'entrevista' }).eq('id', leader.row.id)
    expect(stageError).toBeNull()

    const { data: events } = await admin.from('application_events').select('type, payload').eq('application_id', leader.row.id)
    const types = events.map((event) => event.type)
    expect(types).toEqual(expect.arrayContaining(['created', 'ai_analyzed', 'assigned', 'stage_changed']))
    expect(events.find((event) => event.type === 'stage_changed').payload).toEqual({ from: 'recibido', to: 'entrevista' })
  })

  it('no se puede asignar a alguien que no es del equipo', async () => {
    const { error } = await admin.from('applications').update({ assigned_to: crypto.randomUUID() }).eq('id', leader.row.id)
    expect(error).not.toBeNull()
  })

  it('el equipo no puede alterar el puntaje IA ni los datos del postulante', async () => {
    const { error } = await admin.from('applications').update({ ai_score: 100 }).eq('id', operator.row.id)
    expect(error).not.toBeNull()
    const { error: nameError } = await admin.from('applications').update({ candidate_name: 'Hackeado' }).eq('id', operator.row.id)
    expect(nameError).not.toBeNull()
  })

  it('las notas quedan firmadas por su autor', async () => {
    const { data: me } = await admin.auth.getUser()
    const { data, error } = await admin.from('application_notes').insert({ application_id: leader.row.id, body: 'Nota de integración' }).select().single()
    expect(error).toBeNull()
    expect(data.author_id).toBe(me.user.id)
    const { error: spoofError } = await admin.from('application_notes').insert({ application_id: leader.row.id, body: 'x', author_id: crypto.randomUUID() })
    expect(spoofError).not.toBeNull()
  })

  it('analyze-application re-analiza para el equipo', async () => {
    const { data: session } = await admin.auth.getSession()
    const response = await fetch(fn('analyze-application'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: operator.row.id }),
    })
    const body = await response.json()
    expect(response.status, JSON.stringify(body)).toBe(200)
    expect(body.score).toBeGreaterThanOrEqual(0)
  })
})

describe('DOCX', () => {
  it('extrae texto de Word y lo analiza', async () => {
    const { row } = await createApplication({
      name: `IT Docx ${RUN_ID}`,
      family: 'Jefaturas y Gerencia',
      title: 'Subgerente de Operaciones',
      file: 'cv-jefe.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
    expect(row.cv_mime).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(row.cv_text).toMatch(/Supervisor de Producción/)
    expect(row.ai_status).toBe('done')
    expect(row.ai_score).toBeGreaterThan(60)
  })
})
