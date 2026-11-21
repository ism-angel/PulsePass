import clsx from 'clsx'
import type { ComponentProps } from 'react'

/** Superficie visual: bg-white + shadow-sm / dark:bg-slate-900 (PRD §9.1). */
export function Tarjeta({ className, ...resto }: ComponentProps<'div'>) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
      {...resto}
    />
  )
}
