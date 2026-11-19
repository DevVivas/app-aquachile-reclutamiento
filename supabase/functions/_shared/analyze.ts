// Orquesta el análisis IA de una postulación: descarga CV → extrae texto → rúbrica → LLM → guarda.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { analyzeWithAi } from './ai.ts'
import { extractCvText } from './extract.ts'
import { scoreCv } from './scoring.ts'
import { detectCvType } from './validation.ts'

export async function analyzeApplication(admin: SupabaseClient, id: string) {
  const { data: app, error } = await admin
    .from('applications')
    .select('id, cv_path, job_title, job_family, cv_text')
    .eq('id', id)
    .single()
  if (error || !app) throw new Error(`Postulación ${id} no encontrada`)

  await admin.from('applications').update({ ai_status: 'processing', ai_error: null }).eq('id', id)

  try {
    let cvText: string = app.cv_text ?? ''
    if (!cvText) {
      const { data: blob, error: dlError } = await admin.storage.from('cvs').download(app.cv_path)
      if (dlError || !blob) throw new Error('No se pudo descargar el CV')
      const bytes = new Uint8Array(await blob.arrayBuffer())
      const type = detectCvType(bytes)
      if (!type) throw new Error('Formato de CV no reconocido')
      cvText = await extractCvText(bytes, type)
    }

    const rubric = scoreCv({ cvText, jobTitle: app.job_title, jobFamily: app.job_family })
    const { result, warning } = await analyzeWithAi(
      { cvText, jobTitle: app.job_title, jobFamily: app.job_family, rubric },
      (name) => Deno.env.get(name),
    )

    const { error: upError } = await admin
      .from('applications')
      .update({
        ai_status: 'done',
        ai_score: result.score,
        ai_fit: result.fit,
        ai_summary: result.summary,
        ai_analysis: { ...result.analysis, warning },
        ai_model: result.model,
        ai_error: null,
        ai_analyzed_at: new Date().toISOString(),
        cv_text: cvText,
      })
      .eq('id', id)
    if (upError) throw upError
    return result
  } catch (err) {
    const message = (err as Error).message ?? 'Error desconocido'
    await admin.from('applications').update({ ai_status: 'error', ai_error: message.slice(0, 500) }).eq('id', id)
    throw err
  }
}
