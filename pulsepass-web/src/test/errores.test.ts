import { describe, expect, it } from 'vitest'
import { ApiError } from '../lib/http.ts'
import { mensajeDeError } from '../lib/errores.ts'
import { debeReintentar } from '../lib/queryClient.ts'

describe('Mapeo HTTP → interfaz (§13, QT-FE-005)', () => {
  it('red / fetch falla', () => {
    expect(mensajeDeError(new ApiError(0, 'x'))).toBe('No pudimos conectar con el servidor.')
  })
  it('400 con details → mensaje de validación; sin details → mensaje del backend', () => {
    expect(mensajeDeError(new ApiError(400, 'Validation failed', { name: 'x' }))).toBe(
      'Revisa los datos del formulario.',
    )
    expect(mensajeDeError(new ApiError(400, 'Malformed JSON request'))).toBe(
      'Malformed JSON request',
    )
  })
  it('401 → "Credenciales inválidas" en login y "Tu sesión expiró" en el resto', () => {
    expect(mensajeDeError(new ApiError(401, 'Invalid credentials'), 'login')).toBe(
      'Credenciales inválidas.',
    )
    expect(mensajeDeError(new ApiError(401, 'Authentication required'))).toBe(
      'Tu sesión expiró. Inicia sesión de nuevo.',
    )
  })
  it('403 → sin permisos', () => {
    expect(mensajeDeError(new ApiError(403, 'Access denied'))).toBe(
      'No tienes permisos para realizar esta operación.',
    )
  })
  it('404 → no disponible / no encontrado', () => {
    expect(mensajeDeError(new ApiError(404, 'Event not found: X'))).toBe('Evento no disponible.')
    expect(mensajeDeError(new ApiError(404, 'Ticket not found: X'))).toBe('Ticket no encontrado.')
  })
  it('409 → mensaje de la regla del backend como texto (genérico en registro)', () => {
    expect(mensajeDeError(new ApiError(409, 'Event has no remaining capacity: CMF-2026'))).toBe(
      'El evento no tiene cupos disponibles.',
    )
    expect(mensajeDeError(new ApiError(409, 'Mensaje desconocido <b>sin HTML</b>'))).toBe(
      'Mensaje desconocido <b>sin HTML</b>',
    )
    expect(mensajeDeError(new ApiError(409, 'Email already exists.'), 'registro')).toBe(
      'El usuario o correo ya está registrado.',
    )
  })
  it('500 → genérico sin detalles; error desconocido → genérico', () => {
    expect(mensajeDeError(new ApiError(500, 'Unexpected internal error'))).toBe(
      'Ocurrió un error inesperado. Inténtalo más tarde.',
    )
    expect(mensajeDeError(new Error('boom'))).toBe(
      'Ocurrió un error inesperado. Inténtalo más tarde.',
    )
  })
  it('política de reintentos (§14.3): 4xx nunca; red y 5xx una vez', () => {
    expect(debeReintentar(0, new ApiError(404, 'x'))).toBe(false)
    expect(debeReintentar(0, new ApiError(409, 'x'))).toBe(false)
    expect(debeReintentar(0, new ApiError(500, 'x'))).toBe(true)
    expect(debeReintentar(1, new ApiError(500, 'x'))).toBe(false)
    expect(debeReintentar(0, new ApiError(0, 'x'))).toBe(true)
  })
})
