import { useState } from 'react'
import { Link } from 'react-router-dom'
import { STAGES } from '@/constants/pipeline.js'
import { adminRequestDetailPath } from '@/constants/routes.js'
import { cn } from '@/lib/utils.js'
import { haceCuanto } from '@/utils/formatDate.js'
import { ScoreBadge } from './Badges.jsx'
import { TONES } from './tones.js'

/** Vista kanban: arrastra una tarjeta a otra columna para cambiar la etapa. */
export default function PipelineBoard({ applications, team, onMove }) {
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)
  const nameById = Object.fromEntries(team.map((member) => [member.id, member.full_name]))

  const drop = async (stage) => {
    const app = applications.find((item) => item.id === dragId)
    setDragId(null)
    setOverStage(null)
    if (app && app.stage !== stage) {
      try {
        await onMove(app.id, stage)
      } catch {
        /* el hook revierte el cambio optimista */
      }
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-5 py-4" aria-label="Pipeline de selección">
      {STAGES.map((stage) => {
        const items = applications.filter((app) => app.stage === stage.value)
        return (
          <section
            key={stage.value}
            aria-label={stage.label}
            onDragOver={(e) => {
              e.preventDefault()
              setOverStage(stage.value)
            }}
            onDragLeave={() => setOverStage((current) => (current === stage.value ? null : current))}
            onDrop={() => drop(stage.value)}
            className={cn(
              'flex w-60 shrink-0 flex-col rounded-lg border bg-canvas transition-colors',
              overStage === stage.value ? 'border-brand bg-brand-soft' : 'border-line',
            )}
          >
            <header className="flex items-center justify-between px-3 py-2">
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[stage.tone])}>{stage.label}</span>
              <span className="text-xs text-muted tabular-nums">{items.length}</span>
            </header>
            <ol className="flex min-h-24 flex-col gap-2 px-2 pb-2">
              {items.map((app) => (
                <li
                  key={app.id}
                  draggable
                  onDragStart={() => setDragId(app.id)}
                  onDragEnd={() => setDragId(null)}
                  className={cn(
                    'rounded-md border border-line bg-white p-2.5 shadow-[0_1px_2px_rgb(17_28_54/5%)] transition-opacity',
                    dragId === app.id && 'opacity-50',
                  )}
                >
                  <Link to={adminRequestDetailPath(app.id)} className="block font-medium text-ink hover:text-brand">
                    {app.candidate_name}
                  </Link>
                  <p className="truncate text-xs text-muted">{app.job_title}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <ScoreBadge status={app.ai_status} score={app.ai_score} fit={app.ai_fit} compact />
                    <span className="truncate text-[11px] text-muted" title={nameById[app.assigned_to] ?? 'Sin asignar'}>
                      {nameById[app.assigned_to]?.split(' ')[0] ?? 'Sin asignar'} · {haceCuanto(app.created_at)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
