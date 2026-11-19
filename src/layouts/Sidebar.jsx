import { Link, NavLink } from 'react-router-dom'
import { ClipboardPlus, LayoutDashboard, LogOut, Users } from 'lucide-react'
import { useAuth } from '@/auth/authContext.js'
import { ROLES } from '@/constants/pipeline.js'
import { ROUTES } from '@/constants/routes.js'

const navLinkClassName = ({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`

export default function Sidebar() {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <aside className="sidebar">
      <Link className="brand" to={ROUTES.ADMIN} aria-label="AquaChile Selección, inicio">
        <img className="brand-logo" src="/aquachile-logo.webp" alt="AquaChile" />
      </Link>
      <div className="sidebar-caption">Selección</div>
      <nav aria-label="Navegación principal">
        <NavLink className={navLinkClassName} to={ROUTES.ADMIN} end>
          <LayoutDashboard size={16} aria-hidden="true" />
          Postulaciones
        </NavLink>
        {isAdmin && (
          <NavLink className={navLinkClassName} to={ROUTES.ADMIN_TEAM}>
            <Users size={16} aria-hidden="true" />
            Equipo
          </NavLink>
        )}
        <NavLink className={navLinkClassName} to={ROUTES.form} target="_blank" end>
          <ClipboardPlus size={16} aria-hidden="true" />
          Formulario público
        </NavLink>
      </nav>
      {profile && (
        <div className="sidebar-user">
          <div className="min-w-0">
            <p className="truncate font-medium" data-testid="current-user">{profile.full_name}</p>
            <p className="truncate text-xs text-muted">{ROLES[profile.role]}</p>
          </div>
          <button type="button" className="sidebar-logout" onClick={signOut} title="Cerrar sesión">
            <LogOut size={16} aria-hidden="true" />
            <span className="sr-only">Cerrar sesión</span>
          </button>
        </div>
      )}
    </aside>
  )
}
