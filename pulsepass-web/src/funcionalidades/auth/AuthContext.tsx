import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { registrarOyenteNoAutorizado } from '../../lib/http.ts'
import { reloj } from '../../lib/reloj.ts'
import {
  borrarToken,
  guardarToken,
  restaurarToken,
  type TokenGuardado,
} from '../../lib/sesionToken.ts'
import { CLAVES } from '../../lib/clavesQuery.ts'
import { login, obtenerUsuarioActual } from './api.ts'
import { AuthContext, type CierreSesion, type MotivoCierre, type ValorAuth } from './contexto.ts'
import { useSesion } from './hooks.ts'
import type { Rol, Sesion } from './tipos.ts'

interface PropsAuthProvider {
  children: ReactNode
}

/**
 * Sesión JWT del cliente (PRD §12):
 * - token en memoria + sessionStorage (lib/sesionToken.ts), restaurado y validado al arrancar;
 * - usuario y roles desde GET /api/auth/me (nunca se decodifica el JWT);
 * - cierre local al vencer expiraEn o ante cualquier 401 con token (lib/http.ts);
 * - cerrarSesion borra token y limpia la caché (queryClient.clear()).
 */
export function AuthProvider({ children }: PropsAuthProvider) {
  const queryClient = useQueryClient()
  const [guardado, setGuardado] = useState<TokenGuardado | null>(() => restaurarToken())
  const [ultimoCierre, setUltimoCierre] = useState<CierreSesion | null>(null)
  const contadorCierres = useRef(0)
  const consultaMe = useSesion(guardado?.token ?? null)

  const cerrarSesion = useCallback(
    (motivo: MotivoCierre = 'manual') => {
      borrarToken()
      setGuardado(null)
      queryClient.clear()
      contadorCierres.current += 1
      setUltimoCierre({ motivo, id: contadorCierres.current })
    },
    [queryClient],
  )

  // Cualquier 401 de una petición autenticada cierra la sesión local (TEST-FE-LIB-004, AC-FE-019).
  useEffect(() => {
    registrarOyenteNoAutorizado(() => {
      cerrarSesion('expirada')
    })
    return () => {
      registrarOyenteNoAutorizado(null)
    }
  }, [cerrarSesion])

  // Cierre programado al vencer el token (900 s).
  useEffect(() => {
    if (!guardado) return
    const restante = guardado.expiraEn - reloj.ahora()
    const id = window.setTimeout(
      () => {
        cerrarSesion('expirada')
      },
      Math.max(restante, 0),
    )
    return () => {
      window.clearTimeout(id)
    }
  }, [guardado, cerrarSesion])

  // Si /api/auth/me falla al restaurar, el token persistido se descarta (la sesión queda anónima).
  // Un 401 ya cerró la sesión vía registrarOyenteNoAutorizado.
  const restauracionFallida = guardado !== null && consultaMe.isError
  useEffect(() => {
    if (restauracionFallida) borrarToken()
  }, [restauracionFallida])

  const iniciarSesion = useCallback(
    async (identifier: string, password: string) => {
      const respuesta = await login({ identifier, password })
      const nuevo = guardarToken(respuesta.accessToken, respuesta.expiresIn)
      try {
        const usuario = await queryClient.query({
          queryKey: CLAVES.sesion(nuevo.token),
          queryFn: obtenerUsuarioActual,
        })
        setUltimoCierre(null)
        setGuardado(nuevo)
        return usuario
      } catch (error: unknown) {
        borrarToken()
        throw error
      }
    },
    [queryClient],
  )

  const sesion: Sesion = useMemo(() => {
    if (!guardado) return { estado: 'anonimo' }
    if (consultaMe.data) {
      return {
        estado: 'autenticado',
        token: guardado.token,
        expiraEn: guardado.expiraEn,
        usuario: consultaMe.data,
      }
    }
    return consultaMe.isError ? { estado: 'anonimo' } : { estado: 'cargando' }
  }, [guardado, consultaMe.data, consultaMe.isError])

  const tieneRol = useCallback(
    (...roles: Rol[]) =>
      sesion.estado === 'autenticado' && roles.some((r) => sesion.usuario.roles.includes(r)),
    [sesion],
  )

  const valor: ValorAuth = useMemo(
    () => ({ sesion, ultimoCierre, iniciarSesion, cerrarSesion, tieneRol }),
    [sesion, ultimoCierre, iniciarSesion, cerrarSesion, tieneRol],
  )

  return <AuthContext value={valor}>{children}</AuthContext>
}
