# Loop de mejora — bitácora

Rama: `feat/flujo-reclutamiento-e2e`. Cada entrada: qué se hizo, cómo se verificó.

| # | Ítem | Estado | Verificación |
| --- | --- | --- | --- |
| a | Redesplegar `analyze-application` con `_shared` actual y re-analizar demo | ✅ | `node scripts/reanalyze.mjs` → 4/4 en 200; resúmenes con "Afinidad alta" y palabras clave con tildes |
| b | Separar vendor chunks (react / supabase / motion / vendor) | ✅ | `vite build` sin advertencias; código propio 24 KB; preview de producción sin errores de consola |
| c | Auditoría de accesibilidad (axe, WCAG 2.1 AA) | ✅ | `e2e/a11y.spec.js`: formulario, login, registro, panel, pipeline y detalle sin violaciones. Corregido: contraste de `muted` (#5f6779), badge sin opacidad, fundidos que respetan "reducir movimiento" |
| d | Mover etapa por teclado en el pipeline | ✅ | Selector "Mover a…" en cada tarjeta (alternativa al arrastre). `PipelineBoard.test.jsx` + E2E por teclado; captura revisada |
| e | Detalle en móvil (CV colapsable) | ⏳ | |
| f | Asignación masiva | ⏳ | |
| g | Exportar CSV | ⏳ | |
| h | Advisors de Supabase → migración | ⏳ | |
| i | Comparar dos postulantes | ⏳ | |
