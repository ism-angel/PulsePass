import { BotonEnlace } from '../componentes/Boton.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { RUTAS } from '../lib/rutas.ts'

/** Contenido del 404 reutilizable por páginas de detalle (artista/sede inexistentes). */
export function ContenidoNoEncontrada() {
  return (
    <Pagina>
      <Tarjeta className="mx-auto max-w-md px-6 py-10 text-center">
        <p className="font-titulo text-6xl font-bold text-marca-600 dark:text-marca-500">404</p>
        <h1 className="mt-3 text-lg font-semibold">No encontramos esta página</h1>
        <BotonEnlace to={RUTAS.inicio} className="mt-5">
          Volver al inicio
        </BotonEnlace>
      </Tarjeta>
    </Pagina>
  )
}

/** Ruta * (§8.1 #20). */
export default function NoEncontrada() {
  return <ContenidoNoEncontrada />
}
