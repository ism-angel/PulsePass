import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CLAVES } from '../../lib/clavesQuery.ts'
import { TIEMPOS } from '../../lib/queryClient.ts'
import {
  asociarArtista,
  crearEvento,
  listarEventosPorArtista,
  listarEventosPublicados,
  obtenerEvento,
  publicarEvento,
} from './api.ts'
import type { CrearEventoForm } from './tipos.ts'

/** #5 GET /api/events/published */
export function useEventosPublicados() {
  return useQuery({
    queryKey: CLAVES.eventosPublicados,
    queryFn: listarEventosPublicados,
    staleTime: TIEMPOS.minuto,
  })
}

/** #4 GET /api/events/{eventCode} */
export function useEvento(eventCode: string, opciones: { habilitado?: boolean } = {}) {
  return useQuery({
    queryKey: CLAVES.evento(eventCode),
    queryFn: () => obtenerEvento(eventCode),
    enabled: (opciones.habilitado ?? true) && eventCode !== '',
    staleTime: TIEMPOS.segundos30,
  })
}

/** #8 GET /api/events/by-artist?stageName= */
export function useEventosPorArtista(stageName: string) {
  return useQuery({
    queryKey: CLAVES.eventosPorArtista(stageName),
    queryFn: () => listarEventosPorArtista(stageName),
    enabled: stageName !== '',
    staleTime: TIEMPOS.minuto,
  })
}

/** #3 POST /api/events — siembra ['evento', eventCode] con el resultado (§14.2). */
export function useCrearEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (form: CrearEventoForm) => crearEvento(form),
    onSuccess: (evento) => {
      queryClient.setQueryData(CLAVES.evento(evento.eventCode), evento)
      void queryClient.invalidateQueries({
        queryKey: CLAVES.evento(evento.eventCode),
        refetchType: 'none',
      })
    },
  })
}

/** #6 PATCH /api/events/{eventCode}/publish — invalida ['evento', code] y ['eventos','publicados']. */
export function usePublicarEvento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventCode: string) => publicarEvento(eventCode),
    onSuccess: async (evento) => {
      queryClient.setQueryData(CLAVES.evento(evento.eventCode), evento)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CLAVES.evento(evento.eventCode) }),
        queryClient.invalidateQueries({ queryKey: CLAVES.eventosPublicados }),
      ])
    },
  })
}

interface VariablesAsociar {
  eventCode: string
  artistId: number
  stageName: string
}

/** #7 POST /api/events/{eventCode}/artists/{artistId} — invalida ['evento', code] y ['eventos','artista', stageName]. */
export function useAsociarArtista() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventCode, artistId }: VariablesAsociar) => asociarArtista(eventCode, artistId),
    onSuccess: async (evento, { stageName }) => {
      queryClient.setQueryData(CLAVES.evento(evento.eventCode), evento)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CLAVES.evento(evento.eventCode) }),
        queryClient.invalidateQueries({ queryKey: CLAVES.eventosPorArtista(stageName) }),
      ])
    },
  })
}
