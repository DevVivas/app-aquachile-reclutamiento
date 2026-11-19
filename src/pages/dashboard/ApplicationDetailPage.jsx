import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Download, ExternalLink, FileText, Loader2, Trash2 } from 'lucide-react'
import { useAuth } from '@/auth/authContext.js'
import { nextStage, STAGES } from '@/constants/pipeline.js'
import { ROUTES } from '@/constants/routes.js'
import {
  addNote,
  assignApplication,
  deleteApplication,
  getApplication,
  getCvUrl,
  listEvents,
  listNotes,
  moveApplication,
  reanalyze,
  subscribeToApplications,
} from '@/services/applicationsService.js'
import { listTeam } from '@/services/teamService.js'
import { fechaHoraFormato, formatBytes } from '@/utils/formatDate.js'
import ActivityPanel from './components/ActivityPanel.jsx'
import AiPanel from './components/AiPanel.jsx'
import AssigneeSelect from './components/AssigneeSelect.jsx'
import { ScoreBadge, StageBadge } from './components/Badges.jsx'

function CvViewer({ application }) {
  const [url, setUrl] = useState(null)
  const [failed, setFailed] = useState(false)
  const isPdf = application.cv_mime === 'application/pdf'

  useEffect(() => {
    let active = true
    getCvUrl(application.cv_path)
      .then((signed) => active && setUrl(signed))
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [application.cv_path])

  const download = async () => window.open(await getCvUrl(application.cv_path, { download: true }), '_blank', 'noopener')

  return (
    <section className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-line bg-white lg:h-[calc(100svh-120px)]" aria-label="Curriculum Vitae">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-brand" aria-hidden="true" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{application.cv_file_name}</p>
            <p className="truncate text-[11px] text-muted" title={`cvs/${application.cv_path}`}>
              Carpeta: cvs/{application.cv_folder}/ · {formatBytes(application.cv_size)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn-outline" title="Abrir en otra pestaña">
              <ExternalLink size={14} aria-hidden="true" />
              <span className="sr-only">Abrir CV en otra pestaña</span>
            </a>
          )}
          <button type="button" className="btn-outline" onClick={download}>
            <Download size={14} aria-hidden="true" /> Descargar
          </button>
        </div>
      </header>
      {failed && <p className="p-4 text-red-700" role="alert">No se pudo cargar el CV.</p>}
      {!failed && !url && (
        <div className="grid flex-1 place-items-center text-muted">
          <Loader2 className="size-5 animate-spin" aria-label="Cargando CV" />
        </div>
      )}
      {url && isPdf && <iframe title={`CV de ${application.candidate_name}`} src={`${url}#view=FitH&navpanes=0&pagemode=none`} className="w-full flex-1 border-0" data-testid="cv-frame" />}
      {url && !isPdf && (
        <div className="flex-1 overflow-auto p-4">
          <p className="mb-2 text-xs text-muted">Vista de texto del documento Word (descárgalo para ver el formato original).</p>
          <pre className="font-sans text-[13px] whitespace-pre-wrap" data-testid="cv-text">{application.cv_text || 'Texto aún no extraído.'}</pre>
        </div>
      )}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="truncate text-[13px]">{children || '—'}</dd>
    </div>
  )
}

