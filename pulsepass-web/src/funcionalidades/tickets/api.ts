import { http, segmento } from '../../lib/http.ts'
import {
  ListaTicketsSchema,
  PurchaseTicketRequestSchema,
  TicketResponseSchema,
  type PurchaseTicketRequest,
} from './tipos.ts'

/** #15 POST /api/tickets (USER) — el email proviene de la sesión, nunca de un campo editable. */
export function comprarTicket(solicitud: PurchaseTicketRequest) {
  return http.post('/tickets', TicketResponseSchema, PurchaseTicketRequestSchema.parse(solicitud))
}

/** #16 GET /api/tickets/{ticketCode} */
export function obtenerTicket(ticketCode: string) {
  return http.get(`/tickets/${segmento(ticketCode)}`, TicketResponseSchema)
}

/** #17 GET /api/tickets/by-user?email= (GAP-03: se usa el email de /api/auth/me) */
export function listarTicketsDeUsuario(email: string) {
  return http.get('/tickets/by-user', ListaTicketsSchema, { email })
}

/** #18 GET /api/events/{eventCode}/tickets/paid (STAFF/ADMIN) */
export function listarTicketsPagados(eventCode: string) {
  return http.get(`/events/${segmento(eventCode)}/tickets/paid`, ListaTicketsSchema)
}

/** #19 PATCH /api/tickets/{ticketCode}/cancel */
export function cancelarTicket(ticketCode: string) {
  return http.patch(`/tickets/${segmento(ticketCode)}/cancel`, TicketResponseSchema)
}

/** #20 PATCH /api/tickets/{ticketCode}/use (STAFF/ADMIN) */
export function usarTicket(ticketCode: string) {
  return http.patch(`/tickets/${segmento(ticketCode)}/use`, TicketResponseSchema)
}
