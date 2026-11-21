import type { ReactNode } from 'react'
import { IconoBandeja } from './Iconos.tsx'
import { Tarjeta } from './Tarjeta.tsx'

interface PropsEstadoVacio {
  mensaje: string
  /** Acción sugerida (enlace o botón). */
  accion?: ReactNode
}

/** Estado vacío: ícono, mensaje y acción sugerida (§9.20). */
export function EstadoVacio({ mensaje, accion }: PropsEstadoVacio) {
  return (
    <Tarjeta className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <IconoBandeja className="size-7 text-slate-500 dark:text-slate-400" />
      <p className="font-semibold">{mensaje}</p>
      {accion}
    </Tarjeta>
  )
}
