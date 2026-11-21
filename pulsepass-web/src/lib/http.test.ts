import { http as mswHttp, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { servidor } from '../test/mocks/servidor.ts'
import { ApiError, peticion, registrarOyenteNoAutorizado } from './http.ts'
import { borrarToken, guardarToken } from './sesionToken.ts'

const Esquema = z.object({ ok: z.boolean() })

describe('lib/http', () => {
  it('TEST-FE-LIB-001: añade Authorization Bearer cuando hay sesión (y nunca en la URL)', async () => {
    let cabecera: string | null = null
    let url = ''
    servidor.use(
      mswHttp.get('/api/prueba', ({ request }) => {
        cabecera = request.headers.get('Authorization')
        url = request.url
        return HttpResponse.json({ ok: true })
      }),
    )
    guardarToken('token-andrea', 900)
    await peticion('/prueba', Esquema, { consulta: { email: 'andrea@pulsepass.test' } })
    expect(cabecera).toBe('Bearer token-andrea')
    expect(url).not.toContain('token-andrea')
  })

  it('TEST-FE-LIB-001 (sin sesión): no envía Authorization', async () => {
    let cabecera: string | null = 'x'
    servidor.use(
      mswHttp.get('/api/prueba', ({ request }) => {
        cabecera = request.headers.get('Authorization')
        return HttpResponse.json({ ok: true })
      }),
    )
    borrarToken()
    await peticion('/prueba', Esquema)
    expect(cabecera).toBeNull()
  })

  it('TEST-FE-LIB-002: ErrorResponse válido → ApiError con status y details', async () => {
    servidor.use(
      mswHttp.post('/api/prueba', () =>
        HttpResponse.json(
          {
            timestamp: '2026-11-20T10:00:00',
            status: 400,
            error: 'Bad Request',
            message: 'Validation failed',
            details: { name: 'Event name is required' },
          },
          { status: 400 },
        ),
      ),
    )
    const promesa = peticion('/prueba', Esquema, { metodo: 'POST', cuerpo: {} })
    await expect(promesa).rejects.toBeInstanceOf(ApiError)
    await expect(promesa).rejects.toMatchObject({
      status: 400,
      message: 'Validation failed',
      details: { name: 'Event name is required' },
    })
  })

  it('TEST-FE-LIB-003: cuerpo de error inválido → ApiError genérico', async () => {
    servidor.use(
      mswHttp.get(
        '/api/prueba',
        () => new HttpResponse('<html>Bad Gateway</html>', { status: 502 }),
      ),
    )
    await expect(peticion('/prueba', Esquema)).rejects.toMatchObject({
      status: 502,
      message: 'Error inesperado del servidor',
      details: {},
    })
  })

  it('TEST-FE-LIB-004: 401 con token → dispara cierre de sesión; 401 sin token (login) no', async () => {
    const oyente = vi.fn()
    registrarOyenteNoAutorizado(oyente)
    servidor.use(
      mswHttp.get('/api/prueba', () =>
        HttpResponse.json(
          {
            timestamp: 't',
            status: 401,
            error: 'Unauthorized',
            message: 'Authentication required',
            details: {},
          },
          { status: 401 },
        ),
      ),
    )
    borrarToken()
    await expect(peticion('/prueba', Esquema)).rejects.toMatchObject({ status: 401 })
    expect(oyente).not.toHaveBeenCalled()

    guardarToken('token-vencido', 900)
    await expect(peticion('/prueba', Esquema)).rejects.toMatchObject({ status: 401 })
    expect(oyente).toHaveBeenCalledTimes(1)
    registrarOyenteNoAutorizado(null)
  })

  it('error de red → ApiError status 0 con mensaje de conexión', async () => {
    servidor.use(mswHttp.get('/api/prueba', () => HttpResponse.error()))
    await expect(peticion('/prueba', Esquema)).rejects.toMatchObject({
      status: 0,
      message: 'No pudimos conectar con el servidor.',
    })
  })

  it('respuesta exitosa que no cumple el esquema zod → ApiError', async () => {
    servidor.use(mswHttp.get('/api/prueba', () => HttpResponse.json({ ok: 'sí' })))
    await expect(peticion('/prueba', Esquema)).rejects.toBeInstanceOf(ApiError)
  })
})
