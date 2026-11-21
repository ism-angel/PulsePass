import clsx from 'clsx'
import type { ComponentProps } from 'react'
import { Link } from 'react-router'

/** Variantes del sistema visual (DES-09). Mapa completo de clases: nunca clases dinámicas (FE-008). */
export type VarianteBoton =
  'primario' | 'secundario' | 'peligro' | 'fantasma' | 'claro' | 'contornoClaro'
export type TamanoBoton = 'normal' | 'grande' | 'pequeno'

const VARIANTES: Record<VarianteBoton, string> = {
  primario: 'bg-marca-600 text-white hover:bg-marca-700 disabled:hover:bg-marca-600',
  secundario:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800',
  peligro: 'bg-red-600 text-white hover:bg-red-700',
  fantasma: 'text-marca-600 hover:bg-marca-50 dark:text-marca-500 dark:hover:bg-slate-800',
  claro: 'bg-white text-marca-700 hover:bg-marca-50',
  contornoClaro: 'border border-white/80 text-white hover:bg-white/10',
}

const TAMANOS: Record<TamanoBoton, string> = {
  pequeno: 'min-h-9 px-3 text-sm',
  normal: 'min-h-11 px-4 text-sm',
  grande: 'min-h-13 px-6 text-base',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 disabled:cursor-not-allowed'

function clasesBoton(variante: VarianteBoton, tamano: TamanoBoton, className?: string) {
  return clsx(BASE, VARIANTES[variante], TAMANOS[tamano], className)
}

interface PropsBoton extends ComponentProps<'button'> {
  variante?: VarianteBoton
  tamano?: TamanoBoton
  /** Estado "Cargando…": deshabilita para evitar doble envío. */
  cargando?: boolean
  textoCargando?: string
}

export function Boton({
  variante = 'primario',
  tamano = 'normal',
  cargando = false,
  textoCargando = 'Cargando…',
  disabled,
  className,
  children,
  type = 'button',
  ...resto
}: PropsBoton) {
  return (
    <button
      type={type}
      disabled={disabled === true || cargando}
      aria-busy={cargando || undefined}
      className={clsx(
        clasesBoton(variante, tamano, className),
        cargando &&
          'bg-slate-200 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400',
        !cargando && 'disabled:opacity-60',
      )}
      {...resto}
    >
      {cargando ? textoCargando : children}
    </button>
  )
}

interface PropsBotonEnlace extends ComponentProps<typeof Link> {
  variante?: VarianteBoton
  tamano?: TamanoBoton
}

/** Enlace de navegación con apariencia de botón. */
export function BotonEnlace({
  variante = 'primario',
  tamano = 'normal',
  className,
  ...resto
}: PropsBotonEnlace) {
  return <Link className={clasesBoton(variante, tamano, className)} {...resto} />
}
