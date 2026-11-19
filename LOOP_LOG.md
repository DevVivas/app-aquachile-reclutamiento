# Loop de mejora — bitácora

Rama: `feat/flujo-reclutamiento-e2e`. Cada entrada: qué se hizo, cómo se verificó.

| # | Ítem | Estado | Verificación |
| --- | --- | --- | --- |
| a | Redesplegar `analyze-application` con `_shared` actual y re-analizar demo | ✅ | `node scripts/reanalyze.mjs` → 4/4 en 200; resúmenes con "Afinidad alta" y palabras clave con tildes |
| b | Separar vendor chunks (react / supabase / motion / vendor) | ✅ | `vite build` sin advertencias; código propio 24 KB; preview de producción sin errores de consola |
| c | Auditoría de accesibilidad (axe, WCAG 2.1 AA) | ✅ | `e2e/a11y.spec.js`: formulario, login, registro, panel, pipeline y detalle sin violaciones. Corregido: contraste de `muted` (#5f6779), badge sin opacidad, fundidos que respetan "reducir movimiento" |
| d | Mover etapa por teclado en el pipeline | ✅ | Selector "Mover a…" en cada tarjeta (alternativa al arrastre). `PipelineBoard.test.jsx` + E2E por teclado; captura revisada |
| e | Detalle en móvil (CV colapsable) | ✅ | CV plegado con "Ver CV" (aria-expanded), grilla `grid-cols-1` sin desborde, enlace redundante oculto en la barra móvil. `e2e/mobile-panel.spec.js` (Pixel 7). **Bug real encontrado:** eventos Realtime atrasados pisaban el estado local → `mergeNewer` por `updated_at` + tests |
| f | Asignación masiva | ✅ | Checkbox por fila + "seleccionar todas" (indeterminado), barra con asignar/quitar responsable y mover de etapa, resultado parcial si alguna falla. Tests de componente + E2E que verifica persistencia tras recargar |
| g | Exportar CSV | ✅ | Exporta filtradas (o seleccionadas), `;` + BOM para Excel es-CL, **protección contra inyección de fórmulas** (el nombre lo escribe el postulante). Unit + E2E que lee el archivo descargado. Extra: `npm run test:cleanup` y limpieza de kanban en `afterAll` (había 4 registros huérfanos, borrados) |
| h | Advisors de Supabase → migración | ✅ | `20261119000100_rls_performance.sql`: 2 índices de FK + 10 políticas con `(select auth.uid())` / `(select is_staff())` (initplan). Performance: solo quedan INFO de índices sin uso (base nueva). Security: los SECURITY DEFINER son intencionales; **pendiente del usuario:** activar *Leaked password protection* en Auth. Integración 27/27 |
| i | Comparar dos postulantes | ⏳ | |
