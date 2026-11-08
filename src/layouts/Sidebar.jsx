import { Link, NavLink } from 'react-router-dom'
import { ClipboardPlus, LayoutDashboard } from 'lucide-react'
import { ROUTES } from '@/constants/routes.js'

const navLinkClassName = ({ isActive }) => `nav-link${isActive ? ' nav-link-active' : ''}`

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Link className="brand" to={ROUTES.ADMIN} aria-label="AquaChile Selección, inicio">
        <img className="brand-logo" src="/aquachile-logo.webp" alt="AquaChile" />
      </Link>
      <div className="sidebar-caption">Gestión</div>
      <nav aria-label="Navegación principal">
        <NavLink className={navLinkClassName} to={ROUTES.ADMIN} end>
          <LayoutDashboard size={16} aria-hidden="true" />
          Panel principal
        </NavLink>
        <NavLink className={navLinkClassName} to={ROUTES.form} end>
          <ClipboardPlus size={16} aria-hidden="true" />
          Nueva solicitud
        </NavLink>
      </nav>
    </aside>
  )
}