export default function ApplicationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [application, setApplication] = useState(null)
  const [team, setTeam] = useState([])
  const [notes, setNotes] = useState([])
  const [events, setEvents] = useState([])
  const [status, setStatus] = useState('loading')
  const [actionError, setActionError] = useState(null)

  const refreshActivity = useCallback(async () => {
    const [nextNotes, nextEvents] = await Promise.all([listNotes(id), listEvents(id)])
    setNotes(nextNotes)
    setEvents(nextEvents)
  }, [id])

  useEffect(() => {
    let active = true
    Promise.all([getApplication(id), listTeam(), listNotes(id), listEvents(id)])
      .then(([app, members, nextNotes, nextEvents]) => {
        if (!active) return
        setApplication(app)
        setTeam(members)
        setNotes(nextNotes)
        setEvents(nextEvents)
        setStatus(app ? 'ready' : 'missing')
      })
      .catch(() => active && setStatus('error'))

    const unsubscribe = subscribeToApplications(({ new: row }) => {
      if (row?.id !== id) return
      // El payload de realtime no trae columnas grandes de forma fiable: recargamos la fila.
      getApplication(id).then((app) => active && app && setApplication(app))
      listEvents(id).then((nextEvents) => active && setEvents(nextEvents))
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [id])

  const run = async (action) => {
    setActionError(null)
    try {
      const saved = await action()
      if (saved) setApplication((current) => ({ ...current, ...saved }))
      await refreshActivity()
    } catch (err) {
      setActionError(err.message || 'No se pudo completar la acción.')
    }
  }

  if (status === 'loading') {
    return (
      <div className="grid place-items-center py-24 text-muted" role="status">
        <Loader2 className="size-5 animate-spin" aria-label="Cargando postulación" />
      </div>
    )
  }

  if (status !== 'ready') {
    return (
      <section className="placeholder-page mx-auto max-w-3xl px-8 py-16">
        <Link to={ROUTES.ADMIN} className="back-link">← Volver al panel</Link>
        <h1>{status === 'missing' ? 'Postulación no encontrada' : 'No se pudo cargar la postulación'}</h1>
      </section>
    )
  }

  const next = nextStage(application.stage)

  return (
    <>
      <header className="topbar">
        <Link to={ROUTES.ADMIN} className="back-link inline-flex items-center gap-1">
          <ArrowLeft size={14} aria-hidden="true" /> Postulaciones
        </Link>
        {isAdmin && (
          <button
            type="button"
            className="btn-outline text-red-700"
            onClick={async () => {
              if (!window.confirm(`¿Eliminar la postulación de ${application.candidate_name} y su CV? No se puede deshacer.`)) return
              await deleteApplication(application.id, application.cv_path)
              navigate(ROUTES.ADMIN)
            }}
          >
            <Trash2 size={14} aria-hidden="true" /> Eliminar
          </button>
        )}
      </header>

      <div className="space-y-4 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight" data-testid="candidate-name">{application.candidate_name}</h1>
            <p className="text-muted">
              Postula a <span className="font-medium text-ink">{application.job_title}</span> · {application.job_family}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StageBadge stage={application.stage} />
              <ScoreBadge status={application.ai_status} score={application.ai_score} fit={application.ai_fit} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="stage-select">Etapa</label>
            <select
              id="stage-select"
              value={application.stage}
              onChange={(e) => run(() => moveApplication(application.id, e.target.value))}
              className="h-8 rounded-md border border-line bg-white px-2 text-[13px] outline-none focus:border-brand"
            >
              {STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
            {application.stage !== 'descartado' && (
              <button
                type="button"
                onClick={() => run(() => moveApplication(application.id, 'descartado'))}
                className="inline-flex h-8 items-center rounded-md border border-line bg-white px-3 text-[13px] text-red-700 hover:bg-red-50"
              >
                Descartar
              </button>
            )}
            {next && application.stage !== 'descartado' && (
              <button
                type="button"
                onClick={() => run(() => moveApplication(application.id, next.value))}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand px-3 text-[13px] font-medium text-white transition-transform hover:bg-brand/90 active:scale-[0.97]"
              >
                Pasar a {next.label} <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {actionError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800" role="alert">{actionError}</p>}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,1fr)]">
          <div className="lg:sticky lg:top-[52px] lg:self-start">
            <CvViewer application={application} />
          </div>

          <div className="space-y-4">
            <section className="rounded-lg border border-line bg-white" aria-labelledby="data-title">
              <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
                <h2 id="data-title" className="text-[13px] font-semibold">Datos de la postulación</h2>
              </header>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4">
                <Field label="Nombre">{application.candidate_name}</Field>
                <Field label="Cargo">{application.job_title}</Field>
                <Field label="Correo">
                  {application.candidate_email && <a className="text-brand hover:underline" href={`mailto:${application.candidate_email}`}>{application.candidate_email}</a>}
                </Field>
                <Field label="Teléfono">
                  {application.candidate_phone && <a className="text-brand hover:underline" href={`tel:${application.candidate_phone.replace(/\s/g, '')}`}>{application.candidate_phone}</a>}
                </Field>
                <Field label="Familia de cargo">{application.job_family}</Field>
                <Field label="Recibido">{fechaHoraFormato(application.created_at)}</Field>
              </dl>
              <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
                <span className="text-[13px] font-medium">Evaluador responsable</span>
                <AssigneeSelect
                  value={application.assigned_to}
                  team={team}
                  onChange={(profileId) => run(() => assignApplication(application.id, profileId))}
                />
              </div>
            </section>

            <AiPanel
              application={application}
              onReanalyze={async () => {
                setApplication((current) => ({ ...current, ai_status: 'processing' }))
                await reanalyze(application.id).finally(async () => setApplication(await getApplication(application.id)))
              }}
            />

            <ActivityPanel
              notes={notes}
              events={events}
              team={team}
              onAddNote={async (body) => {
                await addNote(application.id, body)
                await refreshActivity()
              }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
