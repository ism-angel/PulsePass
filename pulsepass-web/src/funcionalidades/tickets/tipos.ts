import { z } from 'zod'
import { DineroSchema, FechaHoraLocalSchema } from '../comunes.ts'

export const TicketTypeSchema = z.enum(['GENERAL', 'VIP', 'BACKSTAGE', 'STUDENT'])
export type TicketType = z.infer<typeof TicketTypeSchema>

export const TicketStatusSchema = z.enum(['RESERVED', 'PAID', 'CANCELLED', 'USED'])
export type TicketStatus = z.infer<typeof TicketStatusSchema>

/** TicketResponse.java — confirmado: el titular solo se expone como userEmail. */
export const TicketResponseSchema = z.object({
  id: z.number().int(),
  ticketCode: z.string(),
  type: TicketTypeSchema,
  price: DineroSchema,
  status: TicketStatusSchema,
  purchaseDate: FechaHoraLocalSchema,
  userEmail: z.string(),
  eventCode: z.string(),
  eventName: z.string(),
})
export type TicketResponse = z.infer<typeof TicketResponseSchema>

export const ListaTicketsSchema = z.array(TicketResponseSchema)

/** Formulario de compra: solo el tipo (el email sale de la sesión; §24.3). */
export const CompraFormSchema = z.object({ type: TicketTypeSchema })
export type CompraForm = z.infer<typeof CompraFormSchema>

/** PurchaseTicketRequest.java */
export const PurchaseTicketRequestSchema = z.object({
  userEmail: z.email(),
  eventCode: z.string().min(1),
  type: TicketTypeSchema,
})
export type PurchaseTicketRequest = z.infer<typeof PurchaseTicketRequestSchema>

/** Formulario de validación de ingreso (STAFF). */
export const BuscarTicketSchema = z.object({
  ticketCode: z.string().trim().min(1, 'Ingresa el código del ticket'),
})
export type BuscarTicketForm = z.infer<typeof BuscarTicketSchema>
