import { useQuery } from '@tanstack/react-query'
import { CLAVES } from '../../lib/clavesQuery.ts'
import { TIEMPOS } from '../../lib/queryClient.ts'
import { listarSedesActivas, obtenerSede } from './api.ts'

/** #2 GET /api/venues/active */
export function useSedesActivas() {
  return useQuery({
    queryKey: CLAVES.sedesActivas,
    queryFn: listarSedesActivas,
    staleTime: TIEMPOS.minutos5,
  })
}

/** #1 GET /api/venues/{code} */
export function useSede(code: string) {
  return useQuery({
    queryKey: CLAVES.sede(code),
    queryFn: () => obtenerSede(code),
    enabled: code !== '',
    staleTime: TIEMPOS.minutos5,
  })
}
