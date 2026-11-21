/**
 * Reloj inyectable (QT-FE-009 / NFR-FE-009): las pruebas fijan la hora con
 * `vi.spyOn(reloj, 'ahora')` en lugar de depender del reloj del sistema.
 */
export const reloj = {
  ahora: (): number => Date.now(),
}
