# AquaChile · Reclutamiento

Aplicación única (React 19 + Vite + Tailwind CSS 4) que une el **formulario** de solicitud de evaluación psicolaboral y el **dashboard** de gestión.

| Ruta | Contenido |
| --- | --- |
| `/` | Formulario público de solicitud de evaluación |
| `/admin` | Dashboard de gestión, pendiente de conectar a datos reales |

## Estructura

```
src/
├── main.jsx                      # Punto de entrada (BrowserRouter)
├── App.jsx                       # Definición de rutas
├── constants/
│   └── routes.js                 # Rutas de la app
├── layouts/
│   ├── AdminLayout.jsx           # Shell del dashboard (.admin-app + sidebar + <Outlet />)
│   └── Sidebar.jsx
├── pages/
│   ├── formulario/
│   │   ├── FormularioPage.jsx
│   │   ├── constants.js          # Familias de cargo, estado inicial, clases de inputs
│   │   ├── components/           # FormField, FormAlert
│   │   └── hooks/useEvaluacionForm.js
│   └── dashboard/DashboardPage.jsx
├── services/
│   └── evaluacionesService.js    # POST /api/evaluaciones/iniciar
└── styles/
    ├── index.css                 # Solo Tailwind
    └── admin.css                 # Estilos del dashboard, con scope .admin-app
```

Convenciones:

- Cada página vive en `src/pages/<nombre>/` con sus propios `components/`, `hooks/` y `constants.js`. Lo que usen dos o más páginas va a `src/components/`, `src/hooks/` o `src/utils/`.
- La comunicación con el backend vive solo en `src/services/`; las páginas no llaman a `fetch` directamente.
- Imports con alias `@/` (apunta a `src/`), por ejemplo `import { ROUTES } from '@/constants/routes.js'`.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run lint
npm run build
```

El formulario envía un `POST` multipart a `/api/evaluaciones/iniciar`. Para apuntarlo a tu backend en desarrollo:

```bash
cp .env.example .env.local   # ajusta VITE_API_PROXY_TARGET
```

El dashboard no muestra métricas ni solicitudes mientras no exista una integración de lectura con datos reales.

## Base de datos Supabase

1. Crea un proyecto Supabase y abre **SQL Editor**.
2. Ejecuta el contenido de `supabase/migrations/0001_init.sql`. La migración crea las tablas `candidatos` y `solicitudes`, habilita RLS sin políticas públicas y crea el bucket privado `cvs`.
3. En **Project Settings → API**, copia la URL del proyecto y la `service_role` secret key para la configuración local del servidor. Nunca uses esa clave en el frontend ni la subas al repositorio.

El bucket se crea por SQL en esta migración. Si el rol de ejecución no permite escribir en `storage.buckets`, créalo desde **Storage → New bucket** con nombre `cvs` y acceso privado, y vuelve a ejecutar la migración.

## Despliegue

Es una SPA con rutas del lado del cliente: el hosting debe devolver `index.html` para cualquier ruta (por ejemplo `/admin`).
