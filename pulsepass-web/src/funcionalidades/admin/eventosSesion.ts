import { useSyncExternalStore } from 'react'
import { z } from 'zod'

/**
 * GAP-01: la API no ofrece GET /api/events. Los códigos de los eventos creados en esta pestaña se
 * recuerdan en sessionStorage (validados con zod) y se pierden al cerrarla (limitación documentada).
 * Solo se guardan CÓDIGOS (estado de la aplicación); los datos del evento siempre vienen de useEvento.
 */
const CLAVE = 'pulsepass.admin.eventosCreados'
const ListaCodigosSchema = z.array(z.string().min(1)).max(50)
const VACIO: readonly string[] = []

const oyentes = new Set<() => void>()
let cache: readonly string[] | null = null

function leer(): readonly string[] {
  if (cache) return cache
  try {
    const crudo = window.sessionStorage.getItem(CLAVE)
    const resultado = ListaCodigosSchema.safeParse(crudo ? JSON.parse(crudo) : [])
    cache = resultado.success ? resultado.data : VACIO
  } catch {
    cache = VACIO
  }
  return cache
}

export function recordarEventoCreado(eventCode: string): void {
  const siguiente = [eventCode, ...leer().filter((c) => c !== eventCode)].slice(0, 50)
  cache = siguiente
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(siguiente))
  } catch {
    /* sin almacenamiento: se conserva en memoria */
  }
  oyentes.forEach((o) => {
    o()
  })
}

/** Solo para pruebas: reinicia la memoria. */
export function olvidarEventosCreados(): void {
  cache = null
  try {
    window.sessionStorage.removeItem(CLAVE)
  } catch {
    /* noop */
  }
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function useEventosCreadosEnSesion(): readonly string[] {
  return useSyncExternalStore(suscribir, leer, () => VACIO)
}
