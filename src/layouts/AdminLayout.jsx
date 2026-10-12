import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import '@/styles/admin.css'

// Todos los estilos del dashboard cuelgan de .admin-app para no afectar al formulario público.
export default function AdminLayout() {
  return (
    <div className="admin-app">
      <div className="app-shell">
        <Sidebar />
        <main className="main-area">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
