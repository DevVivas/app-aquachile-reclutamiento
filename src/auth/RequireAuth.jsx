import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTES } from '@/constants/routes.js'
import { useAuth } from './useAuth.js'

export default function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <p role="status" className="p-8 text-sm text-gray-600">
        Verificando sesión…
      </p>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
