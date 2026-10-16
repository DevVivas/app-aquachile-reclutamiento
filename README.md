# AquaChile · Reclutamiento

SPA React 19 + Vite + Tailwind CSS 4 para solicitar evaluaciones psicolaborales y consultar solicitudes/candidatos. El backend en Node 22 usa Supabase Postgres y Storage.

| Ruta | Uso |
| --- | --- |
| `/` | Formulario público de solicitud y carga de CV |
| `/login` | Inicio de sesión del personal autorizado |
| `/admin` | Indicadores y solicitudes (requiere sesión) |

## Arquitectura

- `src/`: frontend React; las llamadas HTTP viven en `src/services/`.
- `server/`: API Express; el cliente Supabase con service role solo vive en el servidor.
- `supabase/migrations/`: migraciones SQL (tablas, RLS, Storage, RPC) con prefijo de fecha, compatibles con la CLI de Supabase.
- `docker-compose.yml`: frontend nginx y backend API (desarrollo/local).
- `Dockerfile.render` + `render.yaml`: un único servicio donde Express sirve la SPA y la API (producción en Render).

## Modelo de datos

`candidatos`, `solicitudes` (estado, familia, `responsable_id` → `profiles`), `documentos` (CV por solicitud), `plantillas` (catálogo de plantillas fijas), `familias_cargo` (catálogo; debe coincidir con `src/pages/formulario/constants.js`) y `profiles` (usuarios autorizados). Todas con RLS activo y sin políticas: solo la API (service role) accede. El alta de solicitudes usa la función `crear_solicitud`, que inserta candidato, solicitud y documento en una sola transacción.

## Autenticación

Supabase Auth con correo y contraseña. La API inicia sesión contra Supabase y guarda la sesión en cookies `httpOnly`, `SameSite=Strict` (el navegador nunca ve los tokens). Todas las rutas de lectura exigen sesión **y** una fila en `public.profiles`; un usuario de Auth sin perfil no puede entrar. El formulario público (`POST /api/evaluaciones/iniciar`) sigue abierto, con límite de 30 envíos por hora por IP, validación de campos, familia, tipo y firma del archivo.

## Crear y preparar Supabase

1. Crea el proyecto en **East US (North Virginia)** (`us-east-1`), la misma zona que Render *Virginia*. La región no se puede cambiar después.
2. Aplica las migraciones en orden, con la CLI (`supabase link --project-ref <ref>` y `supabase db push`) o pegándolas en **SQL Editor**: `20261015000000_init.sql` y luego `20261015000100_endurecimiento.sql`.
3. En **Authentication → Sign In / Providers**, desactiva *Allow new users to sign up*.
4. Crea los usuarios en **Authentication → Users → Add user** (marca *Auto Confirm User*) y autorízalos:

   ```sql
   insert into public.profiles (id, nombre, rol)
   select id, 'Nombre Apellido', 'admin' from auth.users where email = 'persona@aquachile.cl';
   ```

5. En **Project Settings → API**, copia la Project URL, la clave pública (`anon`/publishable) y la `service_role`/secret. La service role omite RLS: úsala solo en el servidor, nunca en el frontend, commits, imágenes públicas ni logs.

### Plantillas fijas

Sube los archivos al bucket privado `plantillas` (**Storage**) y regístralos:

```sql
insert into public.plantillas (nombre, version, storage_path)
values ('Informe psicolaboral', 1, 'informe-psicolaboral/v1.docx');
```

Para una nueva versión, sube `.../v2.docx`, inserta la fila con `version = 2` y pon `activa = false` en la anterior. `GET /api/plantillas` las lista y `GET /api/plantillas/:id/descarga` entrega un enlace firmado de 60 segundos (requiere sesión).

Los CV se guardan en `cvs/<solicitudId>/<nombre-saneado>` (bucket privado, 10 MB, PDF/DOC/DOCX). `GET /api/solicitudes/:id/cv` genera un enlace firmado válido por 60 segundos.

## Variables de entorno

Copia `.env.example` a `.env` y completa, sin subir el archivo `.env`:

