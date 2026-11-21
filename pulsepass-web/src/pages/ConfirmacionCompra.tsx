import { useParams } from 'react-router'
import { BadgeEstado } from '../componentes/Badge.tsx'
import { BotonEnlace } from '../componentes/Boton.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { CodigoTexto } from '../componentes/CodigoTexto.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { IconoCheck } from '../componentes/Iconos.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { PrecioCOP } from '../componentes/PrecioCOP.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { TicketNoDisponible } from '../funcionalidades/tickets/componentes/TicketNoDisponible.tsx'
import { useTicket } from '../funcionalidades/tickets/hooks.ts'
import { esEstado } from '../lib/errores.ts'
import { RUTAS } from '../lib/rutas.ts'

/** Confirmación de compra (/compra/confirmacion/:ticketCode) — §9.13. El precio viene de TicketResponse (GAP-06). */
export default function ConfirmacionCompra() {
  const { ticketCode = '' } = useParams()
  const ticket = useTicket(ticketCode)

  return (
    <Pagina>
      <div className="mx-auto max-w-md">
        {ticket.isPending ? <Cargando forma="detalle" etiqueta="Cargando compra…" /> : null}
        {ticket.isError && esEstado(ticket.error, 403, 404) ? <TicketNoDisponible /> : null}
        {ticket.isError && !esEstado(ticket.error, 403, 404) ? (
          <EstadoError
            error={ticket.error}
            onReintentar={() => {
              void ticket.refetch()
            }}
          />
        ) : null}
        {ticket.isSuccess ? (
          <Tarjeta className="flex flex-col items-center gap-3 px-6 py-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
              <IconoCheck className="size-6" />
            </span>
            <h1 className="text-2xl font-bold">¡Compra realizada con éxito!</h1>
            <p className="font-semibold">{ticket.data.eventName}</p>
            <p className="text-sm text-marca-700 dark:text-indigo-300">
              Ticket <CodigoTexto>{ticket.data.ticketCode}</CodigoTexto> · {ticket.data.type} ·{' '}
              <PrecioCOP valor={ticket.data.price} />
            </p>
            <BadgeEstado estado={ticket.data.status} />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <BotonEnlace to={RUTAS.misTickets}>Ver mis tickets</BotonEnlace>
              <BotonEnlace to={RUTAS.eventos} variante="secundario">
                Seguir explorando
              </BotonEnlace>
            </div>
          </Tarjeta>
        ) : null}
      </div>
    </Pagina>
  )
}
