import { formatearPrecio } from '../lib/formato.ts'

interface PropsPrecio {
  valor: number
  className?: string
}

/** Moneda COP con Intl.NumberFormat('es-CO'). El precio siempre lo fija el backend (GAP-06). */
export function PrecioCOP({ valor, className }: PropsPrecio) {
  return <span className={className}>{formatearPrecio(valor)}</span>
}
