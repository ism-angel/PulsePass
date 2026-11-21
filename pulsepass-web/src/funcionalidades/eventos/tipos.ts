import { z } from 'zod'
import { ArtistResponseSchema } from '../artistas/tipos.ts'
import { FechaHoraLocalSchema } from '../comunes.ts'

/** Enumeraciones replicadas como tipos literales (PRD §10.1). */
export const EventCategorySchema = z.enum([
  'MUSIC',
  'SPORTS',
  'TECHNOLOGY',
  'EDUCATION',
  'CULTURE',
  'ENTERTAINMENT',
])
export type EventCategory = z.infer<typeof EventCategorySchema>

export const EventStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'SOLD_OUT', 'CANCELLED', 'FINISHED'])
export type EventStatus = z.infer<typeof EventStatusSchema>

/** EventResponse.java — confirmado: venueCode/venueName planos y `artists` como lista de ArtistResponse. */
export const EventResponseSchema = z.object({
  id: z.number().int(),
  eventCode: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: EventCategorySchema,
  status: EventStatusSchema,
  eventDate: FechaHoraLocalSchema,
  minimumAge: z.number().int(),
  venueCode: z.string(),
  venueName: z.string(),
  artists: z
    .array(ArtistResponseSchema)
    .nullish()
    .transform((a) => a ?? []),
})
export type EventResponse = z.infer<typeof EventResponseSchema>

/** EventSummaryResponse.java — confirmado: solo trae venueName (no ciudad). */
export const EventSummaryResponseSchema = z.object({
  id: z.number().int(),
  eventCode: z.string(),
  name: z.string(),
  category: EventCategorySchema,
  status: EventStatusSchema,
  eventDate: FechaHoraLocalSchema,
  venueName: z.string(),
})
export type EventSummaryResponse = z.infer<typeof EventSummaryResponseSchema>

export const ListaEventosSchema = z.array(EventSummaryResponseSchema)

/** Límite de CreateEventRequest.description (@Size(max = 1000) en el backend). */
export const DESCRIPCION_MAX = 1000

/** Formulario "Nuevo evento" (PRD §9.17 / §11). eventDate llega del input datetime-local. */
export const CrearEventoFormSchema = z.object({
  eventCode: z.string().trim().min(1, 'Ingresa el código del evento'),
  name: z.string().trim().min(1, 'Ingresa el nombre del evento'),
  description: z
    .string()
    .max(DESCRIPCION_MAX, `La descripción admite máximo ${DESCRIPCION_MAX} caracteres`),
  category: EventCategorySchema,
  eventDate: z
    .string()
    .min(1, 'Ingresa la fecha y hora')
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/, 'Fecha y hora inválidas'),
  minimumAge: z
    .number({ error: 'Ingresa una edad mínima' })
    .int('La edad mínima debe ser un número entero')
    .min(0, 'La edad mínima debe ser mayor o igual a 0'),
  venueCode: z.string().min(1, 'Selecciona una sede'),
})
export type CrearEventoForm = z.infer<typeof CrearEventoFormSchema>

/** CreateEventRequest.java (cuerpo de POST /api/events). */
export const CreateEventRequestSchema = z.object({
  eventCode: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: EventCategorySchema,
  eventDate: FechaHoraLocalSchema,
  minimumAge: z.number().int(),
  venueCode: z.string(),
})
export type CreateEventRequest = z.infer<typeof CreateEventRequestSchema>

/** Filtros de la cartelera que viven en la URL (?q=&categoria=&artista=). */
export const FiltrosCarteleraSchema = z.object({
  q: z.string().catch(''),
  categoria: EventCategorySchema.or(z.literal('')).catch(''),
  artista: z.string().catch(''),
})
export type FiltrosCartelera = z.infer<typeof FiltrosCarteleraSchema>
