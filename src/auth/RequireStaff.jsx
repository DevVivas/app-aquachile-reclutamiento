import { Navigate, useLocation } from 'react-router-dom'
import { Clock, Loader2, LogOut } from 'lucide-react'
import { AuthCard, AuthLogo, AuthScreen } from '@/components/ui/auth-card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { ROUTES } from '@/constants/routes.js'
import { useAuth } from './authContext.js'

export default function RequireStaff({ children, adminOnly = false }) {
  const { user, profile, loading, isStaff, isAdmin, signOut, refreshProfile } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid h-svh place-items-center text-muted" role="status">
        <Loader2 className="size-5 animate-spin" aria-label="Cargando" />
      </div>
    )
  }

  if (!user) return <Navigate to={ROUTES.LOGIN} replace state={{ from: location.pathname }} />

  if (!isStaff) {
    return (
      <AuthScreen>
        <AuthCard className="max-w-sm">
          <div className="space-y-2 text-center">
            <AuthLogo />
            <span className="mx-auto grid size-10 place-items-center rounded-full bg-amber-50 text-amber-600">
              <Clock className="size-5" aria-hidden="true" />
            </span>
            <h1 className="text-lg font-semibold">Cuenta pendiente de aprobación</h1>
            <p className="text-sm text-muted">
              Hola {profile?.full_name ?? ''}. Un administrador debe aprobar tu acceso antes de que puedas ver postulaciones.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={refreshProfile}>Ya me aprobaron</Button>
            <Button variant="outline" className="flex-1" onClick={signOut}>
              <LogOut className="size-4" aria-hidden="true" /> Salir
            </Button>
          </div>
        </AuthCard>
      </AuthScreen>
    )
  }

  if (adminOnly && !isAdmin) return <Navigate to={ROUTES.ADMIN} replace />

  return children
}
