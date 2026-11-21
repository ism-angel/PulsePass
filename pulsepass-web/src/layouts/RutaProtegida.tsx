import { Navigate, Outlet, useLocation } from 'react-router'
import { Cargando } from '../componentes/Cargando.tsx'
import { Contenedor } from '../componentes/Contenedor.tsx'
import { useAuth } from '../funcionalidades/auth/hooks.ts'
import { RUTAS, type EstadoNavegacionLogin } from '../lib/rutas.ts'

/** Layout route que exige sesión (FE-004: solo UX; el servidor aplica la seguridad real). */
export default function RutaProtegida() {
  const { sesion, ultimoCierre } = useAuth()
  const location = useLocation()
  if (sesion.estado === 'cargando') {
    return (
      <Contenedor className="py-8">
        <Cargando forma="detalle" etiqueta="Verificando sesión…" />
      </Contenedor>
    )
  }
  if (sesion.estado === 'anonimo') {
    const estado: EstadoNavegacionLogin = {
      desde: location.pathname,
      motivo: ultimoCierre?.motivo === 'expirada' ? 'expirada' : undefined,
    }
    return <Navigate to={RUTAS.login} replace state={estado} />
  }
  return <Outlet />
}
