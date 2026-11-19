import { useState } from 'react'
import { AlertTriangle, Check, Loader2, RefreshCw, Sparkles, X } from 'lucide-react'
import { FIT } from '@/constants/pipeline.js'
import { cn } from '@/lib/utils.js'
import { fechaHoraFormato } from '@/utils/formatDate.js'
import { TONES } from './tones.js'

const RUBRIC_LABELS = {
  leadership: 'Liderazgo',
  experience: 'Experiencia',
  familyMatch: 'Afinidad con la familia',
  roleMatch: 'Afinidad con el cargo',
  education: 'Formación',
}

const RING_COLORS = { alto: '#16a34a', medio: '#d97706', bajo: '#dc2626' }

function ScoreRing({ score, fit }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative grid size-16 shrink-0 place-items-center" aria-label={`Puntaje ${score} de 100`}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="#eef0f5" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={RING_COLORS[fit] ?? RING_COLORS.bajo}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(0.23, 1, 0.32, 1)' }}
        />
      </svg>
      <span className="text-lg font-semibold tabular-nums" data-testid="ai-score-value">{score}</span>
    </div>
  )
}

function List({ items, icon: Icon, tone }) {
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

export default function AiPanel({ application, onReanalyze }) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const { ai_status: status, ai_score: score, ai_fit: fit, ai_summary: summary, ai_analysis: analysis } = application
  const rubric = analysis?.rubric
  const busy = running || status === 'pending' || status === 'processing'

  const handleReanalyze = async () => {
    setRunning(true)
    setError(null)
    try {
      await onReanalyze()
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <section className="rounded-lg border border-line bg-white" aria-labelledby="ai-title">
      <header className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 id="ai-title" className="flex items-center gap-1.5 text-[13px] font-semibold">
          <Sparkles className="size-4 text-brand" aria-hidden="true" /> Análisis IA del CV
        </h2>
        <button
          type="button"
          onClick={handleReanalyze}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-canvas hover:text-ink disabled:opacity-50"
        >
          <RefreshCw className={cn('size-3.5', busy && 'animate-spin')} aria-hidden="true" />
          {busy ? 'Analizando…' : 'Re-analizar'}
        </button>
      </header>

      <div className="space-y-4 p-4">
        {error && <p className="text-xs text-red-700" role="alert">{error}</p>}

        {busy && status !== 'done' && (
          <p className="flex items-center gap-2 text-muted" role="status">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Leyendo el CV y comparándolo con el cargo…
          </p>
        )}

        {status === 'error' && !busy && (
          <p className="flex items-start gap-2 text-red-700" role="alert">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            No se pudo analizar el CV: {application.ai_error ?? 'error desconocido'}.
          </p>
        )}

        {status === 'done' && score != null && (
          <>
            <div className="flex items-center gap-3">
              <ScoreRing score={score} fit={fit} />
              <div className="min-w-0">
                <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', TONES[FIT[fit]?.tone ?? 'slate'])}>
                  {FIT[fit]?.label ?? fit}
                </span>
                {analysis?.recommendation && <p className="mt-1 text-[13px] font-medium">{analysis.recommendation}</p>}
                {rubric?.requiresLeadership && (
                  <p className="text-xs text-muted">Cargo de jefatura: la experiencia liderando equipos pesa 35%.</p>
                )}
              </div>
            </div>

            <p className="text-[13px] leading-relaxed" data-testid="ai-summary">{summary}</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-1.5 text-xs font-medium text-muted">Fortalezas</h3>
                <List items={analysis?.strengths} icon={Check} tone="text-green-600" />
              </div>
              <div>
                <h3 className="mb-1.5 text-xs font-medium text-muted">Brechas</h3>
                <List items={analysis?.concerns} icon={X} tone="text-red-600" />
              </div>
            </div>

            {(rubric?.signals?.leadershipEvidence?.length > 0 || analysis?.llm?.leadership_evidence?.length > 0) && (
              <div>
                <h3 className="mb-1.5 text-xs font-medium text-muted">Evidencia de liderazgo en el CV</h3>
                <ul className="space-y-1">
                  {(analysis?.llm?.leadership_evidence?.length ? analysis.llm.leadership_evidence : rubric.signals.leadershipEvidence).map((line) => (
                    <li key={line} className="rounded bg-canvas px-2 py-1 text-xs italic">“{line}”</li>
                  ))}
                </ul>
              </div>
            )}

            {rubric && (
              <div>
                <h3 className="mb-2 text-xs font-medium text-muted">Desglose de la rúbrica ({rubric.score}/100)</h3>
                <dl className="space-y-1.5">
                  {Object.entries(RUBRIC_LABELS).map(([key, label]) => {
                    const value = rubric.breakdown?.[key] ?? 0
                    const max = rubric.weights?.[key] ?? 1
                    return (
                      <div key={key} className="grid grid-cols-[140px_1fr_44px] items-center gap-2 text-xs">
                        <dt className="text-muted">{label}</dt>
                        <dd className="h-1.5 overflow-hidden rounded-full bg-[#eef0f5]">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${(value / max) * 100}%` }} />
                        </dd>
                        <dd className="text-right tabular-nums">{value}/{max}</dd>
                      </div>
                    )
                  })}
                </dl>
              </div>
            )}

            <p className="text-[11px] text-muted">
              {application.ai_model === 'rubrica-aquachile-v1' ? 'Rúbrica automática AquaChile' : `Modelo ${application.ai_model} + rúbrica`}
              {application.ai_analyzed_at && ` · ${fechaHoraFormato(application.ai_analyzed_at)}`}
              {analysis?.warning && ` · aviso: ${analysis.warning}`}. Apoyo a la decisión: no reemplaza la evaluación profesional.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
