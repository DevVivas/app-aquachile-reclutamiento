const PDF_MARKER = Buffer.from('%PDF-')
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04])
const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])

function startsWith(buffer, signature) {
  return buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature)
}

/**
 * Comprueba los primeros bytes del archivo contra la extensión declarada.
 * La extensión y el mimetype los controla el cliente; la firma no es infalible,
 * pero descarta archivos que solo cambian de nombre.
 */
export function hasValidSignature(extension, buffer) {
  if (!buffer || buffer.length === 0) return false

  switch (extension) {
    case '.pdf':
      // La especificación permite hasta 1024 bytes antes del marcador.
      return buffer.subarray(0, 1024).includes(PDF_MARKER)
    case '.docx':
      return startsWith(buffer, ZIP_SIGNATURE)
    case '.doc':
      return startsWith(buffer, OLE_SIGNATURE)
    default:
      return false
  }
}
