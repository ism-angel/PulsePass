import { Navigate, useParams } from 'react-router'
import { BadgeEstado } from '../componentes/Badge.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { CodigoTexto } from '../componentes/CodigoTexto.tsx'
import { EnlaceVerTodos } from '../componentes/EnlaceVerTodos.tsx'
import { EnlaceVolver } from '../componentes/EnlaceVolver.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { EstadoVacio } from '../componentes/EstadoVacio.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { PanelArtistasEvento } from '../funcionalidades/admin/componentes/PanelArtistasEvento.tsx'
import { PanelPublicacion } from '../funcionalidades/admin/componentes/PanelPublicacion.tsx'
import { useEvento } from '../funcionalidades/eventos/hooks.ts'
import { esEstado } from '../lib/errores.ts'
import { formatearFechaHora } from '../lib/formato.ts'
import { RUTAS } from '../lib/rutas.ts'

/**
 * Gestionar evento (/admin/eventos/:eventCode) — §9.18: GET (#4), publicar (#6) y asociar artista (#7).
 * Un 403 en la carga de la página lleva a /403 (§9.19).
 */
export default function AdminGestionEvento() {
  const { eventCode = '' } = useParams()
  const evento = useEvento(eventCode)
  const volver = <EnlaceVolver a={RUTAS.adminEventos}>Eventos</EnlaceVolver>

  if (esEstado(evento.error, 403)) return <Navigate to={RUTAS.sinPermisos} replace />

  return (
    <Pagina estrecha antes={volver}>
      {evento.isPending ? <Cargando forma="detalle" etiqueta="Cargando evento…" /> : null}
      {evento.isError && esEstado(evento.error, 404) ? (
        <EstadoVacio mensaje="Evento no encontrado" />
      ) : null}
      {evento.isError && !esEstado(evento.error, 404) ? (
        <EstadoError
          error={evento.error}
          onReintentar={() => {
            void evento.refetch()
          }}
        />
      ) : null}
      {evento.isSuccess ? (
        <div className="space-y-5">
          <header>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold">{evento.data.name}</h1>
              <BadgeEstado estado={evento.data.status} />
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              <CodigoTexto>{evento.data.eventCode}</CodigoTexto> · {evento.data.category} ·{' '}
              {formatearFechaHora(evento.data.eventDate)} · Mín. {evento.data.minimumAge} ·{' '}
              {evento.data.venueName}
            </p>
          </header>
          <PanelPublicacion evento={evento.data} />
          <PanelArtistasEvento evento={evento.data} />
          <EnlaceVerTodos a={RUTAS.staffTicketsPagados(evento.data.eventCode)}>
            Tickets pagados
          </EnlaceVerTodos>
        </div>
      ) : null}
    </Pagina>
  )
}
