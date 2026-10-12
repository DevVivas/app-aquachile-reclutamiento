export default function DashboardPage() {
  return (
    <div className="dashboard-content">
      <section className="page-heading">
        <div className="page-heading-card">
          <p className="eyebrow">RECLUTAMIENTO Y SELECCIÓN</p>
          <h1>Panel de gestión</h1>
        </div>
      </section>

      <section className="dashboard-notice" aria-live="polite">
        <h2>Datos del dashboard aún no disponibles</h2>
        <p>
          Las métricas y solicitudes aparecerán aquí cuando se conecte el dashboard a una fuente de datos.
        </p>
      </section>
      <footer className="page-footer">
        AquaChile <span>·</span> Gestión de evaluaciones psicolaborales
      </footer>
    </div>
  )
}
