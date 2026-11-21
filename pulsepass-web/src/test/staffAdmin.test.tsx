import { screen, waitFor, within } from '@testing-library/react'
import { http as mswHttp } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { error } from './mocks/handlers.ts'
import { servidor } from './mocks/servidor.ts'
import { peticionesApi, renderConProveedores } from './utils.tsx'

describe('STAFF — validación de ingreso (§21.5)', () => {
  it('TEST-FE-STF-001: buscar (Enter) y marcar como usado → éxito y badge USED (AC-FE-016)', async () => {
    const { user } = renderConProveedores('/staff/validacion', { como: 'laura' })
    const campo = await screen.findByLabelText('Código de ticket')
    expect(campo).toHaveFocus()
    await user.type(campo, 'TKT-8F2A1C{Enter}')
    expect(
      await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByText('PAID')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Marcar como usado' }))
    expect(await screen.findByText('Ingreso registrado.')).toBeInTheDocument()
    expect(await screen.findByText('USED')).toBeInTheDocument()
    expect(screen.getByLabelText('Código de ticket')).toHaveValue('')
  })

  it('TEST-FE-STF-002: segunda vez → 409 visible', async () => {
    const { user } = renderConProveedores('/staff/validacion', { como: 'laura' })
    const campo = await screen.findByLabelText('Código de ticket')
    await user.type(campo, 'TKT-8F2A1C{Enter}')
    await user.click(await screen.findByRole('button', { name: 'Marcar como usado' }))
    await screen.findByText('Ingreso registrado.')

    await user.type(screen.getByLabelText('Código de ticket'), 'TKT-8F2A1C{Enter}')
    await user.click(await screen.findByRole('button', { name: 'Marcar como usado' }))
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('El ticket ya fue utilizado o no está pagado. (409)')
  })

  it('TEST-FE-STF-003: ticket inexistente → 404 visible', async () => {
    const { user } = renderConProveedores('/staff/validacion', { como: 'laura' })
    await user.type(await screen.findByLabelText('Código de ticket'), 'TKT-000000{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('Ticket no encontrado.')
  })

  it('validación: código vacío → error y 0 peticiones de tickets', async () => {
    const { user } = renderConProveedores('/staff/validacion', { como: 'laura' })
    await user.click(await screen.findByRole('button', { name: 'Buscar' }))
    expect(await screen.findByText('Ingresa el código del ticket')).toBeInTheDocument()
    expect(peticionesApi().filter((p) => p.includes('/api/tickets'))).toEqual([])
  })

  it('TEST-FE-STF-004: tickets pagados de evento → tabla con filas; "Usar" invalida la lista', async () => {
    const { user, queryClient } = renderConProveedores('/staff/eventos/CMF-2026/tickets', {
      como: 'laura',
    })
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    const tabla = await screen.findByRole('table', { name: 'Tickets pagados de CMF-2026' })
    const filas = within(tabla).getAllByRole('row')
    expect(filas).toHaveLength(3)
    expect(within(tabla).getByText('TKT-91B07D')).toBeInTheDocument()
    expect(within(tabla).getByText('$ 120.000')).toBeInTheDocument()
    expect(screen.getByText('Total: 2')).toBeInTheDocument()

    await user.click(within(tabla).getByRole('button', { name: 'Usar ticket TKT-8F2A1C' }))
    expect(await screen.findByText('Ingreso registrado: TKT-8F2A1C.')).toBeInTheDocument()
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['tickets', 'pagados', 'CMF-2026'] })
    await waitFor(() => {
      expect(screen.getByText('Total: 1')).toBeInTheDocument()
    })
  })

  it('tickets pagados: acceso directo sin evento y navegación con "Ir"; 404 de evento', async () => {
    const { user, router } = renderConProveedores('/staff/eventos/seleccionar/tickets', {
      como: 'admin',
    })
    expect(
      await screen.findByText('Ingresa el código de un evento para ver sus tickets pagados'),
    ).toBeInTheDocument()
    expect(peticionesApi().filter((p) => p.includes('/tickets/paid'))).toEqual([])
    await user.type(screen.getByLabelText('Evento'), 'NO-EXISTE{Enter}')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/staff/eventos/NO-EXISTE/tickets')
    })
    expect(await screen.findByText('Evento no encontrado')).toBeInTheDocument()
  })
})

