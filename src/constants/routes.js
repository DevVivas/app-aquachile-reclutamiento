export const ROUTES = {
  form: '/',
  LOGIN: '/login',
  SIGNUP: '/registro',
  ADMIN: '/dashboard',
  ADMIN_REQUEST_DETAIL: '/dashboard/postulaciones/:id',
  ADMIN_TEAM: '/dashboard/equipo',
  ADMIN_COMPARE: '/dashboard/comparar',
}

export const adminRequestDetailPath = (id) => `/dashboard/postulaciones/${id}`

export const comparePath = (ids) => `/dashboard/comparar?ids=${ids.join(',')}`
