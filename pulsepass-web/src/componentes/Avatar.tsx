import clsx from 'clsx'
import { iniciales } from '../lib/formato.ts'

/** Paleta de avatares por posición (mapa fijo, sin clases dinámicas). */
const PALETA = [
  'bg-marca-50 text-marca-700 dark:bg-indigo-950 dark:text-indigo-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
] as const

export type TamanoAvatar = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const TAMANOS: Record<TamanoAvatar, string> = {
  xs: 'size-6 text-[10px]',
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-24 text-3xl',
}

interface PropsAvatar {
  nombre: string
  indice?: number
  tamano?: TamanoAvatar
  className?: string
}

/** Avatar de iniciales (la API no entrega fotos). */
export function Avatar({ nombre, indice = 0, tamano = 'md', className }: PropsAvatar) {
  const color = PALETA[Math.abs(indice) % PALETA.length] ?? PALETA[0]
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-titulo font-bold',
        color,
        TAMANOS[tamano],
        className,
      )}
    >
      {iniciales(nombre)}
    </span>
  )
}
