import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { REQUEST_STATUS, STATUS_FILTER_ALL } from '@/constants/requestStatus.js'
import { ROUTES } from '@/constants/routes.js'
import { getCandidates, getRequests } from '@/services/solicitudesService.js'
import RequestsTable from './components/RequestsTable.jsx'
import StatusTab from './components/StatusTab.jsx'

const TABS = [
  { value: STATUS_FILTER_ALL, label: 'Todas' },
  { value: REQUEST_STATUS.PENDING, label: 'Pendientes' },
  { value: REQUEST_STATUS.IN_PROGRESS, label: 'En proceso' },
  { value: REQUEST_STATUS.FINISHED, label: 'Finalizadas' },
]

export default function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL)
  const requests = getRequests()
  const candidates = getCandidates()
  const candidateById = Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate]))
  const countFor = (value) =>
    value === STATUS_FILTER_ALL ? requests.length : requests.filter((request) => request.status === value).length
  const filteredRequests =
    statusFilter === STATUS_FILTER_ALL ? requests : requests.filter((request) => request.status === statusFilter)

  return (
    <>
      <header className="topbar">
        <h1>Panel de gestión</h1>
        <Link to={ROUTES.form} className="btn-outline">
          <Plus size={14} aria-hidden="true" />
          Nueva solicitud
        </Link>
      </header>

      <div className="toolbar" role="group" aria-label="Filtrar por estado">
        {TABS.map((tab) => (
          <StatusTab
            key={tab.value}
            label={tab.label}
            count={countFor(tab.value)}
            active={statusFilter === tab.value}
            onClick={() => setStatusFilter(tab.value)}
          />
        ))}
      </div>

      <section className="requests-section" aria-label="Solicitudes recientes">
        <RequestsTable requests={filteredRequests} candidateById={candidateById} />
        <footer className="table-footer">
          {filteredRequests.length} de {requests.length} solicitudes
        </footer>
      </section>
    </>
  )
}
