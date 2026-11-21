import { useParams } from 'react-router'
import { Avatar } from '../componentes/Avatar.tsx'
import { Badge } from '../componentes/Badge.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { EnlaceVolver } from '../componentes/EnlaceVolver.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { EstadoVacio } from '../componentes/EstadoVacio.tsx'
import { Pagina, Seccion } from '../componentes/Pagina.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { useArtista } from '../funcionalidades/artistas/hooks.ts'
import { IdArtistaSchema } from '../funcionalidades/artistas/tipos.ts'
import { GrillaEventos } from '../funcionalidades/eventos/componentes/GrillaEventos.tsx'
import { useEventosPorArtista } from '../funcionalidades/eventos/hooks.ts'
import { esEstado } from '../lib/errores.ts'
import { RUTAS } from '../lib/rutas.ts'
import { ContenidoNoEncontrada } from './NoEncontrada.tsx'

/**
 * Detalle de artista (/artistas/:id) — §9.6. El id se valida con zod: si no es numérico se muestra
 * el 404 de UI sin llamar a la API (TEST-FE-ART-003). Los eventos salen de by-artist con su stageName.
 */
export default function DetalleArtista() {
  const { id } = useParams()
  const valido = IdArtistaSchema.safeParse(id)
  const idArtista = valido.success ? valido.data : null
  const artista = useArtista(idArtista)
  const eventos = useEventosPorArtista(artista.data?.stageName ?? '')
  const volver = <EnlaceVolver a={RUTAS.artistas}>Artistas</EnlaceVolver>

  if (idArtista === null || esEstado(artista.error, 404)) return <ContenidoNoEncontrada />

  return (
    <Pagina antes={volver}>
      {artista.isPending ? <Cargando forma="detalle" etiqueta="Cargando artista…" /> : null}
      {artista.isError ? (
        <EstadoError
          error={artista.error}
          onReintentar={() => {
            void artista.refetch()
          }}
        />
      ) : null}
      {artista.isSuccess ? (
        <div className="space-y-8">
          <Tarjeta className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left">
            <Avatar nombre={artista.data.stageName} tamano="xl" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{artista.data.stageName}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Nombre artístico
                {artista.data.genre ? ` · ${artista.data.genre}` : ''}
                {artista.data.country ? ` · ${artista.data.country}` : ''}
              </p>
              <Badge tono={artista.data.active ? 'activo' : 'inactivo'}>
                {artista.data.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </Tarjeta>
          <Seccion titulo={`Próximos eventos de ${artista.data.stageName}`}>
            {eventos.isPending ? (
              <Cargando forma="tarjetas" etiqueta="Cargando eventos…" cantidad={2} />
            ) : null}
            {eventos.isError ? (
              <EstadoError
                error={eventos.error}
                onReintentar={() => {
                  void eventos.refetch()
                }}
              />
            ) : null}
            {eventos.isSuccess && eventos.data.length === 0 ? (
              <EstadoVacio mensaje="Sin eventos próximos" />
            ) : null}
            {eventos.isSuccess && eventos.data.length > 0 ? (
              <GrillaEventos
                eventos={eventos.data}
                etiqueta={`Eventos de ${artista.data.stageName}`}
              />
            ) : null}
          </Seccion>
        </div>
      ) : null}
    </Pagina>
  )
}
