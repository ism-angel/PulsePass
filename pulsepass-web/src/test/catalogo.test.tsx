import { screen, waitFor, within } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { db, error } from './mocks/handlers.ts'
import { servidor } from './mocks/servidor.ts'
import { peticionesApi, renderConProveedores } from './utils.tsx'

describe('Catálogo de eventos (§21.3)', () => {
  it('TEST-FE-EVT-001: cartelera lista eventos publicados sin pedir login (AC-FE-001)', async () => {
    renderConProveedores('/eventos')
    const lista = await screen.findByRole('list', { name: 'Eventos de la cartelera' })
    expect(within(lista).getByText('Caribbean Music Fest 2026')).toBeInTheDocument()
    expect(screen.queryByText('Borrador Secreto')).not.toBeInTheDocument()
    expect(screen.getByText('1 evento')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Caribbean Music Fest 2026/ })).toHaveAttribute(
      'href',
      '/eventos/CMF-2026',
    )
  })

  it('cartelera: estado cargando (aria-busy) y error con reintento', async () => {
    servidor.use(
      mswHttp.get('/api/events/published', () => error(500, 'Unexpected internal error')),
    )
    const { user } = renderConProveedores('/eventos')
    expect(await screen.findByText('Cargando eventos…')).toBeInTheDocument()
    expect(
      await screen.findByText('Ocurrió un error inesperado. Inténtalo más tarde.'),
    ).toBeInTheDocument()
    servidor.resetHandlers()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Caribbean Music Fest 2026')).toBeInTheDocument()
  })

  it('TEST-FE-EVT-002: lista vacía → estado vacío', async () => {
    servidor.use(mswHttp.get('/api/events/published', () => HttpResponse.json([])))
    renderConProveedores('/eventos')
    expect(await screen.findByText('Sin resultados para tu búsqueda')).toBeInTheDocument()
  })

  it('TEST-FE-EVT-003: filtro por texto/categoría actualiza la URL (y sobrevive a recargar)', async () => {
    const tech = db.eventos.find((e) => e.eventCode === 'CTC-2027')
    if (tech) tech.status = 'PUBLISHED'
    const { user, router } = renderConProveedores('/eventos')
    await screen.findByText('Caribbean Music Fest 2026')
    await user.type(screen.getByLabelText('Buscar por nombre'), 'cumbre')
    await waitFor(() => {
      expect(router.state.location.search).toContain('q=cumbre')
    })
    expect(screen.queryByText('Caribbean Music Fest 2026')).not.toBeInTheDocument()
    expect(screen.getByText('Cumbre Tech Caribe 2027')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Buscar por nombre'))
    await user.selectOptions(screen.getByLabelText('Categoría'), 'MUSIC')
    await waitFor(() => {
      expect(router.state.location.search).toBe('?categoria=MUSIC')
    })
    expect(screen.getByText('1 evento')).toBeInTheDocument()
  })

  it('filtros leídos desde la URL al cargar (?q=&categoria=)', async () => {
    renderConProveedores('/eventos?q=caribbean&categoria=MUSIC')
    expect(await screen.findByText('1 evento')).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar por nombre')).toHaveValue('caribbean')
  })

  it('FR-FE-EVT-004: ?artista= usa by-artist y resuelve el artista con by-stage-name', async () => {
    renderConProveedores('/eventos?artista=Solar%20Beat')
    expect(await screen.findByText('Caribbean Music Fest 2026')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Solar Beat' })).toHaveAttribute(
      'href',
      '/artistas/1',
    )
    expect(peticionesApi()).toEqual(
      expect.arrayContaining(['GET /api/events/by-artist', 'GET /api/artists/by-stage-name']),
    )
  })

  it('TEST-FE-EVT-004: detalle muestra evento, artistas y sede (AC-FE-002)', async () => {
    renderConProveedores('/eventos/CMF-2026')
    expect(
      await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByText('MUSIC')).toBeInTheDocument()
    expect(screen.getByText('Edad mínima: 18')).toBeInTheDocument()
    const artistas = screen.getByRole('list', { name: 'Artistas del evento' })
    expect(within(artistas).getByText('Solar Beat')).toBeInTheDocument()
    expect(within(artistas).getByText('Neon Waves')).toBeInTheDocument()
    expect(screen.getByText('Marina Convention Center')).toBeInTheDocument()
    expect(await screen.findByText('Santa Marta · Capacidad 3')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Marina Convention Center/ })).toHaveAttribute(
      'href',
      '/sedes/VEN-SMR-01',
    )
  })

  it('TEST-FE-EVT-005: 404 → "Evento no disponible" (también para borradores vistos por anónimos, AC-FE-003)', async () => {
    renderConProveedores('/eventos/BOR-2026')
    expect(await screen.findByRole('heading', { name: 'Evento no disponible' })).toBeInTheDocument()
    expect(screen.queryByText('Borrador Secreto')).not.toBeInTheDocument()
  })

  it('TEST-FE-EVT-006: evento SOLD_OUT → compra deshabilitada con motivo', async () => {
    // El backend real solo expone PUBLISHED al público; se simula un evento que pasó a SOLD_OUT.
    const tech = db.eventos.find((e) => e.eventCode === 'CTC-2027')
    servidor.use(mswHttp.get('/api/events/CTC-2027', () => HttpResponse.json(tech)))
    renderConProveedores('/eventos/CTC-2027', { como: 'andrea' })
    await screen.findByRole('heading', { name: 'Cumbre Tech Caribe 2027' })
    for (const boton of screen.getAllByRole('button', { name: 'Comprar entrada' })) {
      expect(boton).toBeDisabled()
    }
    expect(
      screen.getByText(/La compra no está disponible: el evento está en estado SOLD_OUT/),
    ).toBeInTheDocument()
  })

  it('STAFF/ADMIN: el panel de compra se oculta', async () => {
    renderConProveedores('/eventos/CMF-2026', { como: 'laura' })
    await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' })
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Entradas' })).not.toBeInTheDocument()
    })
  })
})

