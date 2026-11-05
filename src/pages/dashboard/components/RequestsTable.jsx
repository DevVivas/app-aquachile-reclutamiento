import { formatDate } from '@/utils/formatDate.js'
import StatusBadge from './StatusBadge.jsx'

export default function RequestsTable({ requests, candidateById, hasAny }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Candidato</th>
            <th scope="col">Cargo</th>
            <th scope="col">Familia de cargo</th>
            <th scope="col">Responsable</th>
            <th scope="col">Fecha de solicitud</th>
            <th scope="col">Estado</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>
                {candidateById[request.candidateId]?.name ?? 'Candidato'}
              </td>
              <td>{request.jobTitle}</td>
              <td>{request.jobFamily}</td>
              <td>{request.owner || '—'}</td>
              <td>{formatDate(request.requestedAt)}</td>
              <td><StatusBadge status={request.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      {requests.length === 0 && (
        <p className="empty-state">
          {hasAny
            ? 'Ninguna solicitud coincide con este estado. Elige otro indicador para ver más.'
            : 'Aún no hay solicitudes. Aparecerán aquí cuando se envíe el formulario de evaluación.'}
        </p>
      )}
    </div>
  )
}
