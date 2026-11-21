import { useQuery } from '@tanstack/react-query'
import { CLAVES } from '../../lib/clavesQuery.ts'
import { TIEMPOS } from '../../lib/queryClient.ts'
import { listarArtistasActivos, obtenerArtista, obtenerArtistaPorNombre } from './api.ts'

/** #11 GET /api/artists/active */
export function useArtistasActivos() {
  return useQuery({
    queryKey: CLAVES.artistasActivos,
    queryFn: listarArtistasActivos,
    staleTime: TIEMPOS.minutos5,
  })
}

/** #9 GET /api/artists/{id}. `id` null = parámetro inválido → no se consulta la API. */
export function useArtista(id: number | null) {
  return useQuery({
    queryKey: CLAVES.artista(id ?? -1),
    queryFn: () => obtenerArtista(id ?? -1),
    enabled: id !== null,
    staleTime: TIEMPOS.minutos5,
  })
}

/** #10 GET /api/artists/by-stage-name?stageName= (resuelve ?artista= de la cartelera) */
export function useArtistaPorNombre(stageName: string) {
  return useQuery({
    queryKey: CLAVES.artistaPorNombre(stageName),
    queryFn: () => obtenerArtistaPorNombre(stageName),
    enabled: stageName !== '',
    staleTime: TIEMPOS.minutos5,
  })
}
