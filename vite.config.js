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
    build: {
      rolldownOptions: {
        output: {
          // Librerías estables en chunks propios: mejor caché entre despliegues
          // y el formulario público no arrastra código del panel.
          codeSplitting: {
            groups: [
              { name: 'react', test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/, priority: 30 },
              { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/, priority: 20 },
              { name: 'motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/, priority: 20 },
              { name: 'vendor', test: /node_modules[\\/]/, priority: 10 },
            ],
          },
        },
      },
    },
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
