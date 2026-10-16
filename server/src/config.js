if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config')
}

const requiredEnvironmentVariables = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
]

for (const variable of requiredEnvironmentVariables) {
  if (!process.env[variable]) {
    throw new Error(`Falta la variable de entorno ${variable}`)
  }
}

const isProduction = process.env.NODE_ENV === 'production'
const trustProxyRaw = process.env.TRUST_PROXY ?? '1'

export const config = {
  supabaseUrl: process.env.SUPABASE_URL.replace(/\/+$/, ''),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  port: Number(process.env.PORT || 3000),
  cvBucket: process.env.CV_BUCKET || 'cvs',
  templatesBucket: process.env.TEMPLATES_BUCKET || 'plantillas',
  // Si se define, Express también sirve la SPA compilada desde esa carpeta (modo Render).
  staticDir: process.env.STATIC_DIR || null,
  // Saltos de proxy confiables para calcular request.ip (0 = ninguno).
  trustProxy: /^\d+$/.test(trustProxyRaw) ? Number(trustProxyRaw) : trustProxyRaw === 'true',
  // Cookies Secure por defecto en producción; ponlo en false solo para http local.
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction,
}

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error('PORT debe ser un puerto válido')
}
