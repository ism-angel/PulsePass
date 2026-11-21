import { useSearchParams } from 'react-router'
import { Aviso } from '../componentes/Aviso.tsx'
import { BotonEnlace } from '../componentes/Boton.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { EstadoVacio } from '../componentes/EstadoVacio.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { useArtistaPorNombre, useArtistasActivos } from '../funcionalidades/artistas/hooks.ts'
import { BarraFiltros } from '../funcionalidades/eventos/componentes/BarraFiltros.tsx'
import { GrillaEventos } from '../funcionalidades/eventos/componentes/GrillaEventos.tsx'
import { useEventosPorArtista, useEventosPublicados } from '../funcionalidades/eventos/hooks.ts'
import { FiltrosCarteleraSchema, type FiltrosCartelera } from '../funcionalidades/eventos/tipos.ts'
import { esEstado } from '../lib/errores.ts'
import { RUTAS } from '../lib/rutas.ts'

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/**
 * Cartelera (/eventos) — §9.4. Filtros en la URL (?q=&categoria=&artista=) y validados con zod.
 * Con ?artista= usa GET /api/events/by-artist y resuelve el artista con by-stage-name.
 */
export default function CatalogoEventos() {
  const [parametros, setParametros] = useSearchParams()
  const filtros = FiltrosCarteleraSchema.parse({
    q: parametros.get('q') ?? '',
    categoria: parametros.get('categoria') ?? '',
    artista: parametros.get('artista') ?? '',
  })

  const publicados = useEventosPublicados()
  const porArtista = useEventosPorArtista(filtros.artista)
  const artistaFiltro = useArtistaPorNombre(filtros.artista)
  const artistas = useArtistasActivos()
  const consulta = filtros.artista ? porArtista : publicados

  function actualizar(cambios: Partial<FiltrosCartelera>) {
    const siguiente = { ...filtros, ...cambios }
    const nuevos = new URLSearchParams()
    if (siguiente.q) nuevos.set('q', siguiente.q)
    if (siguiente.categoria) nuevos.set('categoria', siguiente.categoria)
    if (siguiente.artista) nuevos.set('artista', siguiente.artista)
    setParametros(nuevos, { replace: true })
  }

  const texto = normalizarTexto(filtros.q.trim())
  const visibles = (consulta.data ?? []).filter(
    (e) =>
      (texto === '' || normalizarTexto(e.name).includes(texto)) &&
      (filtros.categoria === '' || e.category === filtros.categoria),
  )

  return (
    <Pagina titulo="Cartelera">
      <BarraFiltros
        filtros={filtros}
        artistas={artistas.data ?? []}
        onCambiar={actualizar}
        onLimpiar={() => {
          setParametros(new URLSearchParams(), { replace: true })
        }}
      />
      {filtros.artista && artistaFiltro.isSuccess ? (
        <p className="mt-4 text-sm">
          Eventos de{' '}
          <BotonEnlace
            to={RUTAS.artista(artistaFiltro.data.id)}
            variante="fantasma"
            tamano="pequeno"
          >
            {artistaFiltro.data.stageName}
          </BotonEnlace>
        </p>
      ) : null}
      {filtros.artista && esEstado(artistaFiltro.error, 404) ? (
        <Aviso tono="advertencia" className="mt-4">
          No encontramos el artista «{filtros.artista}».
        </Aviso>
      ) : null}

      <div className="mt-6">
        {consulta.isPending ? (
          <Cargando forma="tarjetas" etiqueta="Cargando eventos…" cantidad={6} />
        ) : null}
        {consulta.isError ? (
          <EstadoError
            error={consulta.error}
            onReintentar={() => {
              void consulta.refetch()
            }}
          />
        ) : null}
        {consulta.isSuccess ? (
          <>
            <p className="mb-4 text-xs text-slate-600 dark:text-slate-400" aria-live="polite">
              {visibles.length} {visibles.length === 1 ? 'evento' : 'eventos'}
            </p>
            {visibles.length === 0 ? (
              <EstadoVacio mensaje="Sin resultados para tu búsqueda" />
            ) : (
              <GrillaEventos eventos={visibles} etiqueta="Eventos de la cartelera" />
            )}
          </>
        ) : null}
      </div>
    </Pagina>
  )
}
