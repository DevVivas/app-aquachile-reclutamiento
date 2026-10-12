# AquaChile · Reclutamiento

Aplicación única (React 19 + Vite + Tailwind CSS 4) que une el **formulario** de solicitud de evaluación psicolaboral y el **dashboard** de gestión.

| Ruta | Contenido |
| --- | --- |
| `/` | Formulario público de solicitud de evaluación |
| `/admin` | Dashboard de gestión (métricas y solicitudes recientes) |
| `/admin/solicitudes/:id` | Detalle de solicitud (placeholder, próxima fase) |

## Estructura

```
src/
├── main.jsx                      # Punto de entrada (BrowserRouter)
├── App.jsx                       # Definición de rutas
├── constants/
│   ├── routes.js                 # Rutas de la app y helpers de path
│   └── requestStatus.js          # Estados de solicitud (Pendiente, En proceso, Finalizada)
├── layouts/
│   ├── AdminLayout.jsx           # Shell del dashboard (.admin-app + sidebar + <Outlet />)
│   └── Sidebar.jsx
├── pages/
│   ├── formulario/
│   │   ├── FormularioPage.jsx
│   │   ├── constants.js          # Familias de cargo, estado inicial, clases de inputs
│   │   ├── components/           # FormField, FormAlert
│   │   └── hooks/useEvaluacionForm.js
│   └── dashboard/
│       ├── DashboardPage.jsx
│       ├── RequestDetailPage.jsx
│       └── components/           # MetricCard, RequestsTable, StatusBadge
├── services/
│   ├── evaluacionesService.js    # POST /api/evaluaciones/iniciar
│   ├── solicitudesService.js     # Lectura de solicitudes y candidatos (mock por ahora)
│   └── mock/mockData.js
├── utils/formatDate.js
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

El dashboard usa por ahora datos simulados (`src/services/mock/mockData.js`).

## Despliegue

Es una SPA con rutas del lado del cliente: el hosting debe devolver `index.html` para cualquier ruta (por ejemplo `/admin`).
