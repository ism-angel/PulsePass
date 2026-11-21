import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../funcionalidades/auth/hooks.ts'
import { RUTAS } from '../lib/rutas.ts'
import { leerEstadoLogin } from '../funcionalidades/auth/estadoNavegacion.ts'

/** /login y /registro: si ya hay sesión, redirige a la ruta de origen o a / (PRD §9.8). */
export default function SoloAnonimo() {
  const { sesion } = useAuth()
  const location = useLocation()
  if (sesion.estado === 'autenticado') {
    const { desde } = leerEstadoLogin(location.state)
    return <Navigate to={desde ?? RUTAS.inicio} replace />
  }
  return <Outlet />
}
