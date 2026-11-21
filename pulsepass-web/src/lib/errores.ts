import { esApiError, ESTADO_RED } from './http.ts'

/**
 * Mapeo HTTP → mensaje de interfaz (PRD §13). Todos los errores pasan por ApiError (NFR-FE-006).
 * Los mensajes se renderizan SIEMPRE como texto (nunca HTML).
 */

export const MENSAJES = {
  red: 'No pudimos conectar con el servidor.',
  inesperado: 'Ocurrió un error inesperado. Inténtalo más tarde.',
  credenciales: 'Credenciales inválidas.',
  sesionExpirada: 'Tu sesión expiró. Inicia sesión de nuevo.',
  sinPermisos: 'No tienes permisos para realizar esta operación.',
  noEncontrado: 'El recurso solicitado no existe.',
  validacion: 'Revisa los datos del formulario.',
  duplicadoRegistro: 'El usuario o correo ya está registrado.',
} as const

/**
 * Traducción a es-CO de los mensajes conocidos del backend (texto controlado por el servidor).
 * Es solo localización: la decisión (409) la toma el backend; si el mensaje no se reconoce,
 * se muestra tal cual lo envió la API.
 */
const TRADUCCIONES: readonly (readonly [RegExp, string])[] = [
  [/^User does not meet minimum age/i, 'El usuario no cumple la edad mínima del evento.'],
  [
    /^User birth date is required/i,
    'Se requiere la fecha de nacimiento para verificar la edad mínima.',
  ],
  [/^User is not active/i, 'La cuenta del usuario no está activa.'],
  [/^Event has no remaining capacity/i, 'El evento no tiene cupos disponibles.'],
  [/^Event has already taken place/i, 'El evento ya se realizó.'],
  [/^Only PAID tickets can be cancelled/i, 'El ticket no puede cancelarse en su estado actual.'],
  [
    /^Ticket cannot be cancelled after the event date/i,
    'El ticket no puede cancelarse después de la fecha del evento.',
  ],
  [/^A CANCELLED ticket cannot be used/i, 'Un ticket cancelado no puede usarse.'],
  [/^Only PAID tickets can be marked as used/i, 'El ticket ya fue utilizado o no está pagado.'],
  [
    /^Ticket cannot be cancelled\. Current status/i,
    'El ticket no puede cancelarse en su estado actual.',
  ],
  [/^Event is not available for purchase/i, 'El evento no está disponible para la compra.'],
  [/^Only DRAFT events can be published/i, 'Solo un evento en borrador (DRAFT) puede publicarse.'],
  [/^Event date must be in the future/i, 'La fecha del evento debe ser futura.'],
  [/^Venue is not active/i, 'La sede no está activa.'],
  [
    /^Cannot add artists to an event with status/i,
    'No se pueden agregar artistas a un evento cancelado o finalizado.',
  ],
  [/^Artist .+ is already associated with event/i, 'El artista ya está asociado a este evento.'],
  [/^Event already exists/i, 'Ya existe un evento con ese código.'],
  [/^Birth date cannot be in the future/i, 'La fecha de nacimiento no puede ser futura.'],
  [
    /^Minimum age must be greater than or equal to 0/i,
    'La edad mínima debe ser mayor o igual a 0.',
  ],
  [/^(Email|Username) already exists/i, 'El usuario o correo ya está registrado.'],
  [/^Event not found/i, 'Evento no disponible.'],
  [/^Ticket not found/i, 'Ticket no encontrado.'],
  [/^Artist not found/i, 'Artista no encontrado.'],
  [/^Venue not found/i, 'Sede no encontrada.'],
  [/^User not found/i, 'Usuario no encontrado.'],
]

export function traducirMensaje(mensaje: string): string {
  const coincidencia = TRADUCCIONES.find(([patron]) => patron.test(mensaje))
  return coincidencia ? coincidencia[1] : mensaje
}

export type ContextoError = 'login' | 'registro' | 'general'

/** Mensaje de UI para cualquier error capturado (unknown + narrowing, FE-011). */
export function mensajeDeError(error: unknown, contexto: ContextoError = 'general'): string {
  if (!esApiError(error)) return MENSAJES.inesperado
  if (error.status === ESTADO_RED) return MENSAJES.red
  switch (error.status) {
    case 400:
      return Object.keys(error.details).length > 0
        ? MENSAJES.validacion
        : traducirMensaje(error.message)
    case 401:
      return contexto === 'login' ? MENSAJES.credenciales : MENSAJES.sesionExpirada
    case 403:
      return MENSAJES.sinPermisos
    case 404:
      return traducirMensaje(error.message) || MENSAJES.noEncontrado
    case 409:
      return contexto === 'registro' ? MENSAJES.duplicadoRegistro : traducirMensaje(error.message)
    default:
      return error.status >= 500 ? MENSAJES.inesperado : traducirMensaje(error.message)
  }
}

export function esEstado(error: unknown, ...estados: number[]): boolean {
  return esApiError(error) && estados.includes(error.status)
}
