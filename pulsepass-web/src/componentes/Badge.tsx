import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { EventStatus } from '../funcionalidades/eventos/tipos.ts'
import type { TicketStatus } from '../funcionalidades/tickets/tipos.ts'

/** Mapa de badges de estado (PRD §9.1) con clases completas: sin clases dinámicas (§24.4). */
export type TonoBadge =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'SOLD_OUT'
  | 'CANCELLED'
  | 'FINISHED'
  | 'RESERVED'
  | 'PAID'
  | 'USED'
  | 'activo'
  | 'inactivo'
  | 'marca'

const TONOS: Record<TonoBadge, string> = {
  DRAFT: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  PUBLISHED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  SOLD_OUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  FINISHED: 'bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-100',
  RESERVED: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  USED: 'bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-100',
  activo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  inactivo: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  marca: 'bg-marca-50 text-marca-700 dark:bg-indigo-950 dark:text-indigo-200',
}

interface PropsBadge {
  tono: TonoBadge
  children: ReactNode
  className?: string
}

export function Badge({ tono, children, className }: PropsBadge) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  )
}

interface PropsBadgeEstado {
  estado: EventStatus | TicketStatus
  className?: string
}

/** Badge del estado de un evento o ticket; muestra el valor del dominio tal como lo define la API. */
export function BadgeEstado({ estado, className }: PropsBadgeEstado) {
  return (
    <Badge tono={estado} className={className}>
      {estado}
    </Badge>
  )
}
