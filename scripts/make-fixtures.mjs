// Genera CVs de prueba (PDF vía Chromium y DOCX mínimo) en tests/fixtures/.
// Uso: node scripts/make-fixtures.mjs
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { strToU8, zipSync } from 'fflate'
import { CV_JEFE, CV_SIN_LIDERAZGO } from '../tests/unit/fixtures.js'

const html = (text) => `<html><body style="font:12px sans-serif;padding:32px">${text
  .split('\n')
  .map((line) => `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
  .join('')}</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage()
for (const [name, text] of [['cv-jefe.pdf', CV_JEFE], ['cv-operaria.pdf', CV_SIN_LIDERAZGO]]) {
  await page.setContent(html(text))
  writeFileSync(`tests/fixtures/${name}`, await page.pdf({ format: 'A4' }))
}
await browser.close()

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const body = CV_JEFE.split('\n').map((l) => `<w:p><w:r><w:t xml:space="preserve">${esc(l)}</w:t></w:r></w:p>`).join('')
const docx = zipSync({
  '[Content_Types].xml': strToU8('<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
  '_rels/.rels': strToU8('<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
  'word/document.xml': strToU8(`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`),
})
writeFileSync('tests/fixtures/cv-jefe.docx', docx)
console.log('fixtures ok')
