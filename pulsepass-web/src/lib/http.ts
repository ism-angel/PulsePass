import { z } from 'zod'
import { obtenerToken } from './sesionToken.ts'

/**
 * Cliente HTTP único de la aplicación (PRD §5, §13).
 * - fetch nativo (sin Axios), siempre JSON.
 * - Añade `Authorization: Bearer <token>` cuando hay sesión (FE-013: nunca en la URL).
 * - Convierte TODA respuesta no exitosa en ApiError validando ErrorResponse con zod.
 * - Valida con zod el cuerpo de las respuestas exitosas (FE-002).
 * - Ante un 401 de una petición que llevaba token, notifica el cierre de sesión (GAP-08).
 */

/** Contrato uniforme de errores del backend (Fase 3, ErrorResponse.java). */
export const ErrorResponseSchema = z.object({
  timestamp: z.string(),
  status: z.number().int(),
  error: z.string(),
  message: z.string(),
  details: z
    .record(z.string(), z.string())
    .nullish()
    .transform((valor) => valor ?? {}),
})
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

/** Estado HTTP reservado para fallos de red (sin respuesta del servidor). */
export const ESTADO_RED = 0

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get esDeRed(): boolean {
    return this.status === ESTADO_RED
  }
}

export function esApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** URL base pública (VITE_API_BASE_URL). Por defecto /api (proxy de Vite). */
const BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

type OyenteNoAutorizado = () => void
let oyenteNoAutorizado: OyenteNoAutorizado | null = null

/** AuthContext registra aquí su cierre de sesión local (TEST-FE-LIB-004). */
export function registrarOyenteNoAutorizado(oyente: OyenteNoAutorizado | null): void {
  oyenteNoAutorizado = oyente
}

type Metodo = 'GET' | 'POST' | 'PATCH'

interface OpcionesPeticion {
  metodo?: Metodo
  cuerpo?: unknown
  /** Parámetros de consulta (?email=...). Se codifican; nunca contienen el token. */
  consulta?: Record<string, string>
  signal?: AbortSignal
}

function construirUrl(ruta: string, consulta?: Record<string, string>): string {
  const url = `${BASE_URL}${ruta}`
  if (!consulta) return url
  const parametros = new URLSearchParams(consulta)
  return `${url}?${parametros.toString()}`
}

async function leerJson(respuesta: Response): Promise<unknown> {
  const texto = await respuesta.text()
  if (texto.length === 0) return null
  try {
    return JSON.parse(texto) as unknown
  } catch {
    return null
  }
}

/** Convierte un cuerpo de error arbitrario en ApiError; si no cumple el contrato usa un error genérico. */
export function aApiError(status: number, cuerpo: unknown): ApiError {
  const resultado = ErrorResponseSchema.safeParse(cuerpo)
  if (resultado.success) {
    return new ApiError(status, resultado.data.message, resultado.data.details)
  }
  return new ApiError(status, 'Error inesperado del servidor')
}

export async function peticion<T>(
  ruta: string,
  esquema: z.ZodType<T>,
  opciones: OpcionesPeticion = {},
): Promise<T> {
  const { metodo = 'GET', cuerpo, consulta, signal } = opciones
  const token = obtenerToken()
  const encabezados = new Headers({ Accept: 'application/json' })
  if (cuerpo !== undefined) encabezados.set('Content-Type', 'application/json')
  if (token) encabezados.set('Authorization', `Bearer ${token}`)

  let respuesta: Response
  try {
    respuesta = await fetch(construirUrl(ruta, consulta), {
      method: metodo,
      headers: encabezados,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal,
    })
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(ESTADO_RED, 'No pudimos conectar con el servidor.')
  }

  const datos = await leerJson(respuesta)

  if (!respuesta.ok) {
    // 401 con token enviado = token vencido/manipulado → cierre de sesión local (§12.2).
    // Un 401 sin token (login incorrecto) no cierra nada.
    if (respuesta.status === 401 && token) oyenteNoAutorizado?.()
    throw aApiError(respuesta.status, datos)
  }

  const resultado = esquema.safeParse(datos)
  if (!resultado.success) {
    throw new ApiError(500, 'La respuesta del servidor no tiene el formato esperado.')
  }
  return resultado.data
}

export const http = {
  get: <T>(
    ruta: string,
    esquema: z.ZodType<T>,
    consulta?: Record<string, string>,
    signal?: AbortSignal,
  ) => peticion(ruta, esquema, { consulta, signal }),
  post: <T>(ruta: string, esquema: z.ZodType<T>, cuerpo?: unknown) =>
    peticion(ruta, esquema, { metodo: 'POST', cuerpo }),
  patch: <T>(ruta: string, esquema: z.ZodType<T>, cuerpo?: unknown) =>
    peticion(ruta, esquema, { metodo: 'PATCH', cuerpo }),
}

/** Segmento de ruta seguro para códigos que vienen de la URL o del usuario. */
export function segmento(valor: string | number): string {
  return encodeURIComponent(String(valor))
}
