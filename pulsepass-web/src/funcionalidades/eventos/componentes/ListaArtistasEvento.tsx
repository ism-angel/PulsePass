import { Link } from 'react-router'
import { Avatar } from '../../../componentes/Avatar.tsx'
import { RUTAS } from '../../../lib/rutas.ts'
import type { ArtistResponse } from '../../artistas/tipos.ts'

interface PropsLista {
  artistas: readonly ArtistResponse[]
  enlazar?: boolean
}

export function ListaArtistasEvento({ artistas, enlazar = true }: PropsLista) {
  if (artistas.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">Aún no hay artistas asociados.</p>
    )
  }
  return (
    <ul aria-label="Artistas del evento" className="flex flex-wrap gap-x-5 gap-y-3">
      {artistas.map((a, i) => {
        const contenido = (
          <>
            <Avatar nombre={a.stageName} indice={i} tamano="sm" />
            <span className="text-sm font-medium">{a.stageName}</span>
          </>
        )
        return (
          <li key={a.id}>
            {enlazar ? (
              <Link
                to={RUTAS.artista(a.id)}
                className="flex items-center gap-2 rounded-full hover:text-marca-700 focus-visible:outline-2 focus-visible:outline-marca-600"
              >
                {contenido}
              </Link>
            ) : (
              <span className="flex items-center gap-2">{contenido}</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
