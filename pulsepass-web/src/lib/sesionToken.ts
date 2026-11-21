import { z } from 'zod'
import { reloj } from './reloj.ts'

/**
 * Almacén del JWT (PRD §12.2, AC-FE-009).
 * - Vive en memoria y en sessionStorage (se pierde al cerrar la pestaña).
 * - Nunca localStorage, cookies ni URL; nunca se imprime en consola.
 * - El valor leído al arrancar se valida con zod y se descarta si ya expiró.
 */

const CLAVE = 'pulsepass.sesion'

export const TokenGuardadoSchema = z.object({
  token: z.string().min(1),
  /** Instante (ms epoch) en el que vence el token: ahora + expiresIn * 1000. */
  expiraEn: z.number().int().positive(),
})
export type TokenGuardado = z.infer<typeof TokenGuardadoSchema>

let enMemoria: TokenGuardado | null = null

function almacen(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function guardarToken(token: string, expiresInSegundos: number): TokenGuardado {
  const valor: TokenGuardado = { token, expiraEn: reloj.ahora() + expiresInSegundos * 1000 }
  enMemoria = valor
  almacen()?.setItem(CLAVE, JSON.stringify(valor))
  return valor
}

export function borrarToken(): void {
  enMemoria = null
  almacen()?.removeItem(CLAVE)
}

export function estaVigente(valor: TokenGuardado): boolean {
  return valor.expiraEn > reloj.ahora()
}

/** Lee el token persistido validándolo con zod; si es inválido o expiró se descarta (TEST-FE-AUTH-011). */
export function restaurarToken(): TokenGuardado | null {
  const crudo = almacen()?.getItem(CLAVE)
  if (!crudo) return null
  let json: unknown
  try {
    json = JSON.parse(crudo)
  } catch {
    borrarToken()
    return null
  }
  const resultado = TokenGuardadoSchema.safeParse(json)
  if (!resultado.success || !estaVigente(resultado.data)) {
    borrarToken()
    return null
  }
  enMemoria = resultado.data
  return resultado.data
}

/** Token vigente en memoria, usado exclusivamente por lib/http.ts para el encabezado Authorization. */
export function obtenerToken(): string | null {
  if (!enMemoria) return null
  return estaVigente(enMemoria) ? enMemoria.token : null
}
