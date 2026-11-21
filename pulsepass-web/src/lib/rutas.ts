/**
 * Rutas centralizadas (FE-003): ningún componente escribe strings de ruta sueltos.
 * Los segmentos dinámicos se codifican con encodeURIComponent.
 */
const e = encodeURIComponent

export const RUTAS = {
  inicio: '/',
  eventos: '/eventos',
  evento: (eventCode: string) => `/eventos/${e(eventCode)}`,
  artistas: '/artistas',
  artista: (id: number) => `/artistas/${String(id)}`,
  sedes: '/sedes',
  sede: (code: string) => `/sedes/${e(code)}`,
  login: '/login',
  registro: '/registro',
  cuenta: '/cuenta',
  misTickets: '/mis-tickets',
  ticket: (ticketCode: string) => `/mis-tickets/${e(ticketCode)}`,
  confirmacion: (ticketCode: string) => `/compra/confirmacion/${e(ticketCode)}`,
  staffValidacion: '/staff/validacion',
  staffTicketsPagados: (eventCode: string) => `/staff/eventos/${e(eventCode)}/tickets`,
  adminEventos: '/admin/eventos',
  adminNuevoEvento: '/admin/eventos/nuevo',
  adminEvento: (eventCode: string) => `/admin/eventos/${e(eventCode)}`,
  sinPermisos: '/403',
} as const

/** Patrones de ruta (con parámetros) usados para declarar el árbol en router.tsx. */
export const PATRONES = {
  eventos: 'eventos',
  evento: 'eventos/:eventCode',
  artistas: 'artistas',
  artista: 'artistas/:id',
  sedes: 'sedes',
  sede: 'sedes/:code',
  login: 'login',
  registro: 'registro',
  cuenta: 'cuenta',
  misTickets: 'mis-tickets',
  ticket: 'mis-tickets/:ticketCode',
  confirmacion: 'compra/confirmacion/:ticketCode',
  staffValidacion: 'staff/validacion',
  staffTicketsPagados: 'staff/eventos/:eventCode/tickets',
  adminEventos: 'admin/eventos',
  adminNuevoEvento: 'admin/eventos/nuevo',
  adminEvento: 'admin/eventos/:eventCode',
  sinPermisos: '403',
  noEncontrada: '*',
} as const

/** Estado de navegación que transportan las redirecciones a /login. */
export interface EstadoNavegacionLogin {
  desde?: string
  motivo?: 'expirada'
  registrado?: boolean
}
