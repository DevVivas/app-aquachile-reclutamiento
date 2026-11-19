// POST { id } — re-ejecuta el análisis IA de una postulación. Solo equipo aprobado.
import { analyzeApplication } from '../_shared/analyze.ts'
import { adminClient, corsHeaders, json, userClient } from '../_shared/http.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, { error: 'Método no permitido' }, 405)

  const client = userClient(req)
  const { data: userData } = await client.auth.getUser()
  if (!userData?.user) return json(req, { error: 'No autenticado' }, 401)
  const { data: isStaff } = await client.rpc('is_staff')
  if (!isStaff) return json(req, { error: 'Sin permisos' }, 403)

  const body = await req.json().catch(() => ({}))
  const id = typeof body?.id === 'string' ? body.id : ''
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json(req, { error: 'id inválido' }, 400)

  try {
    const result = await analyzeApplication(adminClient(), id)
    return json(req, { id, score: result.score, fit: result.fit, model: result.model })
  } catch (err) {
    return json(req, { error: (err as Error).message }, 500)
  }
})
