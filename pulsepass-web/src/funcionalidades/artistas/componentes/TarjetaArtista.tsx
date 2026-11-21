import { Link } from 'react-router'
import { Avatar } from '../../../componentes/Avatar.tsx'
import { RUTAS } from '../../../lib/rutas.ts'
import type { ArtistResponse } from '../tipos.ts'

interface PropsTarjetaArtista {
  artista: ArtistResponse
  indice: number
}

/** Tarjeta de la cuadrícula de artistas (§9.6). */
export function TarjetaArtista({ artista, indice }: PropsTarjetaArtista) {
  return (
    <Link
      to={RUTAS.artista(artista.id)}
      className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-6 text-center shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-600 dark:border-slate-800 dark:bg-slate-900"
    >
      <Avatar nombre={artista.stageName} indice={indice} tamano="lg" />
      <span className="font-titulo text-sm font-semibold">{artista.stageName}</span>
      {artista.genre ? (
        <span className="text-xs text-slate-500 dark:text-slate-400">{artista.genre}</span>
      ) : null}
    </Link>
  )
}

interface PropsAvatarArtista {
  artista: ArtistResponse
  indice: number
}

/** Avatar + nombre en fila (Inicio: "Artistas destacados"). */
export function AvatarArtista({ artista, indice }: PropsAvatarArtista) {
  return (
    <Link
      to={RUTAS.artista(artista.id)}
      className="flex items-center gap-3 rounded-full pr-2 hover:text-marca-700 focus-visible:outline-2 focus-visible:outline-marca-600"
    >
      <Avatar nombre={artista.stageName} indice={indice} tamano="md" />
      <span className="text-sm font-semibold">{artista.stageName}</span>
    </Link>
  )
}
