import { useState } from 'react'
import { BotonEnlace } from '../componentes/Boton.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { EstadoVacio } from '../componentes/EstadoVacio.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import {
  FiltroEstadoTicket,
  type FiltroTicket,
} from '../funcionalidades/tickets/componentes/FiltroEstadoTicket.tsx'
import { ModalConfirmarCancelacion } from '../funcionalidades/tickets/componentes/ModalConfirmarCancelacion.tsx'
import { TarjetaTicket } from '../funcionalidades/tickets/componentes/TarjetaTicket.tsx'
import { useCancelacion } from '../funcionalidades/tickets/componentes/useCancelacion.ts'
import { useMisTickets } from '../funcionalidades/tickets/hooks.ts'
import { RUTAS } from '../lib/rutas.ts'

/** Mis tickets (/mis-tickets) — §9.11: GET /api/tickets/by-user?email=<sesión>, filtro en cliente. */
export default function MisTickets() {
  const tickets = useMisTickets()
  const [filtro, setFiltro] = useState<FiltroTicket>('TODOS')
  const cancelacion = useCancelacion()
  const visibles = (tickets.data ?? []).filter((t) => filtro === 'TODOS' || t.status === filtro)

  return (
    <Pagina titulo="Mis tickets">
      <div className="mb-5">
        <FiltroEstadoTicket valor={filtro} onCambiar={setFiltro} />
      </div>
      {tickets.isPending ? <Cargando forma="lista" etiqueta="Cargando tickets…" /> : null}
      {tickets.isError ? (
        <EstadoError
          error={tickets.error}
          onReintentar={() => {
            void tickets.refetch()
          }}
        />
      ) : null}
      {tickets.isSuccess && tickets.data.length === 0 ? (
        <EstadoVacio
          mensaje="Aún no tienes tickets"
          accion={
            <BotonEnlace to={RUTAS.eventos} variante="secundario" tamano="pequeno">
              Ir a la cartelera
            </BotonEnlace>
          }
        />
      ) : null}
      {tickets.isSuccess && tickets.data.length > 0 && visibles.length === 0 ? (
        <EstadoVacio mensaje="No hay tickets con este estado" />
      ) : null}
      {visibles.length > 0 ? (
        <ul aria-label="Mis tickets" className="space-y-3">
          {visibles.map((t) => (
            <li key={t.ticketCode}>
              <TarjetaTicket ticket={t} onCancelar={cancelacion.abrir} />
            </li>
          ))}
        </ul>
      ) : null}
      <ModalConfirmarCancelacion
        ticket={cancelacion.seleccionado}
        enviando={cancelacion.enviando}
        error={cancelacion.error}
        onConfirmar={cancelacion.confirmar}
        onCerrar={cancelacion.cerrar}
      />
    </Pagina>
  )
}
