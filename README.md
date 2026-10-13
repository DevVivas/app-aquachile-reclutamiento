# AquaChile · Reclutamiento

SPA React 19 + Vite + Tailwind CSS 4 para solicitar evaluaciones psicolaborales y consultar solicitudes/candidatos. El backend en Node 22 usa Supabase Postgres y Storage.

| Ruta | Uso |
| --- | --- |
| `/` | Formulario público de solicitud y carga de CV |
| `/admin` | Indicadores y solicitudes obtenidas desde la API |

## Arquitectura

- `src/`: frontend React; las llamadas HTTP viven en `src/services/`.
- `server/`: API Express; el cliente Supabase con service role solo vive en el servidor.
- `supabase/migrations/`: migraciones SQL para tablas, RLS y Storage.
- `docker-compose.yml`: frontend nginx y backend API.

## Crear y preparar Supabase

1. Crea un proyecto Supabase nuevo y espera que la base de datos y Storage estén disponibles.
2. En **SQL Editor**, ejecuta el contenido de `supabase/migrations/0001_init.sql`. Esto crea `public.candidatos`, `public.solicitudes`, habilita RLS sin políticas públicas y registra el bucket privado `cvs`.
3. Si la inserción de `storage.buckets` no está permitida en tu entorno, crea el bucket `cvs` desde **Storage → New bucket** con **Public bucket** desactivado y vuelve a ejecutar la migración.
4. En **Project Settings → API**, copia Project URL y `service_role` key a `.env` local. La service role key omite RLS: úsala exclusivamente en el contenedor API, nunca en el frontend, commits, imágenes públicas ni logs.

La API guarda el CV en `cvs/<solicitudId>/<nombre-saneado>`. El bucket es privado; `GET /api/solicitudes/:id/cv` genera un enlace firmado válido por 60 segundos.

## Variables de entorno

Copia `.env.example` a `.env` y completa, sin subir el archivo `.env`:

| Variable | Descripción | Predeterminado |
| --- | --- | --- |
| `SUPABASE_URL` | URL del proyecto Supabase | Obligatoria |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de Supabase, solo para la API | Obligatoria |
| `PORT` | Puerto HTTP de la API | `3000` |
| `CV_BUCKET` | Bucket privado para los CV | `cvs` |
| `WEB_PORT` | Puerto publicado por el frontend local | `8080` |
| `VITE_API_PROXY_TARGET` | Destino del proxy `/api/*` de Vite en desarrollo | `http://localhost:3000` |

`.env.example` contiene únicamente valores de ejemplo. Nunca pegues credenciales reales en ese archivo.

## Desarrollo local

Se requiere Node.js 22.

```bash
npm ci
npm --prefix server ci
```

Completa el `.env` de la raíz copiándolo desde `.env.example`. El script del servidor carga ese archivo con Node 22; Vite también lo usa para configurar su proxy.

En una terminal, inicia el backend:

```bash
npm --prefix server run dev
```

En otra terminal, inicia Vite:

```bash
npm run dev
```

El proxy Vite reenvía `/api/*` a `VITE_API_PROXY_TARGET`. Si cambias el destino, usa `.env.local` con esa variable.

Comprobaciones:

```bash
npm run lint
npm run build
npm --prefix server run lint
npm --prefix server run build
```

## Docker Compose

Completa `.env` con las credenciales de Supabase y ejecuta:

```bash
docker compose up --build
```

La interfaz queda en `http://localhost:8080` (o el valor de `WEB_PORT`). Nginx sirve la SPA y reenvía `/api/*` a `http://api:3000`; la API no publica un puerto del host. Compose espera a que el healthcheck de la API esté listo antes de iniciar el frontend.

## API

- `GET /api/health` → `{ "status": "ok" }`.
- `POST /api/evaluaciones/iniciar` → multipart con `candidateName`, `jobFamily`, `jobTitle` y `cv` (PDF/DOC/DOCX, hasta 10 MiB); responde `201 { "id": "..." }`.
- `GET /api/solicitudes` → solicitudes descendentemente por fecha con las propiedades `id`, `candidateId`, `jobTitle`, `jobFamily`, `owner`, `requestedAt` (`YYYY-MM-DD`) y `status`.
- `GET /api/candidatos` → `{ id, name }[]`.
- `GET /api/solicitudes/:id/cv` → `{ "signedUrl": "..." }`, expira en 60 segundos.

Los errores de la API se responden como JSON `{ "error": "mensaje" }`. Los detalles internos no se exponen al cliente.

## Pendiente / fuera de alcance

- **Riesgo:** `/admin` y la API no tienen autenticación ni autorización. La API permite crear solicitudes y consultar datos/CV a quien pueda alcanzarla. Restringe su exposición hasta implementar autenticación.
- Generación de carpetas y plantillas automáticas.
- Pruebas automatizadas. Plan sugerido: pruebas de validación multipart y tamaño/tipo de archivo; pruebas de persistencia y limpieza ante fallas usando un proyecto Supabase efímero; pruebas de endpoints/contrato; luego pruebas de componente de carga/error/reintento del dashboard.

## CI/CD

`ci.yml` ejecuta lint y build del frontend y API y construye ambas imágenes Docker en pull requests y pushes a `develop`/`main`. `cd.yml` publica el frontend en `ghcr.io/<owner>/<repo>` y la API en `ghcr.io/<owner>/<repo>-api`, conservando para ambas el esquema de tags existente: rama, SHA, versión semántica y `latest` en la rama predeterminada. Habilita GitHub Actions para publicar paquetes del repositorio.
