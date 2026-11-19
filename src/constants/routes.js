export const ROUTES = {
	form: '/',
	LOGIN: '/login',
	ADMIN: '/dashboard',
	ADMIN_REQUEST_DETAIL: '/dashboard/solicitudes/:id',
}

export const adminRequestDetailPath = (id) => `/dashboard/solicitudes/${id}`