describe('Artistas y sedes (§21.3)', () => {
  it('TEST-FE-ART-001: lista de artistas activos', async () => {
    renderConProveedores('/artistas')
    const lista = await screen.findByRole('list', { name: 'Artistas activos' })
    expect(within(lista).getAllByRole('link')).toHaveLength(3)
    expect(within(lista).getByText('Caribbean Sound')).toBeInTheDocument()
  })

  it('TEST-FE-ART-002: detalle de artista con eventos', async () => {
    renderConProveedores('/artistas/1')
    expect(await screen.findByRole('heading', { name: 'Solar Beat' })).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Próximos eventos de Solar Beat' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Caribbean Music Fest 2026')).toBeInTheDocument()
  })

  it('detalle de artista sin eventos → "Sin eventos próximos"', async () => {
    renderConProveedores('/artistas/3')
    expect(await screen.findByText('Sin eventos próximos')).toBeInTheDocument()
  })

  it('TEST-FE-ART-003: id no numérico → 404 sin llamar a la API', async () => {
    renderConProveedores('/artistas/abc')
    expect(await screen.findByText('No encontramos esta página')).toBeInTheDocument()
    expect(peticionesApi().filter((p) => p.startsWith('GET /api/artists'))).toEqual([])
  })

  it('artista inexistente (API 404) → NoEncontrada', async () => {
    renderConProveedores('/artistas/999')
    expect(await screen.findByText('No encontramos esta página')).toBeInTheDocument()
  })

  it('TEST-FE-VEN-001: lista y detalle de sede; 404 de sede', async () => {
    const { user, router } = renderConProveedores('/sedes')
    const lista = await screen.findByRole('list', { name: 'Sedes activas' })
    expect(within(lista).getByText('Centro de Convenciones Caribe')).toBeInTheDocument()
    await user.click(within(lista).getByRole('link', { name: /Marina Convention Center/ }))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/sedes/VEN-SMR-01')
    })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Marina Convention Center' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('VEN-SMR-01')).toBeInTheDocument()
    expect(await screen.findByText('3 personas')).toBeInTheDocument()

    await router.navigate('/sedes/NO-EXISTE')
    expect(await screen.findByText('No encontramos esta página')).toBeInTheDocument()
  })

  it('Inicio: hero, próximos eventos (máx. 3) y artistas; "Crear cuenta" oculto con sesión', async () => {
    renderConProveedores('/', { como: 'andrea' })
    expect(
      await screen.findByRole('heading', { name: 'Descubre los mejores eventos' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('list', { name: 'Próximos eventos' })).toBeInTheDocument()
    expect(await screen.findByRole('list', { name: 'Artistas destacados' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Crear cuenta' })).not.toBeInTheDocument()
  })

  it('Inicio sin eventos → "Aún no hay eventos publicados"', async () => {
    servidor.use(mswHttp.get('/api/events/published', () => HttpResponse.json([])))
    renderConProveedores('/')
    expect(await screen.findByText('Aún no hay eventos publicados')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument()
  })
})
