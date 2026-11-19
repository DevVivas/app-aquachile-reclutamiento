import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: Number(env.PORT) || 5173 },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.js'],
      include: ['src/**/*.test.{js,jsx}', 'tests/unit/**/*.test.{js,ts}'],
      css: false,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,jsx}', 'supabase/functions/_shared/{scoring,validation,ai}.ts'],
        exclude: ['src/main.jsx', 'src/**/*.test.{js,jsx}'],
      },
    },
  }
})
