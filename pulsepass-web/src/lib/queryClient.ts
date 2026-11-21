import { QueryClient } from '@tanstack/react-query'
import { esApiError } from './http.ts'

/**
 * Política de reintentos (PRD §14.3):
 * - 4xx: nunca se reintenta (401/403/404/409 no cambian al repetir).
 * - Red y 5xx: un único reintento.
 * - Mutaciones: nunca se reintentan (evita compras duplicadas).
 */
export function debeReintentar(intentosFallidos: number, error: unknown): boolean {
  if (esApiError(error) && error.status >= 400 && error.status < 500) return false
  return intentosFallidos < 1
}

export const TIEMPOS = {
  segundos15: 15_000,
  segundos30: 30_000,
  minuto: 60_000,
  minutos5: 300_000,
} as const

export function crearQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: debeReintentar,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}
