import { BotonEnlace } from '../componentes/Boton.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { Contenedor } from '../componentes/Contenedor.tsx'
import { EnlaceVerTodos } from '../componentes/EnlaceVerTodos.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { EstadoVacio } from '../componentes/EstadoVacio.tsx'
import { Seccion } from '../componentes/Pagina.tsx'
import { AvatarArtista } from '../funcionalidades/artistas/componentes/TarjetaArtista.tsx'
import { useArtistasActivos } from '../funcionalidades/artistas/hooks.ts'
import { useAuth } from '../funcionalidades/auth/hooks.ts'
import { GrillaEventos } from '../funcionalidades/eventos/componentes/GrillaEventos.tsx'
import { useEventosPublicados } from '../funcionalidades/eventos/hooks.ts'
import { RUTAS } from '../lib/rutas.ts'

/** Inicio (/) — Hero + próximos 3 eventos publicados + 6 artistas destacados (§9.3). Carga estática. */
export default function Inicio() {
  const { sesion } = useAuth()
  const eventos = useEventosPublicados()
  const artistas = useArtistasActivos()

  return (
    <>
      <section className="bg-linear-to-r from-marca-600 to-acento-500 text-white">
        <Contenedor className="py-12 sm:py-16">
          <h1 className="max-w-xl text-3xl font-bold sm:text-5xl">Descubre los mejores eventos</h1>
          <p className="mt-3 max-w-xl text-white/90">
            Música, cultura, deporte y tecnología en un solo lugar.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <BotonEnlace to={RUTAS.eventos} variante="claro">
              Ver cartelera
            </BotonEnlace>
            {sesion.estado === 'autenticado' ? null : (
              <BotonEnlace to={RUTAS.registro} variante="contornoClaro">
                Crear cuenta
              </BotonEnlace>
            )}
          </div>
        </Contenedor>
      </section>

      <Contenedor className="space-y-10 py-10">
        <Seccion titulo="Próximos eventos" enlace={<EnlaceVerTodos a={RUTAS.eventos} />}>
          {eventos.isPending ? <Cargando forma="tarjetas" etiqueta="Cargando eventos…" /> : null}
          {eventos.isError ? (
            <EstadoError
              error={eventos.error}
              onReintentar={() => {
                void eventos.refetch()
              }}
            />
          ) : null}
          {eventos.isSuccess && eventos.data.length === 0 ? (
            <EstadoVacio
              mensaje="Aún no hay eventos publicados"
              accion={
                <BotonEnlace to={RUTAS.artistas} variante="secundario" tamano="pequeno">
                  Ver artistas
                </BotonEnlace>
              }
            />
          ) : null}
          {eventos.isSuccess && eventos.data.length > 0 ? (
            <GrillaEventos eventos={eventos.data.slice(0, 3)} etiqueta="Próximos eventos" />
          ) : null}
        </Seccion>

        <Seccion titulo="Artistas destacados" enlace={<EnlaceVerTodos a={RUTAS.artistas} />}>
          {artistas.isPending ? <Cargando forma="linea" etiqueta="Cargando artistas…" /> : null}
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
              aria-label="Artistas destacados"
              className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-6"
            >
              {artistas.data.slice(0, 6).map((a, i) => (
                <li key={a.id}>
                  <AvatarArtista artista={a} indice={i} />
                </li>
              ))}
            </ul>
          ) : null}
        </Seccion>
      </Contenedor>
    </>
  )
}
