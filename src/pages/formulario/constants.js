export { JOB_FAMILIES as FAMILIAS_CARGO } from '@/constants/pipeline.js'

export const MAX_CV_MB = 10
export const CV_ACCEPT = '.pdf,.doc,.docx'

export const INITIAL_FORM_STATE = {
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  jobFamily: '',
  jobTitle: '',
  cvFile: null,
}
