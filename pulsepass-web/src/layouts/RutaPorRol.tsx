import { Navigate, Outlet, useLocation } from 'react-router'
import { Cargando } from '../componentes/Cargando.tsx'
import { Contenedor } from '../componentes/Contenedor.tsx'
import { useAuth } from '../funcionalidades/auth/hooks.ts'
import type { Rol } from '../funcionalidades/auth/tipos.ts'
import { RUTAS, type EstadoNavegacionLogin } from '../lib/rutas.ts'

interface PropsRutaPorRol {
  roles: Rol[]
}

/** Layout route por rol (PRD §12.3). Rol insuficiente → /403. Un 403 del servidor siempre prevalece. */
export default function RutaPorRol({ roles }: PropsRutaPorRol) {
  const { sesion, ultimoCierre } = useAuth()
  const location = useLocation()
  if (sesion.estado === 'cargando') {
    return (
      <Contenedor className="py-8">
        <Cargando forma="detalle" etiqueta="Verificando permisos…" />
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
  if (!roles.some((r) => sesion.usuario.roles.includes(r))) {
    return <Navigate to={RUTAS.sinPermisos} replace />
  }
  return <Outlet />
}
