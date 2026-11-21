import { http, segmento } from '../../lib/http.ts'
import { ListaVenuesSchema, VenueResponseSchema } from './tipos.ts'

/** #1 GET /api/venues/{code} */
export function obtenerSede(code: string) {
  return http.get(`/venues/${segmento(code)}`, VenueResponseSchema)
}

/** #2 GET /api/venues/active */
export function listarSedesActivas() {
  return http.get('/venues/active', ListaVenuesSchema)
}
