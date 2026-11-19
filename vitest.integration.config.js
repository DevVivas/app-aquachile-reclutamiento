import { defineConfig, loadEnv } from 'vite'

// Tests contra el proyecto Supabase real (RLS, Storage, Edge Functions, IA).
// Requiere VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD.
export default defineConfig(({ mode }) => ({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.js'],
    testTimeout: 90_000,
    hookTimeout: 90_000,
    fileParallelism: false,
    env: { ...loadEnv(mode, process.cwd(), ''), ...process.env },
  },
}))
