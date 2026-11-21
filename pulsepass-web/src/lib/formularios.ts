import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { esApiError } from './http.ts'

/**
 * PRD §11.2: un 400 con `details` asigna cada clave al campo homónimo (setError).
 * Devuelve los mensajes cuyo campo no existe en el formulario, para un aviso general.
 */
export function aplicarErroresDeCampo<T extends FieldValues>(
  error: unknown,
  campos: readonly Path<T>[],
  setError: UseFormSetError<T>,
  alias: Partial<Record<string, Path<T>>> = {},
): string[] {
  if (!esApiError(error) || error.status !== 400) return []
  const sueltos: string[] = []
  for (const [clave, mensaje] of Object.entries(error.details)) {
    const campo = alias[clave] ?? campos.find((c) => c === clave)
    if (campo) setError(campo, { type: 'server', message: mensaje })
    else sueltos.push(mensaje)
  }
  return sueltos
}

/** Longitud en bytes UTF-8 (límite de BCrypt: 72 bytes). */
export function bytesUtf8(texto: string): number {
  return new TextEncoder().encode(texto).length
}
