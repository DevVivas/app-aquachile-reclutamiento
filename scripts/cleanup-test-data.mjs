// Borra SOLO datos creados por los tests: postulaciones cuyo nombre empieza con "E2E " o "IT ",
// junto con sus CV en Storage. Uso: node scripts/cleanup-test-data.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'

const env = { ...loadEnv('', process.cwd(), ''), ...process.env }
const dryRun = process.argv.includes('--dry-run')
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const { error } = await supabase.auth.signInWithPassword({ email: env.E2E_ADMIN_EMAIL, password: env.E2E_ADMIN_PASSWORD })
if (error) throw error

const { data, error: listError } = await supabase
  .from('applications')
  .select('id, candidate_name, cv_path')
  .or('candidate_name.like.E2E %,candidate_name.like.IT %')
if (listError) throw listError

for (const row of data) {
  console.log(dryRun ? '[dry-run]' : 'borrando', row.candidate_name)
  if (dryRun) continue
  await supabase.from('applications').delete().eq('id', row.id)
  await supabase.storage.from('cvs').remove([row.cv_path])
}
console.log(`${data.length} postulaciones de prueba ${dryRun ? 'encontradas' : 'eliminadas'}`)
