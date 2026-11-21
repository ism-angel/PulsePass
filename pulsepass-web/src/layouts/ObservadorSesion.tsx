import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../funcionalidades/auth/hooks.ts'
import { RUTAS, type EstadoNavegacionLogin } from '../lib/rutas.ts'

/**
 * Tras un cierre por expiración (401 o vencimiento de expiraEn) redirige UNA vez a /login con
 * state.motivo = 'expirada' y state.desde = ruta actual (FR-FE-AUTH-005, UC-FE-11).
 */
export function ObservadorSesion() {
  const { sesion, ultimoCierre } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const atendido = useRef<number | null>(null)

  useEffect(() => {
    if (ultimoCierre?.motivo !== 'expirada' || sesion.estado !== 'anonimo') return
    if (atendido.current === ultimoCierre.id) return
    atendido.current = ultimoCierre.id
    if (location.pathname === RUTAS.login) return
    const estado: EstadoNavegacionLogin = { motivo: 'expirada', desde: location.pathname }
    void navigate(RUTAS.login, { replace: true, state: estado })
  }, [ultimoCierre, sesion.estado, location.pathname, navigate])

  return null
}
