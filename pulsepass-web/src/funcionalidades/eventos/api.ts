import { http, segmento } from '../../lib/http.ts'
import {
  CreateEventRequestSchema,
  EventResponseSchema,
  ListaEventosSchema,
  type CrearEventoForm,
} from './tipos.ts'

/** El input datetime-local entrega "AAAA-MM-DDTHH:mm"; el LocalDateTime del backend acepta segundos. */
export function aCreateEventRequest(form: CrearEventoForm) {
  return CreateEventRequestSchema.parse({
    eventCode: form.eventCode.trim(),
    name: form.name.trim(),
    description: form.description.trim() === '' ? null : form.description.trim(),
    category: form.category,
    eventDate: form.eventDate.length === 16 ? `${form.eventDate}:00` : form.eventDate,
    minimumAge: form.minimumAge,
    venueCode: form.venueCode,
  })
}

/** #3 POST /api/events (ADMIN) */
export function crearEvento(form: CrearEventoForm) {
  return http.post('/events', EventResponseSchema, aCreateEventRequest(form))
}

/** #4 GET /api/events/{eventCode} (público si PUBLISHED; borradores solo STAFF/ADMIN) */
export function obtenerEvento(eventCode: string) {
  return http.get(`/events/${segmento(eventCode)}`, EventResponseSchema)
}

/** #5 GET /api/events/published */
export function listarEventosPublicados() {
  return http.get('/events/published', ListaEventosSchema)
}

/** #6 PATCH /api/events/{eventCode}/publish (ADMIN) */
export function publicarEvento(eventCode: string) {
  return http.patch(`/events/${segmento(eventCode)}/publish`, EventResponseSchema)
}

/** #7 POST /api/events/{eventCode}/artists/{artistId} (ADMIN) */
export function asociarArtista(eventCode: string, artistId: number) {
  return http.post(
    `/events/${segmento(eventCode)}/artists/${segmento(artistId)}`,
    EventResponseSchema,
  )
}

/** #8 GET /api/events/by-artist?stageName= */
export function listarEventosPorArtista(stageName: string) {
  return http.get('/events/by-artist', ListaEventosSchema, { stageName })
}
