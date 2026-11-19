import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, Crown, Loader2, X } from 'lucide-react'
import { FIT, STAGE_BY_VALUE } from '@/constants/pipeline.js'
import { adminRequestDetailPath, ROUTES } from '@/constants/routes.js'
import { cn } from '@/lib/utils.js'
import { getApplication } from '@/services/applicationsService.js'
import { listTeam } from '@/services/teamService.js'
import { TONES } from '@/pages/dashboard/components/tones.js'
import { CRITERIA, leadersByCriterion, parseIds, sameRole } from './compare.js'

function Bar({ value, max, leading }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef0f5]">
        <div className={cn('h-full rounded-full', leading ? 'bg-green-600' : 'bg-brand/60')} style={{ width: `${(value / max) * 100}%` }} />
      </div>
      <span className={cn('w-12 text-right text-xs tabular-nums', leading && 'font-semibold text-green-700')}>
        {value}/{max}
      </span>
    </div>
  )
}

function Items({ items, icon: Icon, tone }) {
  if (!items?.length) return <p className="text-xs text-muted">—</p>
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item} className="flex gap-1.5 text-[13px] leading-snug">
          <Icon className={cn('mt-0.5 size-3.5 shrink-0', tone)} aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Row({ label, columns, children }) {
  return (
    <div className="grid items-start gap-4 border-b border-line px-5 py-3" style={columns} role="row">
      <div className="text-xs font-medium text-muted" role="rowheader">{label}</div>
      {children}
    </div>
  )
}

export default function ComparePage() {
  const { search } = useLocation()
  const [state, setState] = useState({ status: 'loading', apps: [], team: [] })

  useEffect(() => {
    const ids = parseIds(search)
    let active = true
    if (ids.length < 2) {
      Promise.resolve().then(() => active && setState({ status: 'invalid', apps: [], team: [] }))
      return () => {
        active = false
      }
    }
    Promise.all([Promise.all(ids.map(getApplication)), listTeam()])
      .then(([apps, team]) => active && setState({ status: 'ready', apps: apps.filter(Boolean), team }))
      .catch(() => active && setState({ status: 'error', apps: [], team: [] }))
    return () => {
      active = false
    }
  }, [search])

  const { status, apps, team } = state
  const nameOf = (id) => team.find((member) => member.id === id)?.full_name ?? 'Sin asignar'

  if (status === 'loading') {
    return (
      <div className="grid place-items-center py-24 text-muted" role="status">
        <Loader2 className="size-5 animate-spin" aria-label="Cargando comparación" />
      </div>
    )
  }

  if (status !== 'ready' || apps.length < 2) {
    return (
      <section className="placeholder-page mx-auto max-w-3xl px-8 py-16">
        <Link to={ROUTES.ADMIN} className="back-link">← Volver al panel</Link>
        <h1>Selecciona entre 2 y 3 postulaciones para comparar</h1>
      </section>
    )
  }

  const leaders = leadersByCriterion(apps)
  const columns = { gridTemplateColumns: `160px repeat(${apps.length}, minmax(0, 1fr))` }

  return (
    <>
      <header className="topbar">
        <Link to={ROUTES.ADMIN} className="back-link inline-flex items-center gap-1">
          <ArrowLeft size={14} aria-hidden="true" /> Postulaciones
        </Link>
        <h1>Comparar postulantes</h1>
      </header>

      {!sameRole(apps) && (
        <p className="mx-5 mt-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900" role="note">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          Postulan a cargos distintos: el puntaje IA se calcula contra cada cargo, compáralo con cautela.
        </p>
      )}

      <div className="overflow-x-auto" role="table" aria-label="Comparación de postulantes">
        {/* Ancho mínimo por columna; sobre eso las celdas se ajustan y el texto envuelve. */}
        <div style={{ minWidth: 160 + apps.length * 236 + 40 }}>
          <Row columns={columns} label="Postulante">
            {apps.map((app) => (
              <div key={app.id} role="cell">
                <Link to={adminRequestDetailPath(app.id)} className="text-[15px] font-semibold text-ink hover:text-brand">
                  {app.candidate_name}
                </Link>
                <p className="text-xs text-muted">{app.job_title} · {app.job_family}</p>
              </div>
            ))}
          </Row>
          <Row columns={columns} label="Puntaje IA">
            {apps.map((app) => (
              <div key={app.id} role="cell" className="flex items-center gap-2" data-testid="compare-score">
                <span className="text-2xl font-semibold tabular-nums">{app.ai_score ?? '—'}</span>
                {app.ai_fit && (
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[FIT[app.ai_fit]?.tone])}>
                    {FIT[app.ai_fit]?.label}
                  </span>
                )}
                {leaders.total.includes(app.id) && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                    <Crown className="size-3.5" aria-hidden="true" /> Mejor afinidad
                  </span>
                )}
              </div>
            ))}
          </Row>
          {CRITERIA.map(({ key, label }) => (
            <Row key={key} columns={columns} label={label}>
              {apps.map((app) => {
                const rubric = app.ai_analysis?.rubric
                return (
                  <div key={app.id} role="cell">
                    {rubric ? (
                      <Bar value={rubric.breakdown?.[key] ?? 0} max={rubric.weights?.[key] ?? 1} leading={leaders[key].includes(app.id)} />
                    ) : (
                      <span className="text-xs text-muted">Sin análisis</span>
                    )}
                  </div>
                )
              })}
            </Row>
          ))}
          <Row columns={columns} label="Señales">
            {apps.map((app) => {
              const signals = app.ai_analysis?.rubric?.signals ?? {}
              return (
                <div key={app.id} role="cell">
                <dl className="space-y-0.5 text-[13px]">
                  <div><dt className="inline text-muted">Experiencia: </dt><dd className="inline">{signals.yearsExperience != null ? `~${signals.yearsExperience} años` : '—'}</dd></div>
                  <div><dt className="inline text-muted">Equipo a cargo: </dt><dd className="inline">{signals.maxTeamSize ? `hasta ${signals.maxTeamSize} personas` : '—'}</dd></div>
                  <div><dt className="inline text-muted">Formación: </dt><dd className="inline">{signals.education ?? '—'}</dd></div>
                </dl>
                </div>
              )
            })}
          </Row>
          <Row columns={columns} label="Fortalezas">
            {apps.map((app) => <div key={app.id} role="cell"><Items items={app.ai_analysis?.strengths} icon={Check} tone="text-green-600" /></div>)}
          </Row>
          <Row columns={columns} label="Brechas">
            {apps.map((app) => <div key={app.id} role="cell"><Items items={app.ai_analysis?.concerns} icon={X} tone="text-red-600" /></div>)}
          </Row>
          <Row columns={columns} label="Recomendación IA">
            {apps.map((app) => <p key={app.id} role="cell" className="text-[13px] font-medium">{app.ai_analysis?.recommendation || '—'}</p>)}
          </Row>
          <Row columns={columns} label="Proceso">
            {apps.map((app) => (
              <p key={app.id} role="cell" className="text-[13px]">
                {STAGE_BY_VALUE[app.stage]?.label} · {nameOf(app.assigned_to)}
              </p>
            ))}
          </Row>
        </div>
      </div>
      <p className="px-5 py-3 text-[11px] text-muted">
        En verde, quien lidera cada criterio. Apoyo a la decisión: no reemplaza la evaluación profesional.
      </p>
    </>
  )
}
