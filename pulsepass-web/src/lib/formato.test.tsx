import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PrecioCOP } from '../componentes/PrecioCOP.tsx'
import {
  formatearFecha,
  formatearFechaCorta,
  formatearFechaHora,
  formatearFechaNumerica,
  formatearPrecio,
  iniciales,
  parsearFechaLocal,
} from './formato.ts'

describe('lib/formato (es-CO)', () => {
  it('TEST-FE-LIB-005: PrecioCOP formatea 250000 como COP', () => {
    expect(formatearPrecio(250000)).toBe('$ 250.000')
    render(<PrecioCOP valor={250000} />)
    expect(screen.getByText('$ 250.000')).toBeInTheDocument()
  })

  it('formatea fechas LocalDateTime/LocalDate como hora local (sin desfase UTC)', () => {
    expect(formatearFecha('2026-12-12T20:00:00')).toBe('12 dic 2026')
    expect(formatearFechaHora('2026-12-12T20:00:00')).toBe('12 dic 2026 · 20:00')
    expect(formatearFechaCorta('2026-11-05T14:32:00.123456')).toBe('05 nov 2026')
    expect(formatearFechaNumerica('1998-04-12')).toBe('12/04/1998')
    expect(parsearFechaLocal('1998-04-12').getDate()).toBe(12)
  })

  it('calcula iniciales para avatares', () => {
    expect(iniciales('Solar Beat')).toBe('SB')
    expect(iniciales('andrea')).toBe('A')
  })
})
