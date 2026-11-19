// Extracción de texto del CV dentro de la Edge Function (Deno).
import { extractText, getDocumentProxy } from 'npm:unpdf@0.12.1'
import { strFromU8, unzipSync } from 'npm:fflate@0.8.2'
import type { CvExtension } from './validation.ts'

export const MAX_TEXT = 40000

export function docxXmlToText(xml: string): string {
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<\/w:p>|<w:br\/>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

// .doc binario: rescata las corridas de texto legible (suficiente para análisis).
function legacyDocToText(bytes: Uint8Array): string {
  const utf16 = new TextDecoder('utf-16le').decode(bytes)
  const runs = utf16.match(/[\p{L}\p{N}\p{P}\s]{4,}/gu) ?? []
  return runs.join(' ')
}

export async function extractCvText(bytes: Uint8Array, type: CvExtension): Promise<string> {
  let text = ''
  if (type === 'pdf') {
    const pdf = await getDocumentProxy(bytes)
    const result = await extractText(pdf, { mergePages: true })
    text = Array.isArray(result.text) ? result.text.join('\n') : result.text
  } else if (type === 'docx') {
    const files = unzipSync(bytes, { filter: (file) => file.name === 'word/document.xml' })
    const xml = files['word/document.xml']
    text = xml ? docxXmlToText(strFromU8(xml)) : ''
  } else {
    text = legacyDocToText(bytes)
  }
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, MAX_TEXT)
}
