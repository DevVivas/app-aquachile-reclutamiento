# AquaChile · Reclutamiento

Plataforma de selección: los postulantes envían su CV por un formulario público y el equipo (reclutadores, RR.HH. y psicólogos laborales) lo revisa en un panel, con **análisis IA del CV**, asignación de evaluador y pipeline de etapas.

**Stack:** React 19 + Vite + Tailwind 4 · Supabase (Postgres + RLS, Auth, Storage, Edge Functions, Realtime) · Vitest · Playwright · GitHub Actions.

## Flujo

```
Postulante ──► /  (formulario + CV)
                 │  POST multipart
                 ▼
     Edge Function submit-application
       ├─ valida datos y firma del archivo (PDF/DOC/DOCX, ≤10 MB)
       ├─ guarda el CV en  cvs/<nombre-del-postulante>/<fecha>_<cargo>.pdf
       ├─ crea la postulación (etapa "Recibido")
       └─ lanza el análisis IA en segundo plano
                 │
                 ▼
   Análisis: texto del CV → rúbrica determinista → LLM gratuito (opcional) → puntaje 0-100
                 │  (Realtime)
                 ▼
Equipo ──► /dashboard   KPIs · filtros · asignar evaluador · vista tabla o pipeline (kanban)
       └─► /dashboard/postulaciones/:id   CV embebido · datos · análisis IA · etapas · notas · historial
```

| Ruta | Contenido |
| --- | --- |
| `/` | Formulario público de postulación |
| `/login`, `/registro` | Acceso y solicitud de cuenta del equipo |
| `/dashboard` | Panel de postulaciones (requiere cuenta aprobada) |
| `/dashboard/postulaciones/:id` | Detalle del postulante |
| `/dashboard/equipo` | Aprobación de cuentas y roles (solo admin) |

## IA: cómo se puntúa un CV

1. **Rúbrica determinista** (`supabase/functions/_shared/scoring.ts`, siempre activa y auditable):

   | Criterio | Peso cargo de jefatura | Peso cargo individual |
   | --- | --- | --- |
   | Liderazgo (jefaturas previas, personas a cargo, tamaño de equipo) | 35 | 10 |
   | Experiencia (años, uniendo rangos de fechas) | 20 | 25 |
   | Afinidad con la familia de cargo | 20 | 30 |
   | Afinidad con el nombre del cargo | 15 | 20 |
   | Formación | 10 | 15 |

   Un cargo es "de jefatura" si su nombre incluye jefe/a, supervisor/a, gerente, coordinador/a, encargado/a, líder… o si la familia es *Jefaturas y Gerencia*. **Una postulación a jefatura sin evidencia de liderazgo queda topada en 55 (nunca "afinidad alta")**; un perfil de otra área, en 40.

2. **LLM gratuito opcional** (`_shared/ai.ts`): si existe `GEMINI_API_KEY` (Google AI Studio, gratis) o `GROQ_API_KEY` (Groq, gratis), el modelo redacta el resumen, fortalezas, brechas y evidencia de liderazgo. Puntaje final = 60 % modelo + 40 % rúbrica, con los mismos topes. Si el modelo falla o no hay key, se usa la rúbrica sola (el panel lo indica).

El prompt trata el CV como dato (resistente a instrucciones incrustadas) y excluye datos sensibles (edad, género, etc.). Es apoyo a la decisión, no reemplaza la evaluación profesional.

## Seguridad

- Todas las tablas con **RLS**. El público no lee nada; solo inserta vía Edge Function.
- Las cuentas nuevas quedan **pendientes** hasta que un admin las apruebe (el primer usuario del proyecto es admin).
- El equipo solo puede cambiar `stage` y `assigned_to` (privilegios por columna); el puntaje IA lo escribe solo el backend.
- Bucket `cvs` privado; el panel usa URLs firmadas de 10 minutos.
- Historial (`application_events`) escrito por triggers: quién asignó, movió de etapa o comentó.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # completa VITE_SUPABASE_ANON_KEY
npm run dev                  # http://localhost:5173
```

## Tests

| Comando | Qué cubre |
| --- | --- |
| `npm test` | Unit + componentes (motor IA, validaciones, formulario, panel, guardas) |
| `npm run test:integration` | Backend real: RLS, Storage por carpeta, Edge Functions, IA, permisos |
| `npm run test:e2e` | Playwright: postulante → reclutador (asignar, CV, IA, etapas, notas), kanban, auth, móvil |
| `npm run test:all` | Todo lo anterior + lint |

Integración y E2E necesitan en `.env.local` (o secretos de CI): `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.

## Backend (Supabase)

```
supabase/
├── migrations/            # esquema, RLS, triggers, bucket
└── functions/
    ├── _shared/           # scoring.ts, ai.ts, validation.ts (puros, testeados con Vitest), extract.ts, analyze.ts
    ├── submit-application # POST público multipart
    ├── analyze-application# re-análisis (equipo)
    └── register-staff     # alta de cuentas del equipo (pendientes de aprobación)
```

Secretos opcionales de las Edge Functions: `GEMINI_API_KEY` o `GROQ_API_KEY`, `AI_MODEL`, `ALLOWED_ORIGINS`.

## CI/CD

- `.github/workflows/ci.yml`: lint, tests con cobertura, build y `npm audit` en cada PR; integración y E2E si existen los secretos `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`.
- `.github/workflows/supabase-deploy.yml`: al cambiar `supabase/` en `main`, aplica migraciones y despliega funciones (requiere `SUPABASE_ACCESS_TOKEN` y `SUPABASE_DB_PASSWORD`).

## Despliegue del frontend

SPA: el hosting debe devolver `index.html` para cualquier ruta.
