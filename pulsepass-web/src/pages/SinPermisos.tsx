import { BotonEnlace } from '../componentes/Boton.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { RUTAS } from '../lib/rutas.ts'

/** /403 — por RutaPorRol o cuando la API responde 403 en una carga de página completa (§9.19). */
export default function SinPermisos() {
  return (
    <Pagina>
      <Tarjeta className="mx-auto max-w-md px-6 py-10 text-center">
        <p className="font-titulo text-6xl font-bold text-marca-600 dark:text-marca-500">403</p>
        <h1 className="mt-3 text-lg font-semibold">
          No tienes permisos para acceder a esta sección.
        </h1>
        <BotonEnlace to={RUTAS.inicio} className="mt-5">
          Volver al inicio
        </BotonEnlace>
      </Tarjeta>
    </Pagina>
  )
}
