import { useEffect, useState } from 'react'
import { REQUEST_STATUS, STATUS_FILTER_ALL } from '@/constants/requestStatus.js'
import { getCandidates, getRequests } from '@/services/solicitudesService.js'
import MetricCard from './components/MetricCard.jsx'
import RequestsTable from './components/RequestsTable.jsx'

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [result, setResult] = useState({
    attempt: -1,
    data: { candidates: [], requests: [] },
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      getRequests({ signal: controller.signal }),
      getCandidates({ signal: controller.signal }),
    ])
      .then(([requests, candidates]) => {
        setResult({
          attempt: loadAttempt,
          data: { requests, candidates },
          error: null,
        })
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) {
          setResult({
            attempt: loadAttempt,
            data: { candidates: [], requests: [] },
            error: loadError.message,
          })
        }
      })

    return () => controller.abort()
  }, [loadAttempt])

  const loading = result.attempt !== loadAttempt
  const error = loading ? null : result.error
  const { candidates, requests } = result.data
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
    <div className="dashboard-content">
      <section className="page-heading">
        <div className="page-heading-card">
          <p className="eyebrow">RECLUTAMIENTO Y SELECCIÓN</p>
          <h1>Panel de gestión</h1>
        </div>
      </section>

      {loading && (
        <section className="dashboard-notice" role="status">
          <p>Cargando solicitudes y candidatos…</p>
        </section>
      )}

      {!loading && error && (
        <section className="dashboard-notice dashboard-error" role="alert">
          <h2>No se pudo cargar el dashboard</h2>
          <p>{error}</p>
          <button
            type="button"
            className="dashboard-retry"
            onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          >
            Reintentar
          </button>
        </section>
      )}

      {!loading && !error && (
        <>
          <section className="metrics-grid" aria-label="Indicadores">
            <MetricCard
              label="Total de candidatos"
              value={candidates.length}
              detail="registrados"
              active={statusFilter === STATUS_FILTER_ALL}
              onClick={() => setStatusFilter(STATUS_FILTER_ALL)}
            />
            <MetricCard
              label="Solicitudes pendientes"
              value={countByStatus(REQUEST_STATUS.PENDING)}
              detail="por iniciar"
              active={statusFilter === REQUEST_STATUS.PENDING}
              onClick={() => setStatusFilter(REQUEST_STATUS.PENDING)}
            />
            <MetricCard
              label="Solicitudes en proceso"
              value={countByStatus(REQUEST_STATUS.IN_PROGRESS)}
              detail="en evaluación"
              active={statusFilter === REQUEST_STATUS.IN_PROGRESS}
              onClick={() => setStatusFilter(REQUEST_STATUS.IN_PROGRESS)}
            />
            <MetricCard
              label="Evaluaciones finalizadas"
              value={countByStatus(REQUEST_STATUS.FINISHED)}
              detail="completadas"
              active={statusFilter === REQUEST_STATUS.FINISHED}
              onClick={() => setStatusFilter(REQUEST_STATUS.FINISHED)}
            />
          </section>

          <section className="requests-section" aria-labelledby="requests-title">
            <div className="section-heading">
              <div className="section-title-line">
                <h2 id="requests-title">Solicitudes recientes</h2>
                <span className="result-count">{filteredRequests.length}</span>
              </div>
              <p className="requests-note">
                Revisa el estado de las evaluaciones solicitadas.
              </p>
            </div>

            <RequestsTable
              requests={filteredRequests}
              candidateById={candidateById}
            />

            <footer className="table-footer">
              Mostrando {filteredRequests.length} de {requests.length} solicitudes
            </footer>
          </section>
        </>
      )}

      <footer className="page-footer">
        AquaChile <span>·</span> Gestión de evaluaciones psicolaborales
      </footer>
    </div>
  )
}
