import { http } from '../../lib/http.ts'
import { AuthResponseSchema, UsuarioAutenticadoSchema, type LoginForm } from './tipos.ts'

/** A1 POST /api/auth/login */
export function login(credenciales: LoginForm) {
  return http.post('/auth/login', AuthResponseSchema, {
    identifier: credenciales.identifier.trim(),
    password: credenciales.password,
  })
}

/** A2 GET /api/auth/me (requiere Bearer) */
export function obtenerUsuarioActual() {
  return http.get('/auth/me', UsuarioAutenticadoSchema)
}
