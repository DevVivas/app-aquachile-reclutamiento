import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

export const env = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`Falta la variable ${name} para los tests de integración`)
  return value
}

export const URL = () => env('VITE_SUPABASE_URL')
export const fn = (name) => `${URL()}/functions/v1/${name}`

export function client() {
  return createClient(URL(), env('VITE_SUPABASE_ANON_KEY'), { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function signedIn(email, password) {
  const supabase = client()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Login falló para ${email}: ${error.message}`)
  return supabase
}

export const fixture = (name) => readFileSync(new globalThis.URL(`../fixtures/${name}`, import.meta.url))

export async function submit({ name, family, title, file = 'cv-jefe.pdf', type = 'application/pdf', email = '', website = '' }) {
  const form = new FormData()
  form.set('candidateName', name)
  form.set('candidateEmail', email)
  form.set('jobFamily', family)
  form.set('jobTitle', title)
  form.set('website', website)
  form.set('cv', new Blob([fixture(file)], { type }), file)
  const response = await fetch(fn('submit-application'), { method: 'POST', body: form })
  return { status: response.status, body: await response.json().catch(() => ({})) }
}

export async function waitForAnalysis(supabase, id, timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const { data } = await supabase.from('applications').select('*').eq('id', id).single()
    if (data && ['done', 'error'].includes(data.ai_status)) return data
    await new Promise((resolve) => setTimeout(resolve, 1500))
  }
  throw new Error(`El análisis de ${id} no terminó en ${timeoutMs} ms`)
}

export const RUN_ID = `${Date.now().toString(36)}`
