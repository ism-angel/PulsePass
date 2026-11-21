import { Cargando } from '../componentes/Cargando.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { EstadoVacio } from '../componentes/EstadoVacio.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { TarjetaSede } from '../funcionalidades/sedes/componentes/TarjetaSede.tsx'
import { useSedesActivas } from '../funcionalidades/sedes/hooks.ts'

/** Sedes activas (/sedes) — §9.7, GET /api/venues/active. */
export default function ListaSedes() {
  const sedes = useSedesActivas()
  return (
    <Pagina titulo="Sedes">
      {sedes.isPending ? <Cargando forma="lista" etiqueta="Cargando sedes…" /> : null}
      {sedes.isError ? (
        <EstadoError
          error={sedes.error}
          onReintentar={() => {
            void sedes.refetch()
          }}
        />
      ) : null}
      {sedes.isSuccess && sedes.data.length === 0 ? (
        <EstadoVacio mensaje="Aún no hay sedes activas" />
      ) : null}
      {sedes.isSuccess && sedes.data.length > 0 ? (
        <ul
          aria-label="Sedes activas"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {sedes.data.map((s) => (
            <li key={s.code}>
              <TarjetaSede sede={s} />
            </li>
          ))}
        </ul>
      ) : null}
    </Pagina>
  )
}
