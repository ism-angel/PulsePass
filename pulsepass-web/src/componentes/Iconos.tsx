import type { ComponentProps, ReactNode } from 'react'

/**
 * Íconos SVG de trazo (DES-01): sin emojis. Los decorativos llevan aria-hidden.
 * Cada ícono acepta className para tamaño/color con clases completas de Tailwind.
 */
type PropsIcono = Omit<ComponentProps<'svg'>, 'children'>

function Base({ children, className = 'size-5', ...resto }: PropsIcono & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...resto}
    >
      {children}
    </svg>
  )
}

export function IconoMusica(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </Base>
  )
}
export function IconoMonitor(p: PropsIcono) {
  return (
    <Base {...p}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Base>
  )
}
export function IconoBalon(p: PropsIcono) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20" />
    </Base>
  )
}
export function IconoBirrete(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c3 2 9 2 12 0v-5" />
    </Base>
  )
}
export function IconoMuseo(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M3 21h18M5 21V10M19 21V10M9 21v-8M15 21v-8M2 10l10-6 10 6Z" />
    </Base>
  )
}
export function IconoEstrella(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" />
    </Base>
  )
}
export function IconoCalendario(p: PropsIcono) {
  return (
    <Base {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Base>
  )
}
export function IconoUbicacion(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Base>
  )
}
export function IconoUsuario(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Base>
  )
}
export function IconoFlechaIzquierda(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </Base>
  )
}
export function IconoFlechaDerecha(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </Base>
  )
}
export function IconoMenu(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Base>
  )
}
export function IconoCerrar(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Base>
  )
}
export function IconoBuscar(p: PropsIcono) {
  return (
    <Base {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </Base>
  )
}
export function IconoAlerta(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </Base>
  )
}
export function IconoCheck(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M20 6 9 17l-5-5" />
    </Base>
  )
}
export function IconoCopiar(p: PropsIcono) {
  return (
    <Base {...p}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Base>
  )
}
export function IconoMas(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  )
}
export function IconoRayo(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
    </Base>
  )
}
export function IconoBandeja(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z" />
    </Base>
  )
}
export function IconoTicket(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </Base>
  )
}
export function IconoSol(p: PropsIcono) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Base>
  )
}
export function IconoLuna(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Base>
  )
}
export function IconoChevronAbajo(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="m6 9 6 6 6-6" />
    </Base>
  )
}
export function IconoOjo(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Base>
  )
}
export function IconoOjoTachado(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M9.9 4.2A10.4 10.4 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </Base>
  )
}
export function IconoSalir(p: PropsIcono) {
  return (
    <Base {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </Base>
  )
}
