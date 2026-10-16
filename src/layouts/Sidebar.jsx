import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth.js'
import { ROUTES } from '@/constants/routes.js'

const navLinkClassName = ({ isActive }) =>
  `nav-link${isActive ? ' nav-link-active' : ''}`

const logoutButtonStyle = {
  background: 'none',
  border: 0,
  width: '100%',
  textAlign: 'left',
  cursor: 'pointer',
  font: 'inherit',
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN, { replace: true })
  }

  return (
    <aside className="sidebar">
      <Link className="brand" to={ROUTES.ADMIN} aria-label="AquaChile Selección, inicio">
        <img className="brand-logo" src="/aquachile-logo.webp" alt="AquaChile" />
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
      <div className="sidebar-caption">SESIÓN</div>
      {user?.nombre && <p className="sidebar-user">{user.nombre}</p>}
      <button type="button" className="nav-link" style={logoutButtonStyle} onClick={handleLogout}>
        <span className="nav-indicator" aria-hidden="true" />
        Cerrar sesión
      </button>
    </aside>
  )
}
