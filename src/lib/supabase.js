import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (ver .env.example).')
}

export const supabase = createClient(SUPABASE_URL ?? 'http://localhost', SUPABASE_KEY ?? 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true },
})

export const functionsUrl = (name) => `${SUPABASE_URL}/functions/v1/${name}`
