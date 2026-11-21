import type { ArtistResponse } from '../../funcionalidades/artistas/tipos.ts'
import type { Rol } from '../../funcionalidades/auth/tipos.ts'
import type { EventResponse } from '../../funcionalidades/eventos/tipos.ts'
import type { VenueResponse } from '../../funcionalidades/sedes/tipos.ts'
import type { TicketResponse } from '../../funcionalidades/tickets/tipos.ts'
import type { UserResponse } from '../../funcionalidades/usuarios/tipos.ts'

/** Escenario de referencia del PRD §22 (datos deterministas, sin red real). */
export const CLAVE_VALIDA = 'Clave-Segura-2026'

export interface UsuarioDemo extends UserResponse {
  roles: Rol[]
}

export function crearDatos() {
  const sedes: VenueResponse[] = [
    {
      id: 1,
      code: 'VEN-SMR-01',
      name: 'Marina Convention Center',
      city: 'Santa Marta',
      address: 'Cra. 1 #10-20',
      capacity: 3,
      active: true,
    },
    {
      id: 2,
      code: 'VEN-BAQ-01',
      name: 'Centro de Convenciones Caribe',
      city: 'Barranquilla',
      address: null,
      capacity: 1200,
      active: true,
    },
  ]
  const artistas: ArtistResponse[] = [
    { id: 1, stageName: 'Solar Beat', country: 'Colombia', genre: 'Pop', active: true },
    { id: 2, stageName: 'Neon Waves', country: 'México', genre: 'Electrónica', active: true },
    { id: 3, stageName: 'Caribbean Sound', country: 'Puerto Rico', genre: 'Reggae', active: true },
  ]
  const [solar, neon] = artistas as [ArtistResponse, ArtistResponse, ArtistResponse]
  const eventos: EventResponse[] = [
    {
      id: 1,
      eventCode: 'CMF-2026',
      name: 'Caribbean Music Fest 2026',
      description: 'Tres noches de música caribeña frente a la bahía de Santa Marta.',
      category: 'MUSIC',
      status: 'PUBLISHED',
      eventDate: '2026-12-12T20:00:00',
      minimumAge: 18,
      venueCode: 'VEN-SMR-01',
      venueName: 'Marina Convention Center',
      artists: [solar, neon],
    },
    {
      id: 2,
      eventCode: 'CTC-2027',
      name: 'Cumbre Tech Caribe 2027',
      description: null,
      category: 'TECHNOLOGY',
      status: 'SOLD_OUT',
      eventDate: '2027-01-20T09:00:00',
      minimumAge: 0,
      venueCode: 'VEN-BAQ-01',
      venueName: 'Centro de Convenciones Caribe',
      artists: [],
    },
    {
      id: 3,
      eventCode: 'BOR-2026',
      name: 'Borrador Secreto',
      description: 'No publicado',
      category: 'CULTURE',
      status: 'DRAFT',
      eventDate: '2026-12-20T19:00:00',
      minimumAge: 0,
      venueCode: 'VEN-SMR-01',
      venueName: 'Marina Convention Center',
      artists: [],
    },
  ]
  const usuarios: UsuarioDemo[] = [
    {
      id: 1,
      username: 'andrea',
      email: 'andrea@pulsepass.test',
      active: true,
      firstName: 'Andrea',
      lastName: 'Ruiz',
      phone: null,
      city: 'Santa Marta',
      birthDate: '1998-04-12',
      roles: ['USER'],
    },
    {
      id: 2,
      username: 'carlos',
      email: 'carlos@pulsepass.test',
      active: true,
      firstName: 'Carlos',
      lastName: 'Peña',
      phone: null,
      city: null,
      birthDate: '1990-01-30',
      roles: ['USER'],
    },
    {
      id: 3,
      username: 'laura',
      email: 'laura@pulsepass.test',
      active: true,
      firstName: 'Laura',
      lastName: 'Gómez',
      phone: null,
      city: null,
      birthDate: '2009-06-01',
      roles: ['STAFF'],
    },
    {
      id: 4,
      username: 'admin',
      email: 'admin@pulsepass.test',
      active: true,
      firstName: 'Administración',
      lastName: 'PulsePass',
      phone: null,
      city: null,
      birthDate: '1985-03-03',
      roles: ['ADMIN'],
    },
  ]
  const tickets: TicketResponse[] = [
    {
      id: 1,
      ticketCode: 'TKT-8F2A1C',
      type: 'VIP',
      price: 250000,
      status: 'PAID',
      purchaseDate: '2026-11-05T14:32:00',
      userEmail: 'andrea@pulsepass.test',
      eventCode: 'CMF-2026',
      eventName: 'Caribbean Music Fest 2026',
    },
    {
      id: 2,
      ticketCode: 'TKT-91B07D',
      type: 'GENERAL',
      price: 120000,
      status: 'PAID',
      purchaseDate: '2026-11-06T10:00:00',
      userEmail: 'carlos@pulsepass.test',
      eventCode: 'CMF-2026',
      eventName: 'Caribbean Music Fest 2026',
    },
    {
      id: 3,
      ticketCode: 'TKT-5C90E2',
      type: 'GENERAL',
      price: 90000,
      status: 'USED',
      purchaseDate: '2026-10-12T18:00:00',
      userEmail: 'andrea@pulsepass.test',
      eventCode: 'NJC-2026',
      eventName: 'Noche de Jazz y Cultura',
    },
    {
      id: 4,
      ticketCode: 'TKT-77A013',
      type: 'STUDENT',
      price: 60000,
      status: 'CANCELLED',
      purchaseDate: '2026-10-01T09:00:00',
      userEmail: 'andrea@pulsepass.test',
      eventCode: 'SUC-2026',
      eventName: 'Stand-up Costeño',
    },
  ]
  return { sedes, artistas, eventos, usuarios, tickets }
}

export type BaseDatos = ReturnType<typeof crearDatos>

/** Precios simulados que fija el "backend" (la UI nunca los calcula ni los envía). */
export const PRECIOS: Record<string, number> = {
  GENERAL: 120000,
  VIP: 250000,
  BACKSTAGE: 400000,
  STUDENT: 60000,
}
