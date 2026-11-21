import { z } from 'zod'

export const RolSchema = z.enum(['USER', 'STAFF', 'ADMIN'])
export type Rol = z.infer<typeof RolSchema>

/** LoginRequest.java — identifier = username o email. */
export const LoginSchema = z.object({
  identifier: z.string().trim().min(1, 'Ingresa tu usuario o correo'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
export type LoginForm = z.infer<typeof LoginSchema>

/** AuthResponse.java: {"accessToken": "...", "tokenType": "Bearer", "expiresIn": 900}. */
export const AuthResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().int().positive(),
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>

/**
 * AuthenticatedUserResponse.java (GET /api/auth/me) — confirmado: id, username, email, roles.
 * Los roles llegan como nombres del enum Role ("USER", "STAFF", "ADMIN") sin prefijo ROLE_.
 */
export const UsuarioAutenticadoSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  email: z.string(),
  roles: z.array(RolSchema),
})
export type UsuarioAutenticado = z.infer<typeof UsuarioAutenticadoSchema>

/** Estado de sesión como unión discriminada (FE-006, PRD §12.1). */
export type Sesion =
  | { estado: 'cargando' }
  | { estado: 'anonimo' }
  | { estado: 'autenticado'; token: string; expiraEn: number; usuario: UsuarioAutenticado }
