import { Link, useNavigate } from 'react-router-dom'
import { adminRequestDetailPath } from '@/constants/routes.js'
import { fechaFormato } from '@/utils/formatDate.js'
import AssigneeSelect from './AssigneeSelect.jsx'
import { ScoreBadge, StageBadge } from './Badges.jsx'

export default function RequestsTable({ applications, team, onAssign, emptyText = 'No hay postulaciones con estos filtros.' }) {
  const navigate = useNavigate()

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">Postulante</th>
            <th scope="col">Cargo</th>
            <th scope="col">Afinidad IA</th>
            <th scope="col">Etapa</th>
            <th scope="col">Responsable</th>
            <th scope="col">Recibido</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr
              key={app.id}
              className="cursor-pointer"
              data-testid="application-row"
              onClick={() => navigate(adminRequestDetailPath(app.id))}
            >
              <td>
                <Link className="candidate-link" to={adminRequestDetailPath(app.id)} onClick={(e) => e.stopPropagation()}>
                  {app.candidate_name}
                </Link>
                {app.candidate_email && <div className="text-xs text-muted">{app.candidate_email}</div>}
              </td>
              <td>
                <div>{app.job_title}</div>
                <div className="text-xs text-muted">{app.job_family}</div>
              </td>
              <td><ScoreBadge status={app.ai_status} score={app.ai_score} fit={app.ai_fit} /></td>
              <td><StageBadge stage={app.stage} /></td>
              <td>
                <AssigneeSelect
                  value={app.assigned_to}
                  team={team}
                  label={`Responsable de ${app.candidate_name}`}
                  onChange={(profileId) => onAssign(app.id, profileId)}
                />
              </td>
              <td className="date-cell">{fechaFormato(app.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {applications.length === 0 && <p className="empty-state">{emptyText}</p>}
    </div>
  )
}
