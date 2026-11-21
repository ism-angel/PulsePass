import clsx from 'clsx'
import { Link } from 'react-router'
import { BadgeEstado } from '../../../componentes/Badge.tsx'
import { IconoCalendario, IconoUbicacion } from '../../../componentes/Iconos.tsx'
import { formatearFecha } from '../../../lib/formato.ts'
import { RUTAS } from '../../../lib/rutas.ts'
import { ESTILOS_CATEGORIA } from '../categorias.tsx'
import type { EventSummaryResponse } from '../tipos.ts'

interface PropsTarjetaEvento {
  evento: EventSummaryResponse
}

/** Tarjeta de evento: toda la tarjeta es un Link a /eventos/:eventCode (§9.4). */
export function TarjetaEvento({ evento }: PropsTarjetaEvento) {
  const estilo = ESTILOS_CATEGORIA[evento.category]
  return (
    <Link
      to={RUTAS.evento(evento.eventCode)}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className={clsx('flex h-28 items-center justify-center', estilo.fondo, estilo.texto)}>
        {estilo.icono('size-9')}
      </div>
      <div className="space-y-1.5 p-4">
        <p className={clsx('text-[11px] font-bold tracking-wider', estilo.texto)}>
          {evento.category}
        </p>
        <h3 className="font-titulo text-base font-semibold text-slate-900 group-hover:text-marca-700 dark:text-slate-100">
          {evento.name}
        </h3>
        <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <IconoCalendario className="size-3.5" />
          <time dateTime={evento.eventDate}>{formatearFecha(evento.eventDate)}</time>
        </p>
        <p className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <IconoUbicacion className="size-3.5" />
          {evento.venueName}
        </p>
        <div className="pt-1">
          <BadgeEstado estado={evento.status} />
        </div>
      </div>
    </Link>
  )
}
