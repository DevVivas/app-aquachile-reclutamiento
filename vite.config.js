import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  // Opcional: define VITE_API_PROXY_TARGET en .env.local (ej. http://localhost:8000)
  // para que /api/* llegue al backend durante el desarrollo.
  const apiTarget = env.VITE_API_PROXY_TARGET

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: apiTarget
      ? { proxy: { '/api': { target: apiTarget, changeOrigin: true } } }
      : undefined,
  }
})
