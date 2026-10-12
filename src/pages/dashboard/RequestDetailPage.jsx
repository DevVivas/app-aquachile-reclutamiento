import { Link, useParams } from 'react-router-dom'
import { ROUTES } from '@/constants/routes.js'

export default function RequestDetailPage() {
  const { id } = useParams()

  return (
    <section className="placeholder-page mx-auto max-w-3xl px-8 py-16">
      <Link to={ROUTES.ADMIN} className="back-link">← Volver al dashboard</Link>
      <p className="eyebrow">SOLICITUD {id}</p>
      <h1>Detalle de solicitud</h1>
      <p className="page-description">Esta vista estará disponible en una siguiente fase.</p>
    </section>
  )
}
