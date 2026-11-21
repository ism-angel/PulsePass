import { FiltroChips, type OpcionChip } from '../../../componentes/FiltroChips.tsx'
import type { TicketStatus } from '../tipos.ts'

export type FiltroTicket = 'TODOS' | Exclude<TicketStatus, 'RESERVED'>

const OPCIONES: readonly OpcionChip<FiltroTicket>[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'PAID', etiqueta: 'Pagados' },
  { valor: 'USED', etiqueta: 'Usados' },
  { valor: 'CANCELLED', etiqueta: 'Cancelados' },
]

interface PropsFiltroEstado {
  valor: FiltroTicket
  onCambiar: (valor: FiltroTicket) => void
}

/** Chips Todos · Pagados · Usados · Cancelados (DES-06). Filtro en cliente. */
export function FiltroEstadoTicket({ valor, onCambiar }: PropsFiltroEstado) {
  return (
    <FiltroChips
      opciones={OPCIONES}
      seleccion={valor}
      onCambiar={onCambiar}
      etiqueta="Filtrar por estado"
    />
  )
}
