import { isRouteErrorResponse, useRouteError } from 'react-router'
import { Boton, BotonEnlace } from '../componentes/Boton.tsx'
import { Contenedor } from '../componentes/Contenedor.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { MENSAJES } from '../lib/errores.ts'
import { RUTAS } from '../lib/rutas.ts'

/**
 * errorElement del layout raíz (§9.19): useRouteError() + isRouteErrorResponse.
 * Nunca muestra stack traces ni mensajes internos (TEST-FE-GEN-002).
 */
export default function ErrorPagina() {
  const error = useRouteError()
  const mensaje =
    isRouteErrorResponse(error) && error.status === 404
      ? 'No encontramos esta página.'
      : MENSAJES.inesperado

  return (
    <Contenedor className="py-12">
      <Tarjeta className="mx-auto max-w-xl p-6">
        <h1 className="text-xl font-bold">¡Ups! Algo salió mal.</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{mensaje}</p>
        <div className="mt-5 flex gap-2">
          <Boton
            onClick={() => {
              window.location.reload()
            }}
          >
            Reintentar
          </Boton>
          <BotonEnlace to={RUTAS.inicio} variante="secundario" reloadDocument>
            Volver al inicio
          </BotonEnlace>
        </div>
      </Tarjeta>
    </Contenedor>
  )
}
