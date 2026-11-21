import type { Rol } from '../funcionalidades/auth/tipos.ts'
import { RUTAS } from '../lib/rutas.ts'
import { STAFF_SIN_EVENTO } from './constantes.ts'

export interface EnlaceNav {
  a: string
  texto: string
  fin?: boolean
  /** Roles que ven el enlace; vacío = todos (tabla 8.4). */
  roles: readonly Rol[]
}

/** Enlaces calculados desde RUTAS y el rol (DES-03, tabla 8.4). Solo UX: el servidor sigue autorizando. */
export const ENLACES: readonly EnlaceNav[] = [
  { a: RUTAS.eventos, texto: 'Eventos', roles: [] },
  { a: RUTAS.artistas, texto: 'Artistas', roles: [] },
  { a: RUTAS.sedes, texto: 'Sedes', roles: [] },
  { a: RUTAS.misTickets, texto: 'Mis tickets', roles: ['USER'] },
  { a: RUTAS.staffValidacion, texto: 'Validar ingreso', roles: ['STAFF', 'ADMIN'] },
  {
    a: RUTAS.staffTicketsPagados(STAFF_SIN_EVENTO),
    texto: 'Tickets pagados',
    roles: ['STAFF', 'ADMIN'],
  },
  { a: RUTAS.adminEventos, texto: 'Administrar eventos', roles: ['ADMIN'] },
]
