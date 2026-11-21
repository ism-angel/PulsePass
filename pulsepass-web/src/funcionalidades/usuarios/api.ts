import { http } from '../../lib/http.ts'
import { UserResponseSchema, type RegisterUserRequest } from './tipos.ts'

/** #12 / A3 POST /api/users — registro con contraseña (Fase 3 + Fase 4). El rol siempre es USER. */
export function registrarUsuario(datos: RegisterUserRequest) {
  return http.post('/users', UserResponseSchema, {
    username: datos.username.trim(),
    email: datos.email.trim(),
    firstName: datos.firstName.trim(),
    lastName: datos.lastName.trim(),
    birthDate: datos.birthDate,
    password: datos.password,
  })
}

/** #13 GET /api/users/by-email?email= (solo la identidad propia, salvo ADMIN) */
export function obtenerUsuarioPorEmail(email: string) {
  return http.get('/users/by-email', UserResponseSchema, { email })
}

/** #14 GET /api/users/by-username?username= */
export function obtenerUsuarioPorUsername(username: string) {
  return http.get('/users/by-username', UserResponseSchema, { username })
}