async function llenarEvento(user: ReturnType<typeof renderConProveedores>['user'], codigo: string) {
  await user.type(await screen.findByLabelText('Código del evento'), codigo)
  await user.type(screen.getByLabelText('Nombre'), 'Festival Nuevo 2027')
  await user.type(screen.getByLabelText('Descripción'), 'Un festival de prueba.')
  await user.selectOptions(screen.getByLabelText('Categoría'), 'CULTURE')
  await user.clear(screen.getByLabelText('Edad mínima'))
  await user.type(screen.getByLabelText('Edad mínima'), '16')
  await user.type(screen.getByLabelText('Fecha y hora'), '2027-03-15T19:30')
  await user.selectOptions(await screen.findByLabelText('Sede'), 'VEN-SMR-01')
  await user.click(screen.getByRole('button', { name: 'Crear evento' }))
}

describe('ADMIN — eventos (§21.5)', () => {
  it('TEST-FE-ADM-001: crear evento con campos vacíos → errores por campo y 0 peticiones (AC-FE-017)', async () => {
    const { user } = renderConProveedores('/admin/eventos/nuevo', { como: 'admin' })
    await user.click(await screen.findByRole('button', { name: 'Crear evento' }))
    expect(await screen.findByText('Ingresa el código del evento')).toBeInTheDocument()
    expect(screen.getByText('Ingresa el nombre del evento')).toBeInTheDocument()
    expect(screen.getByText('Ingresa la fecha y hora')).toBeInTheDocument()
    expect(screen.getByText('Selecciona una sede')).toBeInTheDocument()
    expect(peticionesApi()).not.toContain('POST /api/events')
  })

  it('TEST-FE-ADM-002: crear evento 201 → navega a gestión y queda en "Creados en esta sesión"', async () => {
    let cuerpo: unknown = null
    servidor.events.on('request:start', ({ request }) => {
      if (request.method === 'POST' && request.url.endsWith('/api/events')) {
        void request
          .clone()
          .json()
          .then((j: unknown) => {
            cuerpo = j
          })
      }
    })
    const { user, router } = renderConProveedores('/admin/eventos/nuevo', { como: 'admin' })
    await llenarEvento(user, 'FN-2027')
    expect(await screen.findByRole('heading', { name: 'Festival Nuevo 2027' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin/eventos/FN-2027')
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
    expect(cuerpo).toEqual({
      eventCode: 'FN-2027',
      name: 'Festival Nuevo 2027',
      description: 'Un festival de prueba.',
      category: 'CULTURE',
      eventDate: '2027-03-15T19:30:00',
      minimumAge: 16,
      venueCode: 'VEN-SMR-01',
    })
    servidor.events.removeAllListeners('request:start')

    await router.navigate('/admin/eventos')
    const lista = await screen.findByRole('list', { name: 'Eventos creados en esta sesión' })
    expect(within(lista).getByText('FN-2027')).toBeInTheDocument()
  })

  it('TEST-FE-ADM-003: crear evento 400 con details → errores en los campos', async () => {
    servidor.use(
      mswHttp.post('/api/events', () =>
        error(400, 'Validation failed', {
          name: 'Event name is required',
          venueCode: 'Venue code is required',
        }),
      ),
    )
    const { user } = renderConProveedores('/admin/eventos/nuevo', { como: 'admin' })
    await llenarEvento(user, 'FN-2027')
    expect(await screen.findByText('Event name is required')).toBeInTheDocument()
    expect(screen.getByText('Venue code is required')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true')
  })

  it('crear evento 409 (código duplicado) → aviso arriba del formulario', async () => {
    const { user } = renderConProveedores('/admin/eventos/nuevo', { como: 'admin' })
    await llenarEvento(user, 'CMF-2026')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe un evento con ese código.',
    )
  })

  it('TEST-FE-ADM-004: publicar evento → badge PUBLISHED y aparece en la cartelera (AC-FE-018)', async () => {
    const { user, router, queryClient } = renderConProveedores('/admin/eventos/BOR-2026', {
      como: 'admin',
    })
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    expect(await screen.findByRole('heading', { name: 'Borrador Secreto' })).toBeInTheDocument()
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Publicar evento' }))
    const modal = await screen.findByRole('dialog', { name: 'Publicar evento' })
    await user.click(within(modal).getByRole('button', { name: 'Publicar' }))

    expect(await screen.findByText('PUBLISHED')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publicar evento' })).toBeDisabled()
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['evento', 'BOR-2026'] })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['eventos', 'publicados'] })

    await router.navigate('/eventos')
    expect(await screen.findByText('Borrador Secreto')).toBeInTheDocument()
  })

  it('TEST-FE-ADM-005: publicar → 409 visible', async () => {
    servidor.use(
      mswHttp.patch('/api/events/:code/publish', () =>
        error(409, 'Event date must be in the future.'),
      ),
    )
    const { user } = renderConProveedores('/admin/eventos/BOR-2026', { como: 'admin' })
    await user.click(await screen.findByRole('button', { name: 'Publicar evento' }))
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Publicar' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La fecha del evento debe ser futura.',
    )
  })

  it('TEST-FE-ADM-006: asociar artista → aparece en la lista; duplicado → 409', async () => {
    const { user, queryClient } = renderConProveedores('/admin/eventos/CMF-2026', { como: 'admin' })
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' })
    const selector = await screen.findByLabelText('Agregar artista')
    await waitFor(() => {
      expect(within(selector).getByRole('option', { name: 'Caribbean Sound' })).toBeEnabled()
    })
    // Los ya asociados se bloquean en la UI (solo UX).
    expect(
      within(selector).getByRole('option', { name: 'Solar Beat (ya asociado)' }),
    ).toBeDisabled()
    await user.selectOptions(selector, 'Caribbean Sound')
    await user.click(screen.getByRole('button', { name: 'Asociar' }))
    const lista = await screen.findByRole('list', { name: 'Artistas del evento' })
    expect(await within(lista).findByText('Caribbean Sound')).toBeInTheDocument()
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['eventos', 'artista', 'Caribbean Sound'] })
  })

  it('TEST-FE-ADM-006 (duplicado): asociar artista ya asociado → 409 en aviso (el backend es la autoridad)', async () => {
    servidor.use(
      mswHttp.post('/api/events/:code/artists/:id', () =>
        error(409, 'Artist Caribbean Sound is already associated with event CMF-2026'),
      ),
    )
    const { user } = renderConProveedores('/admin/eventos/CMF-2026', { como: 'admin' })
    const selector = await screen.findByLabelText('Agregar artista')
    await waitFor(() => {
      expect(within(selector).getByRole('option', { name: 'Caribbean Sound' })).toBeEnabled()
    })
    await user.selectOptions(selector, 'Caribbean Sound')
    await user.click(screen.getByRole('button', { name: 'Asociar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El artista ya está asociado a este evento.',
    )
  })

  it('administración: buscar evento por código (ADMIN ve borradores)', async () => {
    const { user } = renderConProveedores('/admin/eventos', { como: 'admin' })
    await user.type(await screen.findByLabelText('Buscar evento por código'), 'BOR-2026{Enter}')
    expect(await screen.findByText(/Borrador Secreto/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Gestionar' })).toHaveAttribute(
      'href',
      '/admin/eventos/BOR-2026',
    )
    expect(screen.getByText(/GAP-01/)).toBeInTheDocument()
  })

  it('gestión: un 403 del servidor en la carga de página → /403 (el servidor prevalece)', async () => {
    servidor.use(
      mswHttp.get('/api/events/:code', () =>
        error(403, 'No tiene permisos para realizar esta operación'),
      ),
    )
    const { router } = renderConProveedores('/admin/eventos/CMF-2026', { como: 'admin' })
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/403')
    })
  })
})
