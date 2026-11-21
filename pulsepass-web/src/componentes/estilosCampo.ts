import type { ReactNode } from 'react'

/** Clases compartidas por Campo, AreaTexto y Selector (mapa fijo, sin clases dinámicas). */
export const CLASES_CONTROL =
  'block w-full min-h-11 rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marca-600 disabled:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500'

export function clasesBorde(conError: boolean) {
  return conError ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-700'
}

export function describedBy(id: string, error?: string, ayuda?: ReactNode) {
  if (error) return `${id}-error`
  if (ayuda) return `${id}-ayuda`
  return undefined
}
