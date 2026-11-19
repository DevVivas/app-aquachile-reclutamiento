import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results', '.pw', 'supabase/functions']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Configuración, scripts y tests corren en Node.
    files: ['*.config.js', 'scripts/**', 'e2e/**', 'tests/**', 'src/**/*.test.{js,jsx}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
])
