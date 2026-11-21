import { useState, type ReactNode } from 'react'
import { useParams } from 'react-router'
import { BadgeEstado } from '../componentes/Badge.tsx'
import { Boton } from '../componentes/Boton.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { CodigoTexto } from '../componentes/CodigoTexto.tsx'
import { EnlaceVolver } from '../componentes/EnlaceVolver.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { IconoCopiar } from '../componentes/Iconos.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { PrecioCOP } from '../componentes/PrecioCOP.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { ModalConfirmarCancelacion } from '../funcionalidades/tickets/componentes/ModalConfirmarCancelacion.tsx'
import { TicketNoDisponible } from '../funcionalidades/tickets/componentes/TicketNoDisponible.tsx'
import { useCancelacion } from '../funcionalidades/tickets/componentes/useCancelacion.ts'
import { useTicket } from '../funcionalidades/tickets/hooks.ts'
import { useUsuarioPorEmail } from '../funcionalidades/usuarios/hooks.ts'
import { useEmailSesion } from '../funcionalidades/auth/hooks.ts'
import { esEstado } from '../lib/errores.ts'
import { formatearFechaCorta, formatearHora } from '../lib/formato.ts'
import { RUTAS } from '../lib/rutas.ts'

/** Detalle de ticket (/mis-tickets/:ticketCode) — §9.12. 403/404 → "Ticket no disponible". */
export default function DetalleTicket() {
  const { ticketCode = '' } = useParams()
  const ticket = useTicket(ticketCode)
  const email = useEmailSesion()
  const propio = ticket.data !== undefined && ticket.data.userEmail === email
  const perfil = useUsuarioPorEmail(propio ? email : null)
  const cancelacion = useCancelacion()
  const [copiado, setCopiado] = useState(false)

  const volver = <EnlaceVolver a={RUTAS.misTickets}>Mis tickets</EnlaceVolver>
  if (ticket.isPending) {
    return (
      <Pagina estrecha antes={volver}>
        <Cargando forma="detalle" etiqueta="Cargando ticket…" />
      </Pagina>
    )
  }
  if (ticket.isError) {
    return (
      <Pagina estrecha antes={volver}>
        {esEstado(ticket.error, 403, 404) ? (
          <TicketNoDisponible />
        ) : (
          <EstadoError
            error={ticket.error}
            onReintentar={() => {
              void ticket.refetch()
            }}
          />
        )}
      </Pagina>
    )
  }

  const t = ticket.data
  const titular = perfil.data ? `${perfil.data.firstName} ${perfil.data.lastName}` : t.userEmail

  async function copiar() {
    try {
      await navigator.clipboard.writeText(t.ticketCode)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <Pagina estrecha antes={volver}>
      <Tarjeta className="p-6">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <h1 className="text-xl font-bold">{t.eventName}</h1>
          <BadgeEstado estado={t.status} />
        </div>
        <dl className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
          <Fila etiqueta="Código">
            <span className="flex items-center gap-2">
              <CodigoTexto>{t.ticketCode}</CodigoTexto>
              <Boton
                variante="secundario"
                tamano="pequeno"
                onClick={() => {
                  void copiar()
                }}
              >
                <IconoCopiar className="size-3.5" /> {copiado ? 'Copiado' : 'Copiar'}
              </Boton>
            </span>
          </Fila>
          <Fila etiqueta="Tipo">{t.type}</Fila>
          <Fila etiqueta="Precio">
            <PrecioCOP valor={t.price} />
          </Fila>
          <Fila etiqueta="Comprado el">
            {formatearFechaCorta(t.purchaseDate)} {formatearHora(t.purchaseDate)}
          </Fila>
          <Fila etiqueta="Titular">{titular}</Fila>
        </dl>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Presenta este código en el ingreso.
        </p>
      </Tarjeta>
      {t.status === 'PAID' ? (
        <div className="mt-4 flex justify-end">
          <Boton
            variante="peligro"
            onClick={() => {
              cancelacion.abrir(t)
            }}
          >
            Cancelar ticket
          </Boton>
        </div>
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

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-slate-500 dark:text-slate-400">{etiqueta}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  )
}
