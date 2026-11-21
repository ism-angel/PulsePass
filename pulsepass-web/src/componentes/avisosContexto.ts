import { createContext, use } from 'react'
import type { TonoAviso } from './Aviso.tsx'

export interface AvisoEmergente {
  id: number
  tono: TonoAviso
  mensaje: string
}

export interface ValorAvisos {
  avisos: readonly AvisoEmergente[]
  notificar: (tono: TonoAviso, mensaje: string) => void
  descartar: (id: number) => void
}

export const AvisosContext = createContext<ValorAvisos | null>(null)

/** Avisos (toast) de éxito/error de mutaciones (FR-FE-GEN-003). */
export function useAvisos() {
  const valor = use(AvisosContext)
  if (!valor) throw new Error('useAvisos debe usarse dentro de <AvisosProvider>')
  return valor
}
