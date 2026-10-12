import { Link, NavLink } from 'react-router-dom'
import { ROUTES } from '@/constants/routes.js'

const navLinkClassName = ({ isActive }) =>
  `nav-link${isActive ? ' nav-link-active' : ''}`

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <Link className="brand" to={ROUTES.ADMIN} aria-label="AquaChile Selección, inicio">
        <span className="brand-symbol" aria-hidden="true">A</span>
        <span className="brand-name">AquaChile<span>Reclutamiento</span></span>
      </Link>
      <div className="sidebar-caption">GESTIÓN</div>
      <nav aria-label="Navegación principal">
        <NavLink className={navLinkClassName} to={ROUTES.ADMIN}>
          <span className="nav-indicator" aria-hidden="true" />
          Panel principal
        </NavLink>
        <NavLink className={navLinkClassName} to={ROUTES.HOME} end>
          <span className="nav-indicator" aria-hidden="true" />
          Nueva solicitud
        </NavLink>
      </nav>
    </aside>
  )
}
