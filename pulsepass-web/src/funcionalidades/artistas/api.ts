import { http, segmento } from '../../lib/http.ts'
import { ArtistResponseSchema, ListaArtistasSchema } from './tipos.ts'

/** #9 GET /api/artists/{id} */
export function obtenerArtista(id: number) {
  return http.get(`/artists/${segmento(id)}`, ArtistResponseSchema)
}

/** #10 GET /api/artists/by-stage-name?stageName= */
export function obtenerArtistaPorNombre(stageName: string) {
  return http.get('/artists/by-stage-name', ArtistResponseSchema, { stageName })
}

/** #11 GET /api/artists/active */
export function listarArtistasActivos() {
  return http.get('/artists/active', ListaArtistasSchema)
}
