import { Link, useNavigate } from 'react-router-dom'
import { adminRequestDetailPath } from '@/constants/routes.js'
import { fechaFormato } from '@/utils/formatDate.js'
import AssigneeSelect from './AssigneeSelect.jsx'
import { ScoreBadge, StageBadge } from './Badges.jsx'

function SelectAll({ ids, selected, onToggleAll }) {
  const count = ids.filter((id) => selected.has(id)).length
  return (
    <input
      type="checkbox"
      aria-label="Seleccionar todas las postulaciones visibles"
      className="size-4 accent-brand"
      checked={ids.length > 0 && count === ids.length}
      ref={(el) => el && (el.indeterminate = count > 0 && count < ids.length)}
      onChange={() => onToggleAll(ids)}
    />
  )
}

export default function RequestsTable({
  applications,
  team,
  onAssign,
  selected = new Set(),
  onToggle,
  onToggleAll,
  emptyText = 'No hay postulaciones con estos filtros.',
}) {
  const navigate = useNavigate()
  const selectable = Boolean(onToggle)

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className="w-8">
                <SelectAll ids={applications.map((app) => app.id)} selected={selected} onToggleAll={onToggleAll} />
              </th>
            )}
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
              className={selected.has(app.id) ? 'cursor-pointer bg-brand-soft/60' : 'cursor-pointer'}
              data-testid="application-row"
              aria-selected={selectable ? selected.has(app.id) : undefined}
              onClick={() => navigate(adminRequestDetailPath(app.id))}
            >
              {selectable && (
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar a ${app.candidate_name}`}
                    className="size-4 accent-brand"
                    checked={selected.has(app.id)}
                    onChange={() => onToggle(app.id)}
                  />
                </td>
              )}
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
