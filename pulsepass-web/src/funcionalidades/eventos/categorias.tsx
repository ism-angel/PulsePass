import type { ReactNode } from 'react'
import {
  IconoBalon,
  IconoBirrete,
  IconoEstrella,
  IconoMonitor,
  IconoMuseo,
  IconoMusica,
} from '../../componentes/Iconos.tsx'
import type { EventCategory } from './tipos.ts'

export interface EstiloCategoria {
  fondo: string
  texto: string
  icono: (clase: string) => ReactNode
}

/**
 * Panel de color por categoría (DES-02): la API no entrega imágenes.
 * Record<EventCategory, …> con clases Tailwind completas (FE-008).
 */
export const ESTILOS_CATEGORIA: Record<EventCategory, EstiloCategoria> = {
  MUSIC: {
    fondo: 'bg-indigo-100 dark:bg-indigo-950',
    texto: 'text-indigo-700 dark:text-indigo-300',
    icono: (c) => <IconoMusica className={c} />,
  },
  TECHNOLOGY: {
    fondo: 'bg-sky-100 dark:bg-sky-950',
    texto: 'text-sky-700 dark:text-sky-300',
    icono: (c) => <IconoMonitor className={c} />,
  },
  SPORTS: {
    fondo: 'bg-emerald-100 dark:bg-emerald-950',
    texto: 'text-emerald-700 dark:text-emerald-300',
    icono: (c) => <IconoBalon className={c} />,
  },
  CULTURE: {
    fondo: 'bg-rose-100 dark:bg-rose-950',
    texto: 'text-rose-700 dark:text-rose-300',
    icono: (c) => <IconoMuseo className={c} />,
  },
  EDUCATION: {
    fondo: 'bg-amber-100 dark:bg-amber-950',
    texto: 'text-amber-700 dark:text-amber-300',
    icono: (c) => <IconoBirrete className={c} />,
  },
  ENTERTAINMENT: {
    fondo: 'bg-violet-100 dark:bg-violet-950',
    texto: 'text-violet-700 dark:text-violet-300',
    icono: (c) => <IconoEstrella className={c} />,
  },
}

export const CATEGORIAS: readonly EventCategory[] = [
  'MUSIC',
  'SPORTS',
  'TECHNOLOGY',
  'EDUCATION',
  'CULTURE',
  'ENTERTAINMENT',
]
