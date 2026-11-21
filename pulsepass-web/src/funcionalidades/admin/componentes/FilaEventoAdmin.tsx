import { BadgeEstado } from '../../../componentes/Badge.tsx'
import { BotonEnlace } from '../../../componentes/Boton.tsx'
import { CodigoTexto } from '../../../componentes/CodigoTexto.tsx'
import { Esqueleto } from '../../../componentes/Cargando.tsx'
import { Tarjeta } from '../../../componentes/Tarjeta.tsx'
import { mensajeDeError } from '../../../lib/errores.ts'
import { RUTAS } from '../../../lib/rutas.ts'
import { useEvento } from '../../eventos/hooks.ts'

/** Fila "código · nombre · estado · Gestionar". Los datos siempre vienen de GET /api/events/{code}. */
export function FilaEventoAdmin({ eventCode }: { eventCode: string }) {
  const evento = useEvento(eventCode)
  return (
    <Tarjeta className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm">
        <CodigoTexto className="font-semibold">{eventCode}</CodigoTexto>
        {evento.isSuccess ? <> · {evento.data.name}</> : null}
        {evento.isError ? (
          <span className="text-red-700 dark:text-red-400"> · {mensajeDeError(evento.error)}</span>
        ) : null}
      </p>
      <div className="flex items-center gap-3">
        {evento.isPending ? <Esqueleto className="h-5 w-16" /> : null}
        {evento.isSuccess ? <BadgeEstado estado={evento.data.status} /> : null}
        <BotonEnlace to={RUTAS.adminEvento(eventCode)} variante="secundario" tamano="pequeno">
          Gestionar
        </BotonEnlace>
      </div>
    </Tarjeta>
  )
}
