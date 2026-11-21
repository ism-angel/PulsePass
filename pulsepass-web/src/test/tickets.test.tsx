import { screen, waitFor, within } from '@testing-library/react'
import { http as mswHttp, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { CLAVE_VALIDA } from './mocks/datos.ts'
import { error } from './mocks/handlers.ts'
import { servidor } from './mocks/servidor.ts'
import { peticionesApi, renderConProveedores } from './utils.tsx'

async function abrirModalCompra(
  user: ReturnType<typeof renderConProveedores>['user'],
  tipo = 'VIP',
) {
  await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' })
  await user.click(await screen.findByRole('radio', { name: tipo }))
  const [boton] = screen.getAllByRole('button', { name: 'Comprar entrada' })
  if (!boton) throw new Error('sin botón de compra')
  await user.click(boton)
  return screen.findByRole('dialog', { name: 'Confirmar compra' })
}

describe('Compra (§21.4)', () => {
  it('TEST-FE-TKT-001: compra válida → 201 y navega a la confirmación (AC-FE-010)', async () => {
    const { user, router } = renderConProveedores('/eventos/CMF-2026', { como: 'andrea' })
    const modal = await abrirModalCompra(user)
    expect(within(modal).getByText('VIP')).toBeInTheDocument()
    await user.click(within(modal).getByRole('button', { name: 'Confirmar' }))

    expect(
      await screen.findByRole('heading', { name: '¡Compra realizada con éxito!' }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/compra/confirmacion/TKT-NEW005')
    expect(screen.getByText('$ 250.000')).toBeInTheDocument()
    expect(screen.getByText('PAID')).toBeInTheDocument()
  })

  it('TEST-FE-TKT-002: compra anónima → redirige a login y regresa al evento (AC-FE-004)', async () => {
    const { user, router } = renderConProveedores('/eventos/CMF-2026')
    await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' })
    const [enlace] = screen.getAllByRole('link', { name: 'Inicia sesión para comprar' })
    if (!enlace) throw new Error('sin enlace')
    await user.click(enlace)
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(router.state.location.state).toMatchObject({ desde: '/eventos/CMF-2026' })

    await user.type(screen.getByLabelText('Usuario o correo'), 'andrea')
    await user.type(screen.getByLabelText('Contraseña'), CLAVE_VALIDA)
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/eventos/CMF-2026')
    })
    expect(
      (await screen.findAllByRole('button', { name: 'Comprar entrada' })).length,
    ).toBeGreaterThan(0)
  })

  it('TEST-FE-TKT-003: compra 409 → mensaje del backend en el modal y no navega (AC-FE-011)', async () => {
    servidor.use(mswHttp.post('/api/tickets', () => error(409, 'User does not meet minimum age.')))
    const { user, router } = renderConProveedores('/eventos/CMF-2026', { como: 'andrea' })
    const modal = await abrirModalCompra(user)
    await user.click(within(modal).getByRole('button', { name: 'Confirmar' }))
    expect(await within(modal).findByRole('alert')).toHaveTextContent(
      'El usuario no cumple la edad mínima del evento.',
    )
    expect(screen.getByRole('dialog', { name: 'Confirmar compra' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/eventos/CMF-2026')
  })

  it('TEST-FE-TKT-004: la compra envía el email de la sesión (sin campo editable, §24.3)', async () => {
    let cuerpo: unknown = null
    servidor.use(
      mswHttp.post('/api/tickets', async ({ request }) => {
        cuerpo = await request.json()
        return error(409, 'Event has no remaining capacity: CMF-2026')
      }),
    )
    const { user } = renderConProveedores('/eventos/CMF-2026', { como: 'andrea' })
    expect(screen.queryByRole('textbox', { name: /correo|email/i })).not.toBeInTheDocument()
    const modal = await abrirModalCompra(user, 'BACKSTAGE')
    expect(within(modal).getByText('andrea@pulsepass.test')).toBeInTheDocument()
    await user.click(within(modal).getByRole('button', { name: 'Confirmar' }))
    await within(modal).findByRole('alert')
    // Solo userEmail, eventCode y type: el precio lo fija el backend (GAP-06).
    expect(cuerpo).toEqual({
      userEmail: 'andrea@pulsepass.test',
      eventCode: 'CMF-2026',
      type: 'BACKSTAGE',
    })
  })

  it('compra: invalida ["tickets","usuario",email] y ["evento",code] (§14.2, QT-FE-008)', async () => {
    const { user, queryClient } = renderConProveedores('/eventos/CMF-2026', { como: 'andrea' })
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    const modal = await abrirModalCompra(user)
    await user.click(within(modal).getByRole('button', { name: 'Confirmar' }))
    await screen.findByRole('heading', { name: '¡Compra realizada con éxito!' })
    expect(invalidar).toHaveBeenCalledWith({
      queryKey: ['tickets', 'usuario', 'andrea@pulsepass.test'],
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['evento', 'CMF-2026'] })
  })
})

describe('Mis tickets (§21.4)', () => {
  it('TEST-FE-TKT-005: lista y filtra por estado', async () => {
    const { user } = renderConProveedores('/mis-tickets', { como: 'andrea' })
    const lista = await screen.findByRole('list', { name: 'Mis tickets' })
    expect(within(lista).getAllByRole('article')).toHaveLength(3)
    expect(within(lista).getByText(/TKT-8F2A1C/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Usados' }))
    expect(screen.getByRole('button', { name: 'Usados' })).toHaveAttribute('aria-pressed', 'true')
    const filtrada = screen.getByRole('list', { name: 'Mis tickets' })
    expect(within(filtrada).getAllByRole('article')).toHaveLength(1)
    expect(within(filtrada).getByText('Noche de Jazz y Cultura')).toBeInTheDocument()
  })

  it('TEST-FE-TKT-006: vacío → "Aún no tienes tickets" con enlace a la cartelera', async () => {
    servidor.use(mswHttp.get('/api/tickets/by-user', () => HttpResponse.json([])))
    renderConProveedores('/mis-tickets', { como: 'andrea' })
    expect(await screen.findByText('Aún no tienes tickets')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a la cartelera' })).toHaveAttribute(
      'href',
      '/eventos',
    )
  })

  it('TEST-FE-TKT-007: cancelar PAID → 200 y lista actualizada (AC-FE-012)', async () => {
    const { user, queryClient } = renderConProveedores('/mis-tickets', { como: 'andrea' })
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    const tarjeta = await screen.findByRole('article', { name: 'Ticket TKT-8F2A1C' })
    expect(within(tarjeta).getByText('PAID')).toBeInTheDocument()
    await user.click(within(tarjeta).getByRole('button', { name: 'Cancelar' }))
    const modal = await screen.findByRole('dialog', { name: 'Cancelar ticket' })
    await user.click(within(modal).getByRole('button', { name: 'Cancelar ticket' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    const actualizada = await screen.findByRole('article', { name: 'Ticket TKT-8F2A1C' })
    expect(await within(actualizada).findByText('CANCELLED')).toBeInTheDocument()
    expect(within(actualizada).queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(invalidar).toHaveBeenCalledWith({
      queryKey: ['tickets', 'usuario', 'andrea@pulsepass.test'],
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['ticket', 'TKT-8F2A1C'] })
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ['tickets', 'pagados', 'CMF-2026'] })
    expect(await screen.findByText('Ticket cancelado.')).toBeInTheDocument()
  })

  it('TEST-FE-TKT-008: cancelar → 409 muestra el mensaje y mantiene el modal (AC-FE-013)', async () => {
    servidor.use(
      mswHttp.patch('/api/tickets/:code/cancel', () =>
        error(409, 'Ticket cannot be cancelled. Current status: USED'),
      ),
    )
    const { user } = renderConProveedores('/mis-tickets', { como: 'andrea' })
    const tarjeta = await screen.findByRole('article', { name: 'Ticket TKT-8F2A1C' })
    await user.click(within(tarjeta).getByRole('button', { name: 'Cancelar' }))
    const modal = await screen.findByRole('dialog', { name: 'Cancelar ticket' })
    await user.click(within(modal).getByRole('button', { name: 'Cancelar ticket' }))
    expect(await within(modal).findByRole('alert')).toHaveTextContent(
      'El ticket no puede cancelarse en su estado actual.',
    )
    expect(screen.getByRole('dialog', { name: 'Cancelar ticket' })).toBeInTheDocument()
  })

  it('TEST-FE-TKT-010: botón cancelar oculto si status ≠ PAID', async () => {
    renderConProveedores('/mis-tickets', { como: 'andrea' })
    const usado = await screen.findByRole('article', { name: 'Ticket TKT-5C90E2' })
    const cancelado = screen.getByRole('article', { name: 'Ticket TKT-77A013' })
    expect(within(usado).queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(within(cancelado).queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(within(usado).getByRole('link', { name: 'Ver detalle' })).toBeInTheDocument()
  })

  it('modal de cancelación: Esc lo cierra y atrapa el foco', async () => {
    const { user } = renderConProveedores('/mis-tickets', { como: 'andrea' })
    const tarjeta = await screen.findByRole('article', { name: 'Ticket TKT-8F2A1C' })
    await user.click(within(tarjeta).getByRole('button', { name: 'Cancelar' }))
    const modal = await screen.findByRole('dialog', { name: 'Cancelar ticket' })
    expect(modal).toContainElement(document.activeElement as HTMLElement)
    await user.tab()
    await user.tab()
    await user.tab()
    expect(modal).toContainElement(document.activeElement as HTMLElement)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Detalle y confirmación de ticket (§21.4)', () => {
  it('detalle propio: código, tipo, precio, fecha y titular', async () => {
    renderConProveedores('/mis-tickets/TKT-8F2A1C', { como: 'andrea' })
    expect(
      await screen.findByRole('heading', { name: 'Caribbean Music Fest 2026' }),
    ).toBeInTheDocument()
    expect(screen.getByText('TKT-8F2A1C')).toBeInTheDocument()
    expect(screen.getByText('$ 250.000')).toBeInTheDocument()
    expect(screen.getByText('05 nov 2026 14:32')).toBeInTheDocument()
    expect(await screen.findByText('Andrea Ruiz')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar ticket' })).toBeInTheDocument()
  })

  it('TEST-FE-TKT-009: ticket ajeno (403) o inexistente (404) → "Ticket no disponible" (AC-FE-014)', async () => {
    const { router } = renderConProveedores('/mis-tickets/TKT-91B07D', { como: 'andrea' })
    expect(await screen.findByRole('heading', { name: 'Ticket no disponible' })).toBeInTheDocument()
    expect(screen.queryByText('carlos@pulsepass.test')).not.toBeInTheDocument()
    expect(screen.queryByText('$ 120.000')).not.toBeInTheDocument()

    await router.navigate('/mis-tickets/TKT-NOEXISTE')
    await waitFor(() => {
      expect(peticionesApi()).toContain('GET /api/tickets/TKT-NOEXISTE')
    })
    expect(await screen.findByRole('heading', { name: 'Ticket no disponible' })).toBeInTheDocument()
  })

  it('TEST-FE-TKT-010 (detalle): ticket USED no muestra "Cancelar ticket"', async () => {
    renderConProveedores('/mis-tickets/TKT-5C90E2', { como: 'andrea' })
    expect(await screen.findByText('USED')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar ticket' })).not.toBeInTheDocument()
  })

  it('confirmación de un ticket ajeno → "Ticket no disponible"', async () => {
    renderConProveedores('/compra/confirmacion/TKT-91B07D', { como: 'andrea' })
    expect(await screen.findByRole('heading', { name: 'Ticket no disponible' })).toBeInTheDocument()
  })
})
