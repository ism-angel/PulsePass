import { useParams } from 'react-router'
import { Cargando } from '../componentes/Cargando.tsx'
import { EnlaceVolver } from '../componentes/EnlaceVolver.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { BotonEnlace } from '../componentes/Boton.tsx'
import { DetalleEventoCabecera } from '../funcionalidades/eventos/componentes/DetalleEventoCabecera.tsx'
import { ListaArtistasEvento } from '../funcionalidades/eventos/componentes/ListaArtistasEvento.tsx'
import { useEvento } from '../funcionalidades/eventos/hooks.ts'
import { useSede } from '../funcionalidades/sedes/hooks.ts'
import { ResumenSede } from '../funcionalidades/sedes/componentes/TarjetaSede.tsx'
import { PanelCompra } from '../funcionalidades/tickets/componentes/PanelCompra.tsx'
import { esEstado } from '../lib/errores.ts'
import { RUTAS } from '../lib/rutas.ts'

/**
 * Detalle de evento y compra (/eventos/:eventCode) — §9.5.
 * 404/403 (inexistente o borrador para un anónimo, GAP-02) → "Evento no disponible" sin datos.
 */
export default function DetalleEvento() {
  const { eventCode = '' } = useParams()
  const evento = useEvento(eventCode)
  const sede = useSede(evento.data?.venueCode ?? '')
  const volver = <EnlaceVolver a={RUTAS.eventos}>Volver a la cartelera</EnlaceVolver>

  if (evento.isPending) {
    return (
      <Pagina antes={volver}>
        <Cargando forma="detalle" etiqueta="Cargando evento…" />
      </Pagina>
    )
  }

  if (evento.isError) {
    return (
      <Pagina antes={volver}>
        {esEstado(evento.error, 404, 403) ? (
          <Tarjeta className="px-6 py-10 text-center">
            <h1 className="text-2xl font-bold">Evento no disponible</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              El evento no existe o todavía no está publicado.
            </p>
            <BotonEnlace to={RUTAS.eventos} className="mt-5">
              Ver cartelera
            </BotonEnlace>
          </Tarjeta>
        ) : (
          <EstadoError
            error={evento.error}
            onReintentar={() => {
              void evento.refetch()
            }}
          />
        )}
      </Pagina>
    )
  }

  const e = evento.data
  const detalleSede = sede.data
    ? `${sede.data.city} · Capacidad ${String(sede.data.capacity)}`
    : e.venueCode

  return (
    <Pagina antes={volver} className="pb-28 md:pb-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_20rem] lg:grid-cols-[1fr_24rem]">
        {/* En móvil el contenido va sin tarjeta, como en imagenes/MovilEvento.png */}
        <Tarjeta className="overflow-hidden max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:shadow-none max-md:dark:bg-transparent">
          <DetalleEventoCabecera evento={e} />
          <div className="space-y-6 pt-6 pb-6 md:px-6">
            <section aria-labelledby="titulo-artistas" className="space-y-3">
              <h2 id="titulo-artistas" className="text-base font-semibold">
                Artistas
              </h2>
              <ListaArtistasEvento artistas={e.artists} />
            </section>
            <section aria-labelledby="titulo-sede" className="space-y-3">
              <h2 id="titulo-sede" className="text-base font-semibold">
                Sede
              </h2>
              <ResumenSede nombre={e.venueName} detalle={detalleSede} a={RUTAS.sede(e.venueCode)} />
            </section>
          </div>
        </Tarjeta>
        <div className="md:sticky md:top-24 md:self-start">
          <PanelCompra evento={e} />
        </div>
      </div>
    </Pagina>
  )
}
