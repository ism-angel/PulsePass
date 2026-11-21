/** Indicador visual (no es una regla de negocio): solo orienta a la persona. */
export function nivelFortaleza(clave: string): 0 | 1 | 2 | 3 {
  if (clave.length === 0) return 0
  let puntos = 0
  if (clave.length >= 12) puntos++
  if (clave.length >= 16) puntos++
  if (/[A-Z]/.test(clave) && /[a-z]/.test(clave)) puntos++
  if (/\d/.test(clave) && /[^A-Za-z0-9]/.test(clave)) puntos++
  if (puntos <= 1) return 1
  return puntos === 2 ? 2 : 3
}
