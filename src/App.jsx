import { Navigate, Route, Routes } from 'react-router-dom'
import { ROUTES } from '@/constants/routes.js'
import AdminLayout from '@/layouts/AdminLayout.jsx'
import FormularioPage from '@/pages/formulario/FormularioPage.jsx'
import DashboardPage from '@/pages/dashboard/DashboardPage.jsx'

export default function App() {
  return (
    <Routes>
      {/* Público: formulario de solicitud de evaluación */}
      <Route path={ROUTES.HOME} element={<FormularioPage />} />

      {/* Interno: dashboard de gestión */}
      <Route path={ROUTES.ADMIN} element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  )
}
