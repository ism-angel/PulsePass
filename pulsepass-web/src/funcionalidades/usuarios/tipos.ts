import { z } from 'zod'
import { FechaLocalSchema } from '../comunes.ts'
import { bytesUtf8 } from '../../lib/formularios.ts'
import { reloj } from '../../lib/reloj.ts'

/** UserResponse.java — confirmado (sin hash ni credenciales). */
export const UserResponseSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  email: z.string(),
  active: z.boolean(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  city: z.string().nullable(),
  birthDate: FechaLocalSchema.nullable(),
})
export type UserResponse = z.infer<typeof UserResponseSchema>

function hoyIso(): string {
  const hoy = new Date(reloj.ahora())
  const mm = String(hoy.getMonth() + 1).padStart(2, '0')
  const dd = String(hoy.getDate()).padStart(2, '0')
  return `${String(hoy.getFullYear())}-${mm}-${dd}`
}

/** Formulario de registro (PRD §9.9, §11). Solo validación estructural; la edad la valida el backend. */
export const RegistroFormSchema = z.object({
  username: z.string().trim().min(1, 'Ingresa un nombre de usuario'),
  email: z.string().trim().min(1, 'Ingresa tu correo').pipe(z.email('Ingresa un correo válido')),
  firstName: z.string().trim().min(1, 'Ingresa tus nombres'),
  lastName: z.string().trim().min(1, 'Ingresa tus apellidos'),
  birthDate: z
    .string()
    .min(1, 'Ingresa tu fecha de nacimiento')
    .pipe(FechaLocalSchema.refine((f) => f <= hoyIso(), 'La fecha no puede ser futura')),
  password: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres')
    .refine((p) => bytesUtf8(p) <= 72, 'La contraseña no puede superar 72 bytes'),
})
export type RegistroForm = z.infer<typeof RegistroFormSchema>

/** RegisterUserRequest.java (phone y city son opcionales en el backend). */
export type RegisterUserRequest = RegistroForm
