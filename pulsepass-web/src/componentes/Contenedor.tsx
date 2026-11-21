import clsx from 'clsx'
import type { ComponentProps } from 'react'

/** Contenedor general max-w-6xl (PRD §9.1). */
export function Contenedor({ className, ...resto }: ComponentProps<'div'>) {
  return <div className={clsx('mx-auto w-full max-w-6xl px-4', className)} {...resto} />
}

/** Columna estrecha centrada (~830 px) para formularios y gestión ADMIN (DES-04). */
export function ContenedorEstrecho({ className, ...resto }: ComponentProps<'div'>) {
  return <div className={clsx('mx-auto w-full max-w-3xl', className)} {...resto} />
}
