import type { ReactNode } from 'react'
import { useParams } from 'react-router'
import { Badge } from '../componentes/Badge.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { CodigoTexto } from '../componentes/CodigoTexto.tsx'
import { EnlaceVolver } from '../componentes/EnlaceVolver.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { useSede } from '../funcionalidades/sedes/hooks.ts'
import { esEstado } from '../lib/errores.ts'
import { RUTAS } from '../lib/rutas.ts'
import { ContenidoNoEncontrada } from './NoEncontrada.tsx'

/** Detalle de sede (/sedes/:code) — §9.7, GET /api/venues/{code}; 404 → NoEncontrada. */
export default function DetalleSede() {
  const { code = '' } = useParams()
  const sede = useSede(code)

  if (esEstado(sede.error, 404)) return <ContenidoNoEncontrada />

  return (
    <Pagina estrecha antes={<EnlaceVolver a={RUTAS.sedes}>Sedes</EnlaceVolver>}>
      {sede.isPending ? <Cargando forma="detalle" etiqueta="Cargando sede…" /> : null}
      {sede.isError ? (
        <EstadoError
          error={sede.error}
          onReintentar={() => {
            void sede.refetch()
          }}
        />
      ) : null}
      {sede.isSuccess ? (
        <Tarjeta className="mx-auto max-w-lg p-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold">{sede.data.name}</h1>
            <Badge tono={sede.data.active ? 'activo' : 'inactivo'}>
              {sede.data.active ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>
          <dl className="mt-4 divide-y divide-slate-100 text-sm dark:divide-slate-800">
            <Fila etiqueta="Código" valor={<CodigoTexto>{sede.data.code}</CodigoTexto>} />
            <Fila etiqueta="Ciudad" valor={sede.data.city} />
            {sede.data.address ? <Fila etiqueta="Dirección" valor={sede.data.address} /> : null}
            <Fila
              etiqueta="Capacidad"
              valor={`${sede.data.capacity.toLocaleString('es-CO')} personas`}
            />
            <Fila etiqueta="Estado" valor={sede.data.active ? 'Activa' : 'Inactiva'} />
          </dl>
        </Tarjeta>
      ) : null}
    </Pagina>
  )
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-slate-500 dark:text-slate-400">{etiqueta}</dt>
      <dd className="text-right font-medium">{valor}</dd>
    </div>
  )
}
