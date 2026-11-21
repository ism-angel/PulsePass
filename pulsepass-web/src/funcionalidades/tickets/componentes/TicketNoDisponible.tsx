import { BotonEnlace } from '../../../componentes/Boton.tsx'
import { Tarjeta } from '../../../componentes/Tarjeta.tsx'
import { RUTAS } from '../../../lib/rutas.ts'

/** 403/404 de un ticket ajeno o inexistente: no revela si existe (AC-FE-014). */
export function TicketNoDisponible() {
  return (
    <Tarjeta className="px-6 py-10 text-center">
      <h1 className="text-2xl font-bold">Ticket no disponible</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        No encontramos este ticket entre los tuyos.
      </p>
      <BotonEnlace to={RUTAS.misTickets} className="mt-5">
        Ver mis tickets
      </BotonEnlace>
    </Tarjeta>
  )
}
