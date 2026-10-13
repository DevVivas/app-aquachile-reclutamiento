if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config')
}

const requiredEnvironmentVariables = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]

for (const variable of requiredEnvironmentVariables) {
  if (!process.env[variable]) {
    throw new Error(`Falta la variable de entorno ${variable}`)
  }
}

export const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  port: Number(process.env.PORT || 3000),
  cvBucket: process.env.CV_BUCKET || 'cvs',
}

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error('PORT debe ser un puerto válido')
}
