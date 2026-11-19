// Re-analiza con IA todas las postulaciones (útil al cambiar la rúbrica o activar el LLM).
// Uso: node scripts/reanalyze.mjs   (lee VITE_SUPABASE_* y E2E_ADMIN_* de .env.local)
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'

const env = { ...loadEnv('', process.cwd(), ''), ...process.env }
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const { error } = await supabase.auth.signInWithPassword({ email: env.E2E_ADMIN_EMAIL, password: env.E2E_ADMIN_PASSWORD })
if (error) throw error
const { data: { session } } = await supabase.auth.getSession()
const { data: apps } = await supabase.from('applications').select('id, candidate_name').order('created_at')

for (const app of apps) {
  const response = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/analyze-application`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: app.id }),
  })
  const body = await response.json()
  console.log(response.status, app.candidate_name, '→', body.score ?? body.error, body.model ?? '')
}
