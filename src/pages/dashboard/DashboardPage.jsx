import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Columns3, Download, ExternalLink, Loader2, Rows3, Search } from 'lucide-react'
import { useAuth } from '@/auth/authContext.js'
import { JOB_FAMILIES, STAGES } from '@/constants/pipeline.js'
import { ROUTES } from '@/constants/routes.js'
import { cn } from '@/lib/utils.js'
import { applicationsToCsv, downloadCsv } from '@/utils/csv.js'
import BulkBar from './components/BulkBar.jsx'
import PipelineBoard from './components/PipelineBoard.jsx'
import RequestsTable from './components/RequestsTable.jsx'
import StatusTab from './components/StatusTab.jsx'
import { ALL, computeStats, filterApplications } from './filterApplications.js'
import { useApplications } from './hooks/useApplications.js'

function Kpi({ label, value, hint, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-w-0 flex-col items-start gap-0.5 rounded-lg border bg-white px-3.5 py-2.5 text-left transition-colors',
        active ? 'border-brand bg-brand-soft' : 'border-line hover:bg-canvas',
      )}
    >
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xl font-semibold tabular-nums text-ink">{value}</span>
      {hint && <span className="truncate text-[11px] text-muted">{hint}</span>}
    </button>
  )
}

const FILTER_SELECT =
  'h-8 rounded-md border border-line bg-white px-2 text-[13px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { applications, team, loading, error, assign, move } = useApplications()
  const [filters, setFilters] = useState({ stage: ALL, query: '', assignee: ALL, family: ALL, sort: 'recent' })
  const [view, setView] = useState('table')
  const [selected, setSelected] = useState(() => new Set())

  const setFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const stats = useMemo(() => computeStats(applications, user?.id), [applications, user?.id])
  const visible = useMemo(() => filterApplications(applications, filters, user?.id), [applications, filters, user?.id])
  const countFor = (stage) => (stage === ALL ? applications.length : applications.filter((app) => app.stage === stage).length)
  // Solo cuentan las seleccionadas que siguen visibles con los filtros actuales.
  const selectedVisible = visible.filter((app) => selected.has(app.id))

  const toggle = (id) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = (ids) =>
    setSelected((current) => (ids.every((id) => current.has(id)) ? new Set() : new Set(ids)))

  const bulk = (action) => async (value) => {
    const results = await Promise.allSettled(selectedVisible.map((app) => action(app.id, value)))
    const failed = results.filter((r) => r.status === 'rejected').length
    return { ok: results.length - failed, failed }
  }

  const exportCsv = () => {
    const rows = selectedVisible.length ? selectedVisible : visible
    downloadCsv(applicationsToCsv(rows, team), `postulaciones-${new Date().toISOString().slice(0, 10)}.csv`)
  }

  const boardSource = useMemo(
    () => filterApplications(applications, { ...filters, stage: ALL }, user?.id),
    [applications, filters, user?.id],
  )

  return (
    <>
      <header className="topbar">
        <h1>Postulaciones</h1>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-md border border-line p-0.5 sm:flex" role="group" aria-label="Vista">
            <button
              type="button"
              aria-pressed={view === 'table'}
              onClick={() => setView('table')}
              className={cn('grid size-6 place-items-center rounded', view === 'table' && 'bg-brand-soft text-brand')}
              title="Vista tabla"
            >
              <Rows3 size={14} aria-hidden="true" />
              <span className="sr-only">Vista tabla</span>
            </button>
            <button
              type="button"
              aria-pressed={view === 'board'}
              onClick={() => setView('board')}
              className={cn('grid size-6 place-items-center rounded', view === 'board' && 'bg-brand-soft text-brand')}
              title="Vista pipeline"
            >
              <Columns3 size={14} aria-hidden="true" />
              <span className="sr-only">Vista pipeline</span>
            </button>
          </div>
          <button type="button" className="btn-outline" onClick={exportCsv} disabled={!visible.length}>
            <Download size={14} aria-hidden="true" />
            {selectedVisible.length ? `Exportar ${selectedVisible.length}` : 'Exportar CSV'}
          </button>
          <Link to={ROUTES.form} target="_blank" className="btn-outline max-sm:hidden">
            <ExternalLink size={14} aria-hidden="true" />
            Formulario público
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-2 px-5 pt-4 md:grid-cols-4" aria-label="Resumen">
        <Kpi label="Sin asignar" value={stats.unassigned} hint="activas sin responsable" active={filters.assignee === 'none'} onClick={() => setFilter('assignee', filters.assignee === 'none' ? ALL : 'none')} />
        <Kpi label="Asignadas a mí" value={stats.mine} hint={profile?.full_name} active={filters.assignee === 'me'} onClick={() => setFilter('assignee', filters.assignee === 'me' ? ALL : 'me')} />
        <Kpi label="Afinidad alta (IA)" value={stats.highFit} hint="ordenar por puntaje" active={filters.sort === 'score'} onClick={() => setFilter('sort', filters.sort === 'score' ? 'recent' : 'score')} />
        <Kpi label="En evaluación psicolaboral" value={stats.inEvaluation} hint={`${stats.total} postulaciones en total`} active={filters.stage === 'evaluacion_psicolaboral'} onClick={() => setFilter('stage', filters.stage === 'evaluacion_psicolaboral' ? ALL : 'evaluacion_psicolaboral')} />
      </section>

      <div className="flex flex-wrap items-center gap-2 px-5 pt-3">
        <label className="relative min-w-[200px] flex-1">
          <span className="sr-only">Buscar postulante o cargo</span>
          <Search size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por nombre, cargo o correo…"
            value={filters.query}
            onChange={(e) => setFilter('query', e.target.value)}
            className={cn(FILTER_SELECT, 'w-full pl-8')}
          />
        </label>
        <select aria-label="Filtrar por responsable" className={FILTER_SELECT} value={filters.assignee} onChange={(e) => setFilter('assignee', e.target.value)}>
          <option value={ALL}>Todos los responsables</option>
          <option value="me">Asignadas a mí</option>
          <option value="none">Sin asignar</option>
          {team.filter((m) => m.approved).map((member) => (
            <option key={member.id} value={member.id}>{member.full_name}</option>
          ))}
        </select>
        <select aria-label="Filtrar por familia" className={FILTER_SELECT} value={filters.family} onChange={(e) => setFilter('family', e.target.value)}>
          <option value={ALL}>Todas las familias</option>
          {JOB_FAMILIES.map((family) => (
            <option key={family} value={family}>{family}</option>
          ))}
        </select>
        <select aria-label="Ordenar" className={FILTER_SELECT} value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)}>
          <option value="recent">Más recientes</option>
          <option value="score">Mayor afinidad IA</option>
        </select>
      </div>

      {view === 'table' && selectedVisible.length > 0 && (
        <BulkBar
          count={selectedVisible.length}
          ids={selectedVisible.map((app) => app.id)}
          team={team}
          onAssign={bulk(assign)}
          onMove={bulk(move)}
          onClear={() => setSelected(new Set())}
        />
      )}

      {view === 'table' && (
        <div className="toolbar" role="group" aria-label="Filtrar por etapa">
          <StatusTab label="Todas" count={countFor(ALL)} active={filters.stage === ALL} onClick={() => setFilter('stage', ALL)} />
          {STAGES.map((stage) => (
            <StatusTab
              key={stage.value}
              label={stage.short}
              count={countFor(stage.value)}
              active={filters.stage === stage.value}
              onClick={() => setFilter('stage', stage.value)}
            />
          ))}
        </div>
      )}

      {error && <p className="m-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800" role="alert">{error}</p>}

      {loading ? (
        <div className="grid place-items-center py-16 text-muted" role="status">
          <Loader2 className="size-5 animate-spin" aria-label="Cargando postulaciones" />
        </div>
      ) : view === 'board' ? (
        <PipelineBoard applications={boardSource} team={team} onMove={move} />
      ) : (
        <section className="requests-section" aria-label="Postulaciones">
          <RequestsTable
            applications={visible}
            team={team}
            onAssign={assign}
            selected={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            emptyText={applications.length ? 'No hay postulaciones con estos filtros.' : 'Aún no hay postulaciones. Comparte el formulario público para empezar.'}
          />
          <footer className="table-footer">
            {visible.length} de {applications.length} postulaciones · se actualiza en tiempo real
          </footer>
        </section>
      )}
    </>
  )
}
