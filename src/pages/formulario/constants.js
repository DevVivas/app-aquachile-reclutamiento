export const INITIAL_FORM_STATE = {
  candidateName: '',
  jobFamily: '',
  jobTitle: '',
  cvFile: null,
}

export const CANDIDATE_NAME_MIN_LENGTH = 5
export const CANDIDATE_NAME_MAX_LENGTH = 80
export const JOB_TITLE_MIN_LENGTH = CANDIDATE_NAME_MIN_LENGTH
export const JOB_TITLE_MAX_LENGTH = CANDIDATE_NAME_MAX_LENGTH

export const INPUT_CLASSNAME =
  'form-input'

const NAME_PATTERN =
  /^[\p{L}][\p{L}\p{M}]*(?:[ '\u2019-][\p{L}][\p{L}\p{M}]*)*$/u

function validateName(value, subject) {
  const name = value.trim()

  if (name.length < CANDIDATE_NAME_MIN_LENGTH) {
    return `${subject} debe tener al menos ${CANDIDATE_NAME_MIN_LENGTH} caracteres.`
  }

  if (name.length > CANDIDATE_NAME_MAX_LENGTH) {
    return `${subject} no puede superar ${CANDIDATE_NAME_MAX_LENGTH} caracteres.`
  }

  if (!NAME_PATTERN.test(name)) {
    return `${subject}: usa solo letras, espacios, guiones o apóstrofes.`
  }

  return ''
}

export function validateCandidateName(value) {
  return validateName(value, 'El nombre')
}

export function validateJobTitle(value) {
  return validateName(value, 'El cargo')
}

export function capitalizeName(value) {
  return value.replace(/(^|[\s'\u2019-])(\p{L})/gu, (_, separator, letter) =>
    separator + letter.toLocaleUpperCase('es-CL'),
  )
}

export function capitalizeJobTitle(value) {
  return value.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase('es-CL'))
}
