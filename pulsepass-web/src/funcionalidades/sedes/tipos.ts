import { z } from 'zod'

/** VenueResponse.java (Fase 2/3) — confirmado contra el backend. */
export const VenueResponseSchema = z.object({
  id: z.number().int(),
  code: z.string(),
  name: z.string(),
  city: z.string(),
  address: z.string().nullable(),
  capacity: z.number().int(),
  active: z.boolean(),
})
export type VenueResponse = z.infer<typeof VenueResponseSchema>

export const ListaVenuesSchema = z.array(VenueResponseSchema)
