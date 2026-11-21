import { z } from 'zod'
import type { EstadoNavegacionLogin } from '../../lib/rutas.ts'

/** location.state es externo (history): se valida con zod (FE-002) y solo se aceptan rutas internas. */
const EstadoLoginSchema = z.object({
  desde: z
    .string()
    .regex(/^\/(?!\/)/, 'Solo rutas internas')
    .optional()
    .catch(undefined),
  motivo: z.literal('expirada').optional().catch(undefined),
  registrado: z.boolean().optional().catch(undefined),
})

export function leerEstadoLogin(estado: unknown): EstadoNavegacionLogin {
  const resultado = EstadoLoginSchema.safeParse(estado)
  return resultado.success ? resultado.data : {}
}
