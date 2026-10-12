import { useState } from 'react'
import { REQUEST_STATUS, STATUS_FILTER_ALL } from '@/constants/requestStatus.js'
import { getCandidates, getRequests } from '@/services/solicitudesService.js'
import MetricCard from './components/MetricCard.jsx'
import RequestsTable from './components/RequestsTable.jsx'

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL)
  const requests = getRequests()
  const candidates = getCandidates()
  const candidateById = Object.fromEntries(
    candidates.map((candidate) => [candidate.id, candidate]),
  )
  const countByStatus = (status) =>
    requests.filter((request) => request.status === status).length
  const filteredRequests =
    statusFilter === STATUS_FILTER_ALL
      ? requests
      : requests.filter((request) => request.status === statusFilter)

  return (
    <>
      <header className="topbar">
        <div className="breadcrumb"><strong>Dashboard</strong></div>
      </header>

      <div className="dashboard-content">
        <section className="page-heading">
          <div>
            <p className="eyebrow">RECLUTAMIENTO Y SELECCIÓN</p>
            <h1>Panel de gestión</h1>
          </div>
        </section>

        <section className="metrics-grid" aria-label="Indicadores">
          <MetricCard
            label="Total de candidatos"
            value={candidates.length}
            detail="registrados"
            tone="teal"
            active={statusFilter === STATUS_FILTER_ALL}
            onClick={() => setStatusFilter(STATUS_FILTER_ALL)}
          />
          <MetricCard
            label="Solicitudes pendientes"
            value={countByStatus(REQUEST_STATUS.PENDING)}
            detail="por iniciar"
            tone="amber"
            active={statusFilter === REQUEST_STATUS.PENDING}
            onClick={() => setStatusFilter(REQUEST_STATUS.PENDING)}
          />
          <MetricCard
            label="Solicitudes en proceso"
            value={countByStatus(REQUEST_STATUS.IN_PROGRESS)}
            detail="en evaluación"
            tone="blue"
            active={statusFilter === REQUEST_STATUS.IN_PROGRESS}
            onClick={() => setStatusFilter(REQUEST_STATUS.IN_PROGRESS)}
          />
          <MetricCard
            label="Evaluaciones finalizadas"
            value={countByStatus(REQUEST_STATUS.FINISHED)}
            detail="completadas"
            tone="coral"
            active={statusFilter === REQUEST_STATUS.FINISHED}
            onClick={() => setStatusFilter(REQUEST_STATUS.FINISHED)}
          />
        </section>

        <section className="requests-section" aria-labelledby="requests-title">
          <div className="section-heading">
            <div>
              <div className="section-title-line">
                <h2 id="requests-title">Solicitudes recientes</h2>
                <span className="result-count">{filteredRequests.length}</span>
              </div>
            </div>
            <p className="requests-note">
              <span className="warning-icon" aria-hidden="true">⚠</span>
              Revisa el estado de las evaluaciones solicitadas.
            </p>
          </div>

          <RequestsTable requests={filteredRequests} candidateById={candidateById} />

          <footer className="table-footer">
            Mostrando {filteredRequests.length} de {requests.length} solicitudes
          </footer>
        </section>
        <footer className="page-footer">AquaChile <span>·</span> Gestión de evaluaciones psicolaborales</footer>
      </div>
    </>
  )
}
