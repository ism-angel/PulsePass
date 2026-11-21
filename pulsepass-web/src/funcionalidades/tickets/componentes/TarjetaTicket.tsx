import { BadgeEstado } from '../../../componentes/Badge.tsx'
import { Boton, BotonEnlace } from '../../../componentes/Boton.tsx'
import { CodigoTexto } from '../../../componentes/CodigoTexto.tsx'
import { PrecioCOP } from '../../../componentes/PrecioCOP.tsx'
import { Tarjeta } from '../../../componentes/Tarjeta.tsx'
import { formatearFechaCorta } from '../../../lib/formato.ts'
import { RUTAS } from '../../../lib/rutas.ts'
import type { TicketResponse } from '../tipos.ts'

interface PropsTarjetaTicket {
  ticket: TicketResponse
  onCancelar: (ticket: TicketResponse) => void
}

/** "Cancelar" visible solo si status === 'PAID' (UX, §9.11); el backend decide con 409. */
export function TarjetaTicket({ ticket, onCancelar }: PropsTarjetaTicket) {
  return (
    <Tarjeta className="p-4">
      <article aria-label={`Ticket ${ticket.ticketCode}`}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-titulo text-base font-semibold">{ticket.eventName}</h2>
          <BadgeEstado estado={ticket.status} />
        </div>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          <CodigoTexto>{ticket.ticketCode}</CodigoTexto> · {ticket.type} ·{' '}
          <PrecioCOP valor={ticket.price} /> · {formatearFechaCorta(ticket.purchaseDate)}
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <BotonEnlace to={RUTAS.ticket(ticket.ticketCode)} variante="secundario" tamano="pequeno">
            Ver detalle
          </BotonEnlace>
          {ticket.status === 'PAID' ? (
            <Boton
              variante="peligro"
              tamano="pequeno"
              onClick={() => {
                onCancelar(ticket)
              }}
            >
              Cancelar
            </Boton>
          ) : null}
        </div>
      </article>
    </Tarjeta>
  )
}
