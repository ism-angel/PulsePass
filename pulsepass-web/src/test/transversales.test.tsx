import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Layout from '../layouts/Layout.tsx'
import ErrorPagina from '../pages/ErrorPagina.tsx'
import { handlers } from './mocks/handlers.ts'
import { peticiones } from './mocks/servidor.ts'
import { renderConProveedores } from './utils.tsx'

describe('Transversales (§21.6)', () => {
  it('TEST-FE-GEN-001: ruta inexistente → 404 (AC-FE-020)', async () => {
    renderConProveedores('/esta/ruta/no/existe')
    expect(await screen.findByText('404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })

  it('TEST-FE-GEN-002: errorElement muestra un mensaje seguro (sin stack ni detalles internos)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function Explota(): never {
      throw new Error('NullPointerException at com.pulsepass.secreto.Clase(Clase.java:42)')
    }
    renderConProveedores('/', {
      rutasPersonalizadas: [
        {
          path: '/',
          Component: Layout,
          ErrorBoundary: ErrorPagina,
          children: [{ index: true, Component: Explota }],
        },
      ],
    })
    expect(
      await screen.findByRole('heading', { name: '¡Ups! Algo salió mal.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ocurrió un error inesperado. Inténtalo más tarde.'),
    ).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/NullPointer|com\.pulsepass|Clase\.java/)
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('TEST-FE-GEN-003: navbar muestra enlaces según rol (tabla 8.4)', async () => {
    const nombres = async () => {
      const nav = await screen.findByRole('navigation', { name: 'Principal' })
      return within(nav)
        .getAllByRole('link')
        .map((a) => a.textContent)
    }

    const anonimo = renderConProveedores('/')
    expect(await nombres()).toEqual(['Eventos', 'Artistas', 'Sedes'])
    expect(screen.getAllByRole('link', { name: 'Ingresar' }).length).toBeGreaterThan(0)
    anonimo.unmount()

    const usuario = renderConProveedores('/', { como: 'andrea' })
    await waitFor(async () => {
      expect(await nombres()).toEqual(['Eventos', 'Artistas', 'Sedes', 'Mis tickets'])
    })
    usuario.unmount()

    const staff = renderConProveedores('/', { como: 'laura' })
    await waitFor(async () => {
      expect(await nombres()).toEqual([
        'Eventos',
        'Artistas',
        'Sedes',
        'Validar ingreso',
        'Tickets pagados',
      ])
    })
    staff.unmount()

    renderConProveedores('/', { como: 'admin' })
    await waitFor(async () => {
      expect(await nombres()).toEqual([
        'Eventos',
        'Artistas',
        'Sedes',
        'Validar ingreso',
        'Tickets pagados',
        'Administrar eventos',
      ])
    })
    expect(screen.queryByRole('link', { name: 'Ingresar' })).not.toBeInTheDocument()
  })

  it('NavLink activo marca la página actual (aria-current)', async () => {
    renderConProveedores('/eventos')
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    expect(within(nav).getByRole('link', { name: 'Eventos' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(nav).getByRole('link', { name: 'Sedes' })).not.toHaveAttribute('aria-current')
  })

  it('TEST-FE-GEN-004: menú móvil abre y cierra con teclado', async () => {
    const { user } = renderConProveedores('/')
    const boton = await screen.findByRole('button', { name: 'Abrir menú' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    boton.focus()
    await user.keyboard('{Enter}')
    const abierto = screen.getByRole('button', { name: 'Cerrar menú' })
    expect(abierto).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Principal móvil' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('navigation', { name: 'Principal móvil' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveFocus()

    await user.keyboard(' ')
    expect(screen.getByRole('navigation', { name: 'Principal móvil' })).toBeInTheDocument()
    await user.keyboard(' ')
    expect(screen.queryByRole('navigation', { name: 'Principal móvil' })).not.toBeInTheDocument()
  })

  it('accesibilidad del layout: enlace "Saltar al contenido", header, nav y main#contenido', async () => {
    renderConProveedores('/')
    expect(await screen.findByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute(
      'href',
      '#contenido',
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'contenido')
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      '© 2026 PulsePass · Caso de estudio académico',
    )
  })

  it('FR-FE-GEN-004: modo oscuro alternable (clase dark en <html>, sin localStorage)', async () => {
    const { user } = renderConProveedores('/')
    const [boton] = await screen.findAllByRole('button', { name: 'Activar modo oscuro' })
    if (!boton) throw new Error('sin botón de tema')
    await user.click(boton)
    expect(document.documentElement).toHaveClass('dark')
    expect(window.sessionStorage.getItem('pulsepass.tema')).toBe('oscuro')
    const [claro] = screen.getAllByRole('button', { name: 'Activar modo claro' })
    if (!claro) throw new Error('sin botón de tema')
    await user.click(claro)
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('QT-FE-007: en un flujo autenticado el token nunca viaja en la URL', async () => {
    renderConProveedores('/mis-tickets', { como: 'andrea' })
    await screen.findByRole('list', { name: 'Mis tickets' })
    const api = peticiones.filter((p) => p.url.includes('/api/'))
    expect(api.length).toBeGreaterThan(0)
    for (const p of api) {
      expect(p.url).not.toContain('token-')
      if (p.headers.has('Authorization'))
        expect(p.headers.get('Authorization')).toBe('Bearer token-andrea')
    }
  })

  it('AC-FE-022: los handlers MSW cubren los 23 endpoints (20 Fase 3 + 3 Fase 4)', () => {
    // POST /api/users cuenta como #12 (F3) y A3 (F4): 22 rutas HTTP distintas = 23 operaciones de la tabla 10.3.
    expect(handlers).toHaveLength(22)
  })
})
