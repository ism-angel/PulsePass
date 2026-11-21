import { Cargando } from '../componentes/Cargando.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { EstadoVacio } from '../componentes/EstadoVacio.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { TarjetaArtista } from '../funcionalidades/artistas/componentes/TarjetaArtista.tsx'
import { useArtistasActivos } from '../funcionalidades/artistas/hooks.ts'

/** Lista de artistas activos (/artistas) — §9.6, GET /api/artists/active. */
export default function ListaArtistas() {
  const artistas = useArtistasActivos()
  return (
    <Pagina titulo="Artistas">
      {artistas.isPending ? (
        <Cargando forma="tarjetas" etiqueta="Cargando artistas…" cantidad={4} />
      ) : null}
      {artistas.isError ? (
        <EstadoError
          error={artistas.error}
          onReintentar={() => {
            void artistas.refetch()
          }}
        />
      ) : null}
      {artistas.isSuccess && artistas.data.length === 0 ? (
        <EstadoVacio mensaje="Aún no hay artistas activos" />
      ) : null}
      {artistas.isSuccess && artistas.data.length > 0 ? (
        <ul
          aria-label="Artistas activos"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {artistas.data.map((a, i) => (
            <li key={a.id}>
              <TarjetaArtista artista={a} indice={i} />
            </li>
          ))}
        </ul>
      ) : null}
    </Pagina>
  )
}
