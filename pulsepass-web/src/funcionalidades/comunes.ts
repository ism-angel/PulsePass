import { z } from 'zod'

/**
 * Formatos de fecha que produce Jackson para los DTO del backend:
 * LocalDateTime → "2026-12-12T20:00:00[.SSS…]" (sin zona) y LocalDate → "1998-04-12".
 */
export const FechaHoraLocalSchema = z.iso.datetime({ local: true })
export const FechaLocalSchema = z.iso.date()

/** BigDecimal llega como número JSON; se acepta también texto numérico por robustez. */
export const DineroSchema = z.coerce.number().nonnegative()
