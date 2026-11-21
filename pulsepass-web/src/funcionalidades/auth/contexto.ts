import { createContext } from 'react'
import type { Rol, Sesion, UsuarioAutenticado } from './tipos.ts'

export type MotivoCierre = 'expirada' | 'manual'

/** Último cierre de sesión; `id` permite reaccionar una sola vez a cada cierre. */
export interface CierreSesion {
  motivo: MotivoCierre
  id: number
}

export interface ValorAuth {
  sesion: Sesion
  /** Motivo del último cierre de sesión, para avisar "Tu sesión expiró" (FR-FE-AUTH-005). */
  ultimoCierre: CierreSesion | null
  iniciarSesion: (identifier: string, password: string) => Promise<UsuarioAutenticado>
  cerrarSesion: (motivo?: MotivoCierre) => void
  tieneRol: (...roles: Rol[]) => boolean
}

export const AuthContext = createContext<ValorAuth | null>(null)
