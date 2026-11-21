import { Boton } from '../../../componentes/Boton.tsx'
import { Campo } from '../../../componentes/Campo.tsx'
import { IconoBuscar } from '../../../componentes/Iconos.tsx'
import { Selector } from '../../../componentes/Selector.tsx'
import type { ArtistResponse } from '../../artistas/tipos.ts'
import { CATEGORIAS } from '../categorias.tsx'
import type { FiltrosCartelera } from '../tipos.ts'

interface PropsBarraFiltros {
  filtros: FiltrosCartelera
  artistas: readonly ArtistResponse[]
  onCambiar: (cambios: Partial<FiltrosCartelera>) => void
  onLimpiar: () => void
}

/** Buscar por nombre · Categoría · Artista · Limpiar (§9.4). Los valores viven en la URL. */
export function BarraFiltros({ filtros, artistas, onCambiar, onLimpiar }: PropsBarraFiltros) {
  return (
    <form
      role="search"
      aria-label="Filtrar cartelera"
      onSubmit={(e) => {
        e.preventDefault()
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_auto] lg:items-end"
    >
      <Campo
        etiqueta="Buscar por nombre"
        type="search"
        placeholder="Buscar por nombre…"
        icono={<IconoBuscar className="size-4" />}
        value={filtros.q}
        onChange={(e) => {
          onCambiar({ q: e.target.value })
        }}
      />
      <Selector
        etiqueta="Categoría"
        value={filtros.categoria}
        onChange={(e) => {
          const valor = CATEGORIAS.find((c) => c === e.target.value)
          onCambiar({ categoria: valor ?? '' })
        }}
      >
        <option value="">Todas</option>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Selector>
      <Selector
        etiqueta="Artista"
        value={filtros.artista}
        onChange={(e) => {
          onCambiar({ artista: e.target.value })
        }}
      >
        <option value="">Todos</option>
        {artistas.map((a) => (
          <option key={a.id} value={a.stageName}>
            {a.stageName}
          </option>
        ))}
      </Selector>
      <Boton variante="secundario" onClick={onLimpiar} className="sm:col-span-2 lg:col-span-1">
        Limpiar
      </Boton>
    </form>
  )
}
