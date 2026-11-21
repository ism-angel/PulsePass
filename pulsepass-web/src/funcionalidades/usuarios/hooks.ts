import { useMutation, useQuery } from '@tanstack/react-query'
import { CLAVES } from '../../lib/clavesQuery.ts'
import { TIEMPOS } from '../../lib/queryClient.ts'
import { obtenerUsuarioPorEmail, obtenerUsuarioPorUsername, registrarUsuario } from './api.ts'
import type { RegisterUserRequest } from './tipos.ts'

/** #12 / A3 POST /api/users */
export function useRegistrarUsuario() {
  return useMutation({ mutationFn: (datos: RegisterUserRequest) => registrarUsuario(datos) })
}

/** #13 GET /api/users/by-email?email= */
export function useUsuarioPorEmail(email: string | null, opciones: { habilitado?: boolean } = {}) {
  return useQuery({
    queryKey: CLAVES.usuario(email ?? ''),
    queryFn: () => obtenerUsuarioPorEmail(email ?? ''),
    enabled: (opciones.habilitado ?? true) && email !== null,
    staleTime: TIEMPOS.minuto,
  })
}

/** #14 GET /api/users/by-username?username= */
export function useUsuarioPorUsername(
  username: string | null,
  opciones: { habilitado?: boolean } = {},
) {
  return useQuery({
    queryKey: CLAVES.usuarioPorUsername(username ?? ''),
    queryFn: () => obtenerUsuarioPorUsername(username ?? ''),
    enabled: (opciones.habilitado ?? true) && username !== null,
    staleTime: TIEMPOS.minuto,
  })
}
