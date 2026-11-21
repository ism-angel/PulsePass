import { useCallback, useSyncExternalStore } from 'react'
import { z } from 'zod'

/**
 * Modo claro/oscuro (FR-FE-GEN-004). Por defecto respeta prefers-color-scheme; si la persona
 * alterna, la preferencia se guarda en sessionStorage (validada con zod, FE-002).
 * No se usa localStorage (§24.6).
 */
const CLAVE = 'pulsepass.tema'
export const TemaSchema = z.enum(['claro', 'oscuro'])
export type Tema = z.infer<typeof TemaSchema>

const oyentes = new Set<() => void>()

function preferenciaSistema(): Tema {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
  } catch {
    return 'claro'
  }
}

function leerGuardado(): Tema | null {
  try {
    const resultado = TemaSchema.safeParse(window.sessionStorage.getItem(CLAVE))
    return resultado.success ? resultado.data : null
  } catch {
    return null
  }
}

export function temaActual(): Tema {
  return leerGuardado() ?? preferenciaSistema()
}

export function aplicarTema(tema: Tema = temaActual()): void {
  document.documentElement.classList.toggle('dark', tema === 'oscuro')
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function useTema() {
  const tema = useSyncExternalStore(suscribir, temaActual, (): Tema => 'claro')
  const alternar = useCallback(() => {
    const siguiente: Tema = temaActual() === 'oscuro' ? 'claro' : 'oscuro'
    try {
      window.sessionStorage.setItem(CLAVE, siguiente)
    } catch {
      /* almacenamiento no disponible: solo se aplica en memoria */
    }
    aplicarTema(siguiente)
    oyentes.forEach((o) => {
      o()
    })
  }, [])
  return { tema, alternar }
}
