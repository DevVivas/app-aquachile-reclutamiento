import { Navigate, Route, Routes } from 'react-router-dom'
import AuthProvider from '@/auth/AuthProvider.jsx'
import RequireAuth from '@/auth/RequireAuth.jsx'
import { ROUTES } from '@/constants/routes.js'
import AdminLayout from '@/layouts/AdminLayout.jsx'
import FormularioPage from '@/pages/formulario/FormularioPage.jsx'
import DashboardPage from '@/pages/dashboard/DashboardPage.jsx'
import LoginPage from '@/pages/login/LoginPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Público: formulario de solicitud de evaluación */}
        <Route path={ROUTES.HOME} element={<FormularioPage />} />
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Interno: dashboard de gestión (requiere sesión) */}
        <Route element={<RequireAuth />}>
          <Route path={ROUTES.ADMIN} element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </AuthProvider>
  )
}
