import clsx from 'clsx'
import { Link } from 'react-router'
import { Badge } from '../../../componentes/Badge.tsx'
import { IconoMuseo, IconoUbicacion } from '../../../componentes/Iconos.tsx'
import { RUTAS } from '../../../lib/rutas.ts'
import type { VenueResponse } from '../tipos.ts'

interface PropsTarjetaSede {
  sede: VenueResponse
}

/** Tarjeta de sede para el listado (/sedes). */
export function TarjetaSede({ sede }: PropsTarjetaSede) {
  return (
    <Link
      to={RUTAS.sede(sede.code)}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-titulo text-base font-semibold">{sede.name}</h2>
        <Badge tono={sede.active ? 'activo' : 'inactivo'}>
          {sede.active ? 'Activa' : 'Inactiva'}
        </Badge>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
        <IconoUbicacion className="size-3.5" />
        {sede.city} · Cap. {sede.capacity.toLocaleString('es-CO')}
      </p>
    </Link>
  )
}

interface PropsResumenSede {
  nombre: string
  detalle: string
  a?: string
}

/** Recuadro de la sede dentro del detalle de evento (nombre + ciudad · capacidad). */
export function ResumenSede({ nombre, detalle, a }: PropsResumenSede) {
  const contenido = (
    <>
      <IconoMuseo className="size-5 text-marca-600 dark:text-marca-500" />
      <span>
        <span className="block text-sm font-semibold">{nombre}</span>
        <span className="block text-xs text-slate-600 dark:text-slate-400">{detalle}</span>
      </span>
    </>
  )
  const clases =
    'flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800'
  return a ? (
    <Link
      to={a}
      className={clsx(
        clases,
        'hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-marca-600 dark:hover:bg-slate-800',
      )}
    >
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  )
}
