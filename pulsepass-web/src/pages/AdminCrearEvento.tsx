import { Cargando } from '../componentes/Cargando.tsx'
import { EnlaceVolver } from '../componentes/EnlaceVolver.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { FormularioEvento } from '../funcionalidades/admin/componentes/FormularioEvento.tsx'
import { useSedesActivas } from '../funcionalidades/sedes/hooks.ts'
import { RUTAS } from '../lib/rutas.ts'

/** Crear evento (/admin/eventos/nuevo) — §9.17. Sedes del select desde GET /api/venues/active (#2). */
export default function AdminCrearEvento() {
  const sedes = useSedesActivas()
  return (
    <Pagina
      estrecha
      titulo="Nuevo evento"
      antes={<EnlaceVolver a={RUTAS.adminEventos}>Eventos</EnlaceVolver>}
    >
      <Tarjeta className="p-5 sm:p-6">
        {sedes.isPending ? <Cargando forma="detalle" etiqueta="Cargando sedes…" /> : null}
        {sedes.isError ? (
          <EstadoError
            error={sedes.error}
            onReintentar={() => {
              void sedes.refetch()
            }}
          />
        ) : null}
        {sedes.isSuccess ? <FormularioEvento sedes={sedes.data} /> : null}
      </Tarjeta>
    </Pagina>
  )
}