| Variable | Descripción | Predeterminado |
| --- | --- | --- |
| `SUPABASE_URL` | URL del proyecto Supabase | Obligatoria |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio de Supabase, solo para la API | Obligatoria |
| `SUPABASE_ANON_KEY` | Clave pública, solo para iniciar sesión en Supabase Auth | Obligatoria |
| `PORT` | Puerto HTTP de la API | `3000` |
| `CV_BUCKET` | Bucket privado para los CV | `cvs` |
| `TEMPLATES_BUCKET` | Bucket privado para las plantillas | `plantillas` |
| `STATIC_DIR` | Si se define, Express sirve la SPA compilada desde esa carpeta (lo fija `Dockerfile.render`) | — |
| `TRUST_PROXY` | Saltos de proxy confiables para obtener la IP del cliente | `1` |
| `COOKIE_SECURE` | Cookies `Secure` (por defecto `true` en producción) | según `NODE_ENV` |
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

Compose fija `COOKIE_SECURE=false` porque corre en `http://localhost`. La interfaz queda en `http://localhost:8080` (o el valor de `WEB_PORT`). Nginx sirve la SPA y reenvía `/api/*` a `http://api:3000`; la API no publica un puerto del host. Compose espera a que el healthcheck de la API esté listo antes de iniciar el frontend.

## API

- `GET /api/health` → `{ "status": "ok" }`.
- `POST /api/evaluaciones/iniciar` → multipart con `candidateName`, `jobFamily`, `jobTitle` y `cv` (PDF/DOC/DOCX, hasta 10 MiB); responde `201 { "id": "..." }`.
- `POST /api/auth/login` (`{ email, password }`), `GET /api/auth/me`, `POST /api/auth/logout`.
- Desde aquí, todas requieren sesión. `GET /api/solicitudes` → solicitudes descendentemente por fecha con las propiedades `id`, `candidateId`, `jobTitle`, `jobFamily`, `owner`, `requestedAt` (`YYYY-MM-DD`) y `status`.
- `GET /api/candidatos` → `{ id, name }[]`.
- `GET /api/solicitudes/:id/cv` → `{ "signedUrl": "..." }`, expira en 60 segundos.
- `GET /api/plantillas` → `{ id, name, version }[]` y `GET /api/plantillas/:id/descarga` → `{ "signedUrl": "..." }`.

Los errores de la API se responden como JSON `{ "error": "mensaje" }`. Los detalles internos no se exponen al cliente.

## Pendiente / fuera de alcance

- Generación automática de documentos a partir de las plantillas por solicitud (hoy el catálogo y la descarga están disponibles; no se copian por solicitud).
- Deduplicación de candidatos: cada envío crea un candidato nuevo (no se captura RUT/correo).
- Pantalla de detalle de solicitud (descarga de CV y plantillas) y asignación de responsable desde la UI: la API ya lo soporta.
- El limitador de frecuencia es en memoria (una instancia). Si escalas a varias, usa un almacén compartido.
- Pruebas automatizadas. Plan sugerido: pruebas de validación multipart y tamaño/tipo de archivo; pruebas de persistencia y limpieza ante fallas usando un proyecto Supabase efímero; pruebas de endpoints/contrato; luego pruebas de componente de carga/error/reintento del dashboard.

## Despliegue en Render (USA)

1. En Render: **New → Blueprint**, elige el repositorio y la rama; lee `render.yaml` (servicio `aquachile-reclutamiento`, región *Virginia*, plan *starter*; `free` se duerme por inactividad).
2. Completa los secretos `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_ANON_KEY`.
3. Render construye `Dockerfile.render` (SPA + API en un solo servicio, mismo origen: no requiere CORS ni proxy) y comprueba `/api/health`.
4. Verifica: `/login` carga, el ingreso funciona y `GET /api/solicitudes` sin sesión responde 401. Si el límite de frecuencia agrupa a todos los usuarios bajo una misma IP, ajusta `TRUST_PROXY` según los saltos de proxy de Render.

## CI/CD

`ci.yml` ejecuta lint y build del frontend y API y construye ambas imágenes Docker en pull requests y pushes a `develop`/`main`. `cd.yml` publica el frontend en `ghcr.io/<owner>/<repo>` y la API en `ghcr.io/<owner>/<repo>-api`, conservando para ambas el esquema de tags existente: rama, SHA, versión semántica y `latest` en la rama predeterminada. Habilita GitHub Actions para publicar paquetes del repositorio.
