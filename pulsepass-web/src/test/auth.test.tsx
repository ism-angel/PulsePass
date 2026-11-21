import { screen, waitFor, within } from '@testing-library/react'
import { http as mswHttp } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { reloj } from '../lib/reloj.ts'
import { CLAVE_VALIDA } from './mocks/datos.ts'
import { error } from './mocks/handlers.ts'
import { servidor } from './mocks/servidor.ts'
import { peticionesApi, renderConProveedores } from './utils.tsx'

const CLAVE_SESION = 'pulsepass.sesion'

describe('Autenticación (§21.2)', () => {
  it('TEST-FE-AUTH-001: login válido → sesión autenticada y redirección a "desde"', async () => {
    const { user, router } = renderConProveedores('/login', { estado: { desde: '/mis-tickets' } })
    await user.type(await screen.findByLabelText('Usuario o correo'), 'andrea')
    await user.type(screen.getByLabelText('Contraseña'), CLAVE_VALIDA)
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByRole('heading', { name: 'Mis tickets' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/mis-tickets')
    // AC-FE-009: token solo en sessionStorage/memoria y nombre visible en la navbar
    expect(window.sessionStorage.getItem(CLAVE_SESION)).toContain('token-andrea')
    expect(await within(screen.getByRole('banner')).findByText('Andrea')).toBeInTheDocument()
    expect(peticionesApi()).toEqual(
      expect.arrayContaining(['POST /api/auth/login', 'GET /api/auth/me']),
    )
  })

  it('TEST-FE-AUTH-002: login 401 → "Credenciales inválidas" sin distinguir usuario/contraseña', async () => {
    const { user } = renderConProveedores('/login')
    await user.type(await screen.findByLabelText('Usuario o correo'), 'nadie')
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta')
    await user.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas.')
    expect(window.sessionStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('TEST-FE-AUTH-003: login sin campos → errores y 0 peticiones', async () => {
    const { user } = renderConProveedores('/login')
    await user.click(await screen.findByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('Ingresa tu usuario o correo')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuario o correo')).toHaveAttribute('aria-invalid', 'true')
    expect(peticionesApi()).toEqual([])
  })

  it('TEST-FE-AUTH-004: registro con contraseña corta (11) → error y 0 peticiones', async () => {
    const { user } = renderConProveedores('/registro')
    await user.type(await screen.findByLabelText('Nombre de usuario'), 'sofia')
    await user.type(screen.getByLabelText('Correo electrónico'), 'sofia@pulsepass.test')
    await user.type(screen.getByLabelText('Nombres'), 'Sofía')
    await user.type(screen.getByLabelText('Apellidos'), 'Mora')
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '2000-05-10')
    await user.type(screen.getByLabelText('Contraseña (mín. 12 caracteres)'), 'Corta-12345')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(
      await screen.findByText('La contraseña debe tener al menos 12 caracteres'),
    ).toBeInTheDocument()
    expect(peticionesApi()).not.toContain('POST /api/users')
  })

  it('registro: correo con formato inválido y campos obligatorios vacíos → errores (QT-FE-003)', async () => {
    const { user } = renderConProveedores('/registro')
    await user.type(await screen.findByLabelText('Correo electrónico'), 'no-es-correo')
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByText('Ingresa un correo válido')).toBeInTheDocument()
    expect(screen.getByText('Ingresa un nombre de usuario')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu fecha de nacimiento')).toBeInTheDocument()
    expect(peticionesApi()).toEqual([])
  })

  async function completarRegistro(
    user: ReturnType<typeof renderConProveedores>['user'],
    email: string,
  ) {
    await user.type(await screen.findByLabelText('Nombre de usuario'), 'sofia')
    await user.type(screen.getByLabelText('Correo electrónico'), email)
    await user.type(screen.getByLabelText('Nombres'), 'Sofía')
    await user.type(screen.getByLabelText('Apellidos'), 'Mora')
    await user.type(screen.getByLabelText('Fecha de nacimiento'), '2000-05-10')
    await user.type(
      screen.getByLabelText('Contraseña (mín. 12 caracteres)'),
      'Una-Clave-Larga-2026',
    )
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }))
  }

  it('TEST-FE-AUTH-005: registro 201 → redirección a /login con aviso', async () => {
    const { user, router } = renderConProveedores('/registro')
    await completarRegistro(user, 'sofia@pulsepass.test')
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.getByText('Cuenta creada, inicia sesión.')).toBeInTheDocument()
  })

  it('TEST-FE-AUTH-006: registro 409 → mensaje genérico sin detalles internos', async () => {
    const { user } = renderConProveedores('/registro')
    await completarRegistro(user, 'andrea@pulsepass.test')
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('El usuario o correo ya está registrado.')
    expect(alerta).not.toHaveTextContent('Email already registered')
  })

  it('registro 400 con details → errores en los campos (§11.2)', async () => {
    servidor.use(
      mswHttp.post('/api/users', () =>
        error(400, 'Validation failed', { email: 'Email must be a valid address' }),
      ),
    )
    const { user } = renderConProveedores('/registro')
    await completarRegistro(user, 'sofia@pulsepass.test')
    expect(await screen.findByText('Email must be a valid address')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('Guardas de ruta (§21.2, QT-FE-004)', () => {
  it('TEST-FE-AUTH-007: RutaProtegida — anónimo → /login con state.desde', async () => {
    const { router } = renderConProveedores('/cuenta')
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state).toMatchObject({ desde: '/cuenta' })
  })

  it('TEST-FE-AUTH-008: RutaPorRol — USER en /admin → /403', async () => {
    const { router } = renderConProveedores('/admin/eventos', { como: 'andrea' })
    expect(
      await screen.findByText('No tienes permisos para acceder a esta sección.'),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/403')
  })

  it('RutaPorRol — STAFF en /admin → /403 y en /staff/validacion → renderiza', async () => {
    const { router } = renderConProveedores('/admin/eventos/nuevo', { como: 'laura' })
    expect(
      await screen.findByText('No tienes permisos para acceder a esta sección.'),
    ).toBeInTheDocument()
    await router.navigate('/staff/validacion')
    expect(
      await screen.findByRole('heading', { name: 'Validación de ingreso' }),
    ).toBeInTheDocument()
  })

  it('RutaPorRol — ADMIN en /mis-tickets (solo USER) → /403', async () => {
    renderConProveedores('/mis-tickets', { como: 'admin' })
    expect(
      await screen.findByText('No tienes permisos para acceder a esta sección.'),
    ).toBeInTheDocument()
  })

  it('TEST-FE-AUTH-009: RutaPorRol — ADMIN en /admin → renderiza', async () => {
    renderConProveedores('/admin/eventos', { como: 'admin' })
    expect(
      await screen.findByRole('heading', { name: 'Administración de eventos' }),
    ).toBeInTheDocument()
  })

  it('SoloAnonimo — con sesión, /login redirige a /', async () => {
    const { router } = renderConProveedores('/login', { como: 'andrea' })
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
  })
})

describe('Sesión (§12)', () => {
  it('TEST-FE-AUTH-010: cerrar sesión limpia token y caché', async () => {
    const { user, router, queryClient } = renderConProveedores('/cuenta', { como: 'andrea' })
    const limpiar = vi.spyOn(queryClient, 'clear')
    expect(await screen.findByText('Andrea Ruiz')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(limpiar).toHaveBeenCalledTimes(1)
    expect(window.sessionStorage.getItem(CLAVE_SESION)).toBeNull()
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/')
    })
    await router.navigate('/mis-tickets')
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
  })

  it('TEST-FE-AUTH-011: token expirado al restaurar sesión → anónimo (sin llamar a /api/auth/me)', async () => {
    vi.spyOn(reloj, 'ahora').mockReturnValue(2_000_000)
    window.sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: 'token-andrea', expiraEn: 1_000_000 }),
    )
    renderConProveedores('/')
    expect(await screen.findAllByRole('link', { name: 'Ingresar' })).not.toHaveLength(0)
    expect(window.sessionStorage.getItem(CLAVE_SESION)).toBeNull()
    expect(peticionesApi()).not.toContain('GET /api/auth/me')
  })

  it('token vigente al recargar → la sesión se restaura (FR-FE-AUTH-004)', async () => {
    vi.spyOn(reloj, 'ahora').mockReturnValue(1_000)
    window.sessionStorage.setItem(
      CLAVE_SESION,
      JSON.stringify({ token: 'token-andrea', expiraEn: 901_000 }),
    )
    renderConProveedores('/cuenta')
    expect(await screen.findByText('Andrea Ruiz')).toBeInTheDocument()
  })

  it('valor manipulado en sessionStorage → se descarta (validación zod)', async () => {
    window.sessionStorage.setItem(CLAVE_SESION, '{"token": 123}')
    renderConProveedores('/cuenta')
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument()
    expect(window.sessionStorage.getItem(CLAVE_SESION)).toBeNull()
  })

  it('AC-FE-019: 401 en una ruta protegida → cierra sesión, limpia caché y redirige a /login con "Tu sesión expiró"', async () => {
    servidor.use(mswHttp.get('/api/tickets/by-user', () => error(401, 'Authentication required')))
    const { router } = renderConProveedores('/mis-tickets', { como: 'andrea' })
    expect(await screen.findByText('Tu sesión expiró. Inicia sesión de nuevo.')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.state).toMatchObject({ desde: '/mis-tickets', motivo: 'expirada' })
    expect(window.sessionStorage.getItem(CLAVE_SESION)).toBeNull()
  })
})
