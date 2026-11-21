import clsx from 'clsx'
import type { ReactNode } from 'react'
import { IconoAlerta, IconoCerrar, IconoCheck, IconoRayo } from './Iconos.tsx'

/** Tonos del aviso (DES-10 y §9.20). Mapa completo de clases. */
export type TonoAviso = 'exito' | 'error' | 'info' | 'advertencia'

const TONOS: Record<TonoAviso, string> = {
  exito:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
  info: 'border-marca-500/30 bg-marca-50 text-marca-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200',
  advertencia:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
}

const ICONOS: Record<TonoAviso, ReactNode> = {
  exito: <IconoCheck className="mt-0.5 size-4 shrink-0" />,
  error: <IconoAlerta className="mt-0.5 size-4 shrink-0" />,
  info: <IconoRayo className="mt-0.5 size-4 shrink-0" />,
  advertencia: <IconoAlerta className="mt-0.5 size-4 shrink-0" />,
}

interface PropsAviso {
  tono: TonoAviso
  children: ReactNode
  onCerrar?: () => void
  className?: string
}

/**
 * Aviso en línea. Errores y advertencias usan role="alert" (se anuncian de inmediato);
 * éxito e información usan role="status" (aria-live="polite"). El texto se renderiza como texto.
 */
export function Aviso({ tono, children, onCerrar, className }: PropsAviso) {
  const urgente = tono === 'error' || tono === 'advertencia'
  return (
    <div
      role={urgente ? 'alert' : 'status'}
      className={clsx(
        'flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm',
        TONOS[tono],
        className,
      )}
    >
      {ICONOS[tono]}
      <div className="flex-1">{children}</div>
      {onCerrar ? (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className="rounded p-0.5 opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-marca-600"
        >
          <IconoCerrar className="size-4" />
        </button>
      ) : null}
    </div>
  )
}
