export const ROUTES = {
	form: '/',
	ADMIN: '/dashboard',
	ADMIN_REQUEST_DETAIL: '/dashboard/solicitudes/:id',
}

export const adminRequestDetailPath = (id) => `/dashboard/solicitudes/${id}`