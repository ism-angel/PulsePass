import clsx from 'clsx'
import { BadgeEstado } from '../../../componentes/Badge.tsx'
import { IconoCalendario, IconoUsuario } from '../../../componentes/Iconos.tsx'
import { formatearFechaHora } from '../../../lib/formato.ts'
import { ESTILOS_CATEGORIA } from '../categorias.tsx'
import type { EventResponse } from '../tipos.ts'

interface PropsCabecera {
  evento: EventResponse
}

/** Banner por categoría + categoría, estado, nombre, fecha, edad mínima y descripción (§9.5). */
export function DetalleEventoCabecera({ evento }: PropsCabecera) {
  const estilo = ESTILOS_CATEGORIA[evento.category]
  return (
    <>
      <div
        className={clsx(
          'flex h-44 items-center justify-center max-md:rounded-xl sm:h-56',
          estilo.fondo,
          estilo.texto,
        )}
      >
        {estilo.icono('size-16')}
      </div>
      <div className="space-y-3 pt-5 md:px-6">
        <p className="flex items-center gap-2">
          <span className={clsx('text-xs font-bold tracking-wider', estilo.texto)}>
            {evento.category}
          </span>
          <BadgeEstado estado={evento.status} />
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">{evento.name}</h1>
        <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <IconoCalendario className="size-4" />
            <time dateTime={evento.eventDate}>{formatearFechaHora(evento.eventDate)}</time>
          </span>
          <span className="flex items-center gap-1.5">
            <IconoUsuario className="size-4" />
            Edad mínima: {evento.minimumAge}
          </span>
        </p>
        {evento.description ? (
          <p className="text-slate-700 dark:text-slate-300">{evento.description}</p>
        ) : null}
      </div>
    </>
  )
}
