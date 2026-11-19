import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import RequireStaff from '@/auth/RequireStaff.jsx'
import { ROUTES } from '@/constants/routes.js'
import FormularioPage from '@/pages/formulario/FormularioPage.jsx'
import LoginPage from '@/pages/login/LoginPage.jsx'
import SignupPage from '@/pages/signup/SignupPage.jsx'

// El panel se carga aparte: quien solo postula no descarga el código del dashboard.
const AdminLayout = lazy(() => import('@/layouts/AdminLayout.jsx'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage.jsx'))
const ApplicationDetailPage = lazy(() => import('@/pages/dashboard/ApplicationDetailPage.jsx'))
const TeamPage = lazy(() => import('@/pages/team/TeamPage.jsx'))
const ComparePage = lazy(() => import('@/pages/compare/ComparePage.jsx'))

const Fallback = () => (
  <div className="grid h-svh place-items-center text-muted" role="status">
    <Loader2 className="size-5 animate-spin" aria-label="Cargando" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        {/* Público */}
        <Route path={ROUTES.form} element={<FormularioPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

        {/* Panel del equipo de selección */}
        <Route
          path={ROUTES.ADMIN}
          element={
            <RequireStaff>
              <AdminLayout />
            </RequireStaff>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="postulaciones/:id" element={<ApplicationDetailPage />} />
          <Route path="comparar" element={<ComparePage />} />
          <Route
            path="equipo"
            element={
              <RequireStaff adminOnly>
                <TeamPage />
              </RequireStaff>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.form} replace />} />
      </Routes>
    </Suspense>
  )
}
