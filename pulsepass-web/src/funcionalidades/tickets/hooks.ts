import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CLAVES } from '../../lib/clavesQuery.ts'
import { TIEMPOS } from '../../lib/queryClient.ts'
import { useEmailSesion } from '../auth/hooks.ts'
import {
  cancelarTicket,
  comprarTicket,
  listarTicketsDeUsuario,
  listarTicketsPagados,
  obtenerTicket,
  usarTicket,
} from './api.ts'
import type { TicketType } from './tipos.ts'

/** #17 GET /api/tickets/by-user?email=<email de la sesión> */
export function useMisTickets() {
  const email = useEmailSesion()
  return useQuery({
    queryKey: CLAVES.ticketsUsuario(email ?? ''),
    queryFn: () => listarTicketsDeUsuario(email ?? ''),
    enabled: email !== null,
    staleTime: TIEMPOS.segundos15,
  })
}

/** #16 GET /api/tickets/{ticketCode}. `ticketCode` vacío = consulta deshabilitada (búsqueda bajo demanda). */
export function useTicket(ticketCode: string) {
  return useQuery({
    queryKey: CLAVES.ticket(ticketCode),
    queryFn: () => obtenerTicket(ticketCode),
    enabled: ticketCode !== '',
    staleTime: TIEMPOS.segundos15,
  })
}

/** Validación de ingreso: búsqueda bajo demanda reutilizando #16. */
export const useBuscarTicket = useTicket

/** #18 GET /api/events/{eventCode}/tickets/paid */
export function useTicketsPagadosPorEvento(eventCode: string) {
  return useQuery({
    queryKey: CLAVES.ticketsPagados(eventCode),
    queryFn: () => listarTicketsPagados(eventCode),
    enabled: eventCode !== '',
    staleTime: TIEMPOS.segundos15,
  })
}

interface VariablesCompra {
  eventCode: string
  type: TicketType
}

/** #15 POST /api/tickets — userEmail SIEMPRE desde la sesión (§24.3, AC-FE-010). */
export function useComprarTicket() {
  const email = useEmailSesion()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventCode, type }: VariablesCompra) => {
      if (!email) return Promise.reject(new Error('Sesión requerida'))
      return comprarTicket({ userEmail: email, eventCode, type })
    },
    onSuccess: async (ticket) => {
      queryClient.setQueryData(CLAVES.ticket(ticket.ticketCode), ticket)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CLAVES.ticketsUsuario(ticket.userEmail) }),
        queryClient.invalidateQueries({ queryKey: CLAVES.evento(ticket.eventCode) }),
      ])
    },
  })
}

/** #19 PATCH /api/tickets/{code}/cancel — invalida tickets del usuario, el ticket y los pagados del evento. */
export function useCancelarTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ticketCode: string) => cancelarTicket(ticketCode),
    onSuccess: async (ticket) => {
      queryClient.setQueryData(CLAVES.ticket(ticket.ticketCode), ticket)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CLAVES.ticketsUsuario(ticket.userEmail) }),
        queryClient.invalidateQueries({ queryKey: CLAVES.ticket(ticket.ticketCode) }),
        queryClient.invalidateQueries({ queryKey: CLAVES.ticketsPagados(ticket.eventCode) }),
      ])
    },
  })
}

/** #20 PATCH /api/tickets/{code}/use — invalida el ticket y los pagados del evento. */
export function useUsarTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ticketCode: string) => usarTicket(ticketCode),
    onSuccess: async (ticket) => {
      queryClient.setQueryData(CLAVES.ticket(ticket.ticketCode), ticket)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CLAVES.ticket(ticket.ticketCode) }),
        queryClient.invalidateQueries({ queryKey: CLAVES.ticketsPagados(ticket.eventCode) }),
      ])
    },
  })
}
