import { Link } from 'react-router'
import { IconoLuna, IconoMusica, IconoSol } from '../componentes/Iconos.tsx'
import { RUTAS } from '../lib/rutas.ts'
import { useTema } from '../lib/tema.ts'

/** Alterna modo claro/oscuro (FR-FE-GEN-004). */
export function BotonTema() {
  const { tema, alternar } = useTema()
  const oscuro = tema === 'oscuro'
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={oscuro ? 'Activar modo claro' : 'Activar modo oscuro'}
      className="inline-flex size-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      {oscuro ? <IconoSol className="size-5" /> : <IconoLuna className="size-5" />}
    </button>
  )
}

export function Logo() {
  return (
    <Link
      to={RUTAS.inicio}
      className="flex items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-marca-600"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-marca-600 text-white">
        <IconoMusica className="size-4" />
      </span>
      <span className="font-titulo text-lg font-bold">PulsePass</span>
    </Link>
  )
}
