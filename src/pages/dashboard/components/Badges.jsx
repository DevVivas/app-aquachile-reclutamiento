import { AlertTriangle, Loader2, Sparkles } from 'lucide-react'
import { FIT, STAGE_BY_VALUE } from '@/constants/pipeline.js'
import { cn } from '@/lib/utils.js'
import { TONES } from './tones.js'



export function Pill({ tone = 'slate', className, children, ...props }) {
  return (
    <span
      className={cn('inline-flex h-6 items-center gap-1 rounded-full px-2 text-xs font-medium ring-1 ring-inset', TONES[tone], className)}
      {...props}
    >
      {children}
    </span>
  )
}

export function StageBadge({ stage }) {
  const meta = STAGE_BY_VALUE[stage] ?? { label: stage, tone: 'slate' }
  return <Pill tone={meta.tone}>{meta.label}</Pill>
}

export function ScoreBadge({ status, score, fit, compact = false }) {
  if (status === 'pending' || status === 'processing') {
    return (
      <Pill tone="slate" aria-label="Análisis IA en curso">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        {!compact && 'Analizando'}
      </Pill>
    )
  }
  if (status === 'error' || score == null) {
    return (
      <Pill tone="red" title="El análisis falló; puedes reintentarlo desde el detalle">
        <AlertTriangle className="size-3" aria-hidden="true" />
        {!compact && 'Sin análisis'}
      </Pill>
    )
  }
  const meta = FIT[fit] ?? FIT.bajo
  return (
    <Pill tone={meta.tone} title={`${meta.label} · puntaje IA ${score}/100`} data-testid="ai-score">
      <Sparkles className="size-3" aria-hidden="true" />
      <span className="tabular-nums">{score}</span>
      {!compact && <span className="font-normal opacity-80">· {fit}</span>}
    </Pill>
  )
}
