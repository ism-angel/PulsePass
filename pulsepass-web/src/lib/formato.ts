/**
 * Formato de fechas y moneda para es-CO (NFR-FE-008) con Intl.
 * El backend envía LocalDateTime/LocalDate sin zona ("2026-12-12T20:00:00", "1998-04-12"):
 * se interpretan como hora local, nunca como UTC.
 */

const LOCALE = 'es-CO'

const formatoMoneda = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const formatoFecha = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
const formatoFechaDosDigitos = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const formatoHora = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const formatoFechaNumerica = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** Quita espacios no separables que Intl inserta, para un texto estable y predecible. */
function normalizar(texto: string): string {
  return texto.replace(/[\u00a0\u202f]/g, ' ').replace(/\.(?=\s|$)/g, '')
}

/** Convierte "AAAA-MM-DD" o "AAAA-MM-DDTHH:mm[:ss[.SSS]]" en una fecha local. */
export function parsearFechaLocal(iso: string): Date {
  const [fecha = '', hora = '00:00:00'] = iso.split('T')
  const [anio = 0, mes = 1, dia = 1] = fecha.split('-').map(Number)
  const [hh = 0, mm = 0, ssCompleto = '0'] = hora.split(':')
  const ss = Number.parseFloat(ssCompleto)
  return new Date(anio, mes - 1, dia, Number(hh), Number(mm), Math.floor(ss))
}

/** 250000 → "$ 250.000" (PrecioCOP, TEST-FE-LIB-005). */
export function formatearPrecio(valor: number): string {
  return normalizar(formatoMoneda.format(valor))
}

/** Compone "día mes año" con las partes de Intl (es-CO intercala "de", que el diseño omite). */
function diaMesAnio(formato: Intl.DateTimeFormat, fecha: Date): string {
  const partes = formato.formatToParts(fecha)
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((p) => p.type === tipo)?.value ?? ''
  return normalizar(`${valor('day')} ${valor('month').replace('.', '')} ${valor('year')}`)
}

/** "2026-12-12T20:00:00" → "12 dic 2026" */
export function formatearFecha(iso: string): string {
  return diaMesAnio(formatoFecha, parsearFechaLocal(iso))
}

/** "2026-11-05T14:32:00" → "05 nov 2026" */
export function formatearFechaCorta(iso: string): string {
  return diaMesAnio(formatoFechaDosDigitos, parsearFechaLocal(iso))
}

/** "2026-12-12T20:00:00" → "20:00" */
export function formatearHora(iso: string): string {
  return normalizar(formatoHora.format(parsearFechaLocal(iso)))
}

/** "2026-12-12T20:00:00" → "12 dic 2026 · 20:00" */
export function formatearFechaHora(iso: string): string {
  return `${formatearFecha(iso)} · ${formatearHora(iso)}`
}

/** "1998-04-12" → "12/04/1998" */
export function formatearFechaNumerica(iso: string): string {
  return formatoFechaNumerica.format(parsearFechaLocal(iso))
}

/** "Andrea Ruiz" → "AR"; "Solar Beat" → "SB"; "andrea" → "A". */
export function iniciales(texto: string): string {
  const partes = texto.trim().split(/\s+/).filter(Boolean)
  const letras = partes.slice(0, 2).map((p) => p.charAt(0).toUpperCase())
  return letras.join('') || '?'
}
