import { candidates, requests } from './mock/mockData.js'

// TODO: reemplazar por llamadas HTTP cuando exista el backend.
export function getRequests() {
  return requests
}

export function getCandidates() {
  return candidates
}
