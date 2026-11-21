import { screen } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import type { UsuarioPrueba } from './utils.tsx'
import { error } from './mocks/handlers.ts'
import { servidor } from './mocks/servidor.ts'
import { renderConProveedores } from './utils.tsx'

/** QT-FE-001 / FE-014: cada pantalla de datos define cargando, vacío, error y éxito. */
interface Caso {
  pagina: string
  ruta: string
  endpoint: string
  como?: UsuarioPrueba
  cargando: string
  vacio?: string
}

const CASOS: Caso[] = [
  {
    pagina: 'Inicio',
    ruta: '/',
    endpoint: '/api/events/published',
    cargando: 'Cargando eventos…',
    vacio: 'Aún no hay eventos publicados',
  },
  {
    pagina: 'ListaArtistas',
    ruta: '/artistas',
    endpoint: '/api/artists/active',
    cargando: 'Cargando artistas…',
    vacio: 'Aún no hay artistas activos',
  },
  {
    pagina: 'ListaSedes',
    ruta: '/sedes',
    endpoint: '/api/venues/active',
    cargando: 'Cargando sedes…',
    vacio: 'Aún no hay sedes activas',
  },
  {
    pagina: 'MisTickets',
    ruta: '/mis-tickets',
    endpoint: '/api/tickets/by-user',
    como: 'andrea',
    cargando: 'Cargando tickets…',
    vacio: 'Aún no tienes tickets',
  },
  {
    pagina: 'TicketsPagadosEvento',
    ruta: '/staff/eventos/CMF-2026/tickets',
    endpoint: '/api/events/:code/tickets/paid',
    como: 'laura',
    cargando: 'Cargando tickets pagados…',
    vacio: 'No hay tickets pagados',
  },
  {
    pagina: 'Cuenta',
    ruta: '/cuenta',
    endpoint: '/api/users/by-email',
    como: 'andrea',
    cargando: 'Cargando perfil…',
  },
  {
    pagina: 'AdminCrearEvento',
    ruta: '/admin/eventos/nuevo',
    endpoint: '/api/venues/active',
    como: 'admin',
    cargando: 'Cargando sedes…',
  },
  {
    pagina: 'DetalleSede',
    ruta: '/sedes/VEN-SMR-01',
    endpoint: '/api/venues/:code',
    cargando: 'Cargando sede…',
  },
  {
    pagina: 'DetalleArtista',
    ruta: '/artistas/1',
    endpoint: '/api/artists/:id',
    cargando: 'Cargando artista…',
  },
  {
    pagina: 'DetalleEvento',
    ruta: '/eventos/CMF-2026',
    endpoint: '/api/events/:code',
    cargando: 'Cargando evento…',
  },
  {
    pagina: 'DetalleTicket',
    ruta: '/mis-tickets/TKT-8F2A1C',
    endpoint: '/api/tickets/:code',
    como: 'andrea',
    cargando: 'Cargando ticket…',
  },
  {
    pagina: 'ConfirmacionCompra',
    ruta: '/compra/confirmacion/TKT-8F2A1C',
    endpoint: '/api/tickets/:code',
    como: 'andrea',
    cargando: 'Cargando compra…',
  },
  {
    pagina: 'AdminGestionEvento',
    ruta: '/admin/eventos/CMF-2026',
    endpoint: '/api/events/:code',
    como: 'admin',
    cargando: 'Cargando evento…',
  },
]

describe('Estados de cada página (QT-FE-001)', () => {
  it.each(CASOS)(
    '$pagina: cargando (aria-busy) y error 500 con "Reintentar"',
    async ({ ruta, endpoint, como, cargando }) => {
      servidor.use(mswHttp.get(endpoint, () => error(500, 'Unexpected internal error')))
      renderConProveedores(ruta, { como })
      const estado = await screen.findByText(cargando)
      expect(estado.closest('[aria-busy="true"]')).not.toBeNull()
      expect(
        await screen.findByText('Ocurrió un error inesperado. Inténtalo más tarde.'),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    },
  )

  it.each(CASOS.filter((c) => c.vacio))(
    '$pagina: estado vacío',
    async ({ ruta, endpoint, como, vacio }) => {
      servidor.use(mswHttp.get(endpoint, () => HttpResponse.json([])))
      renderConProveedores(ruta, { como })
      expect(await screen.findByText(vacio ?? '')).toBeInTheDocument()
    },
  )

  it('error de red → "No pudimos conectar con el servidor." con reintento', async () => {
    servidor.use(mswHttp.get('/api/venues/active', () => HttpResponse.error()))
    renderConProveedores('/sedes')
    expect(
      await screen.findByText('No pudimos conectar con el servidor.', {}, { timeout: 4000 }),
    ).toBeInTheDocument()
  })

  it('páginas estáticas: 403 y 404', async () => {
    const { router } = renderConProveedores('/403')
    expect(await screen.findByText('403')).toBeInTheDocument()
    await router.navigate('/no-existe')
    expect(await screen.findByText('404')).toBeInTheDocument()
  })
})
