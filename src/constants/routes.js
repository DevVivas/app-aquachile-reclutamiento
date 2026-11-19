export const ROUTES = {
  form: '/',
  LOGIN: '/login',
  SIGNUP: '/registro',
  ADMIN: '/dashboard',
  ADMIN_REQUEST_DETAIL: '/dashboard/postulaciones/:id',
  ADMIN_TEAM: '/dashboard/equipo',
}

export const adminRequestDetailPath = (id) => `/dashboard/postulaciones/${id}`
