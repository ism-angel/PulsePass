import { use } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CLAVES } from '../../lib/clavesQuery.ts'
import { obtenerUsuarioActual } from './api.ts'
import { AuthContext } from './contexto.ts'
import type { LoginForm } from './tipos.ts'

/** Acceso al AuthContext (sesion, iniciarSesion, cerrarSesion, tieneRol). */
export function useAuth() {
  const valor = use(AuthContext)
  if (!valor) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return valor
}

/** A2 GET /api/auth/me — identidad y roles del token vigente (usado por AuthProvider). */
export function useSesion(token: string | null) {
  return useQuery({
    queryKey: CLAVES.sesion(token),
    queryFn: obtenerUsuarioActual,
    enabled: token !== null,
    staleTime: Infinity,
    retry: false,
  })
}

/** A1 POST /api/auth/login + GET /api/auth/me. */
export function useLogin() {
  const { iniciarSesion } = useAuth()
  return useMutation({
    mutationFn: (datos: LoginForm) => iniciarSesion(datos.identifier, datos.password),
  })
}

/** Email del principal (GAP-03) o null si no hay sesión. */
export function useEmailSesion(): string | null {
  const { sesion } = useAuth()
  return sesion.estado === 'autenticado' ? sesion.usuario.email : null
}
