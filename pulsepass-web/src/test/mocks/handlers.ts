import { http, HttpResponse } from 'msw'
import { CLAVE_VALIDA, PRECIOS, crearDatos, type BaseDatos, type UsuarioDemo } from './datos.ts'
import type { EventSummaryResponse } from '../../funcionalidades/eventos/tipos.ts'
import type { TicketType } from '../../funcionalidades/tickets/tipos.ts'

/**
 * Handlers MSW de los 23 endpoints (20 de la Fase 3 + 3 de la Fase 4), con una base en memoria
 * que se reinicia antes de cada prueba. Reproducen la política del backend real:
 * recurso ajeno → 403, inexistente → 404, borrador para anónimo → 404, reglas → 409.
 */
export let db: BaseDatos = crearDatos()
export function reiniciarDb() {
  db = crearDatos()
}

const API = '/api'

export function error(status: number, message: string, details: Record<string, string> = {}) {
  const textos: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error',
  }
  return HttpResponse.json(
    {
      timestamp: '2026-11-20T10:00:00',
      status,
      error: textos[status] ?? 'Error',
      message,
      details,
    },
    { status },
  )
}

/** Token simulado: "token-<username>". */
export function tokenDe(username: string) {
  return `token-${username}`
}

function principal(request: Request): UsuarioDemo | null {
  const cabecera = request.headers.get('Authorization') ?? ''
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : ''
  return db.usuarios.find((u) => tokenDe(u.username) === token) ?? null
}

const esStaff = (u: UsuarioDemo | null) =>
  u !== null && (u.roles.includes('STAFF') || u.roles.includes('ADMIN'))
const esAdmin = (u: UsuarioDemo | null) => u !== null && u.roles.includes('ADMIN')
const sinRoles = (u: UsuarioDemo) => {
  const copia: Partial<UsuarioDemo> = { ...u }
  delete copia.roles
  return copia
}
const resumen = (e: BaseDatos['eventos'][number]): EventSummaryResponse => ({
  id: e.id,
  eventCode: e.eventCode,
  name: e.name,
  category: e.category,
  status: e.status,
  eventDate: e.eventDate,
  venueName: e.venueName,
})

export const handlers = [
  // ---------- Fase 4: autenticación ----------
  http.post(`${API}/auth/login`, async ({ request }) => {
    const cuerpo = (await request.json()) as { identifier?: string; password?: string }
    const u = db.usuarios.find(
      (x) => x.username === cuerpo.identifier || x.email === cuerpo.identifier,
    )
    if (!u || cuerpo.password !== CLAVE_VALIDA || !u.active)
      return error(401, 'Invalid credentials')
    return HttpResponse.json({
      accessToken: tokenDe(u.username),
      tokenType: 'Bearer',
      expiresIn: 900,
    })
  }),
  http.get(`${API}/auth/me`, ({ request }) => {
    const u = principal(request)
    if (!u) return error(401, 'Authentication required')
    return HttpResponse.json({ id: u.id, username: u.username, email: u.email, roles: u.roles })
  }),

  // ---------- Venues ----------
  http.get(`${API}/venues/active`, () => HttpResponse.json(db.sedes.filter((s) => s.active))),
  http.get(`${API}/venues/:code`, ({ params }) => {
    const s = db.sedes.find((x) => x.code === params.code)
    return s ? HttpResponse.json(s) : error(404, `Venue not found: ${String(params.code)}`)
  }),

  // ---------- Artistas ----------
  http.get(`${API}/artists/active`, () => HttpResponse.json(db.artistas.filter((a) => a.active))),
  http.get(`${API}/artists/by-stage-name`, ({ request }) => {
    const nombre = new URL(request.url).searchParams.get('stageName')
    const a = db.artistas.find((x) => x.stageName === nombre)
    return a ? HttpResponse.json(a) : error(404, `Artist not found: ${nombre ?? ''}`)
  }),
  http.get(`${API}/artists/:id`, ({ params }) => {
    const a = db.artistas.find((x) => String(x.id) === params.id)
    return a ? HttpResponse.json(a) : error(404, `Artist not found: ${String(params.id)}`)
  }),

  // ---------- Eventos ----------
  http.get(`${API}/events/published`, () =>
    HttpResponse.json(db.eventos.filter((e) => e.status === 'PUBLISHED').map(resumen)),
  ),
  http.get(`${API}/events/by-artist`, ({ request }) => {
    const nombre = new URL(request.url).searchParams.get('stageName')
    const privilegiado = esStaff(principal(request))
    return HttpResponse.json(
      db.eventos
        .filter((e) => e.artists.some((a) => a.stageName === nombre))
        .filter((e) => privilegiado || e.status === 'PUBLISHED')
        .map(resumen),
    )
  }),
  http.get(`${API}/events/:eventCode/tickets/paid`, ({ request, params }) => {
    const u = principal(request)
    if (!u) return error(401, 'Authentication required')
    if (!esStaff(u)) return error(403, 'No tiene permisos para realizar esta operación')
    if (!db.eventos.some((e) => e.eventCode === params.eventCode))
      return error(404, `Event not found: ${String(params.eventCode)}`)
    return HttpResponse.json(
      db.tickets.filter((t) => t.eventCode === params.eventCode && t.status === 'PAID'),
    )
  }),
  http.get(`${API}/events/:eventCode`, ({ request, params }) => {
    const e = db.eventos.find((x) => x.eventCode === params.eventCode)
    if (!e || (e.status !== 'PUBLISHED' && !esStaff(principal(request)))) {
      return error(404, `Event not found: ${String(params.eventCode)}`)
    }
    return HttpResponse.json(e)
  }),
  http.post(`${API}/events`, async ({ request }) => {
    const u = principal(request)
    if (!u) return error(401, 'Authentication required')
    if (!esAdmin(u)) return error(403, 'No tiene permisos para realizar esta operación')
    const c = (await request.json()) as Record<string, unknown>
    const codigo = String(c.eventCode)
    if (db.eventos.some((e) => e.eventCode === codigo))
      return error(409, `Event already exists: ${codigo}`)
    const sede = db.sedes.find((s) => s.code === c.venueCode)
    if (!sede) return error(404, `Venue not found: ${String(c.venueCode)}`)
    const nuevo = {
      id: db.eventos.length + 1,
      eventCode: codigo,
      name: String(c.name),
      description: (c.description as string | null) ?? null,
      category: c.category as BaseDatos['eventos'][number]['category'],
      status: 'DRAFT' as const,
      eventDate: String(c.eventDate),
      minimumAge: Number(c.minimumAge),
      venueCode: sede.code,
      venueName: sede.name,
      artists: [],
    }
    db.eventos.push(nuevo)
    return HttpResponse.json(nuevo, { status: 201 })
  }),
  http.patch(`${API}/events/:eventCode/publish`, ({ request, params }) => {
    if (!esAdmin(principal(request)))
      return error(403, 'No tiene permisos para realizar esta operación')
    const e = db.eventos.find((x) => x.eventCode === params.eventCode)
    if (!e) return error(404, `Event not found: ${String(params.eventCode)}`)
    if (e.status !== 'DRAFT')
      return error(409, `Only DRAFT events can be published. Current status: ${e.status}`)
    e.status = 'PUBLISHED'
    return HttpResponse.json(e)
  }),
  http.post(`${API}/events/:eventCode/artists/:artistId`, ({ request, params }) => {
    if (!esAdmin(principal(request)))
      return error(403, 'No tiene permisos para realizar esta operación')
    const e = db.eventos.find((x) => x.eventCode === params.eventCode)
    const a = db.artistas.find((x) => String(x.id) === params.artistId)
    if (!e) return error(404, `Event not found: ${String(params.eventCode)}`)
    if (!a) return error(404, `Artist not found: ${String(params.artistId)}`)
    if (e.artists.some((x) => x.id === a.id))
      return error(409, `Artist ${a.stageName} is already associated with event ${e.eventCode}`)
    e.artists.push(a)
    return HttpResponse.json(e)
  }),

  // ---------- Usuarios ----------
  http.post(`${API}/users`, async ({ request }) => {
    const c = (await request.json()) as Record<string, string>
    if (db.usuarios.some((u) => u.email === c.email || u.username === c.username)) {
      return error(409, 'Email already exists.')
    }
    const nuevo: UsuarioDemo = {
      id: db.usuarios.length + 1,
      username: c.username ?? '',
      email: c.email ?? '',
      active: true,
      firstName: c.firstName ?? '',
      lastName: c.lastName ?? '',
      phone: null,
      city: null,
      birthDate: c.birthDate ?? null,
      roles: ['USER'],
    }
    db.usuarios.push(nuevo)
    return HttpResponse.json(sinRoles(nuevo), { status: 201 })
  }),
  http.get(`${API}/users/by-email`, ({ request }) => {
    const u = principal(request)
    if (!u) return error(401, 'Authentication required')
    const email = new URL(request.url).searchParams.get('email')
    const objetivo = db.usuarios.find((x) => x.email === email)
    if (!esAdmin(u) && objetivo?.id !== u.id)
      return error(403, 'No tiene permisos para realizar esta operación')
    return objetivo ? HttpResponse.json(sinRoles(objetivo)) : error(404, 'User not found')
  }),
  http.get(`${API}/users/by-username`, ({ request }) => {
    const u = principal(request)
    if (!u) return error(401, 'Authentication required')
    const nombre = new URL(request.url).searchParams.get('username')
    const objetivo = db.usuarios.find((x) => x.username === nombre)
    if (!esAdmin(u) && objetivo?.id !== u.id)
      return error(403, 'No tiene permisos para realizar esta operación')
    return objetivo ? HttpResponse.json(sinRoles(objetivo)) : error(404, 'User not found')
  }),

  // ---------- Tickets ----------
  http.post(`${API}/tickets`, async ({ request }) => {
    const u = principal(request)
    if (!u) return error(401, 'Authentication required')
    if (!u.roles.includes('USER'))
      return error(403, 'No tiene permisos para realizar esta operación')
    const c = (await request.json()) as { userEmail: string; eventCode: string; type: TicketType }
    if (c.userEmail !== u.email) return error(403, 'No tiene permisos para realizar esta operación')
    const e = db.eventos.find((x) => x.eventCode === c.eventCode)
    if (!e) return error(404, `Event not found: ${c.eventCode}`)
    if (e.status !== 'PUBLISHED')
      return error(409, `Event is not available for purchase. Current status: ${e.status}`)
    const ticket = {
      id: db.tickets.length + 1,
      ticketCode: `TKT-NEW${String(db.tickets.length + 1).padStart(3, '0')}`,
      type: c.type,
      price: PRECIOS[c.type] ?? 0,
      status: 'PAID' as const,
      purchaseDate: '2026-11-20T10:00:00',
      userEmail: u.email,
      eventCode: e.eventCode,
      eventName: e.name,
    }
    db.tickets.push(ticket)
    return HttpResponse.json(ticket, { status: 201 })
  }),
  http.get(`${API}/tickets/by-user`, ({ request }) => {
    const u = principal(request)
    if (!u) return error(401, 'Authentication required')
    const email = new URL(request.url).searchParams.get('email')
    if (!esAdmin(u) && email !== u.email) return error(403, 'Access denied')
    return HttpResponse.json(db.tickets.filter((t) => t.userEmail === email))
  }),
  http.get(`${API}/tickets/:ticketCode`, ({ request, params }) => {
    const u = principal(request)
    if (!u) return error(401, 'Authentication required')
    const t = db.tickets.find((x) => x.ticketCode === params.ticketCode)
    if (!t) return error(404, `Ticket not found: ${String(params.ticketCode)}`)
    if (t.userEmail !== u.email && !esStaff(u)) return error(403, 'Access denied')
    return HttpResponse.json(t)
  }),
  http.patch(`${API}/tickets/:ticketCode/cancel`, ({ request, params }) => {
    const u = principal(request)
    if (!u) return error(401, 'Authentication required')
    const t = db.tickets.find((x) => x.ticketCode === params.ticketCode)
    if (!t) return error(404, `Ticket not found: ${String(params.ticketCode)}`)
    if (t.userEmail !== u.email && !esAdmin(u)) return error(403, 'Access denied')
    if (t.status !== 'PAID') return error(409, 'Only PAID tickets can be cancelled.')
    t.status = 'CANCELLED'
    return HttpResponse.json(t)
  }),
  http.patch(`${API}/tickets/:ticketCode/use`, ({ request, params }) => {
    const u = principal(request)
    if (!u) return error(401, 'Authentication required')
    if (!esStaff(u)) return error(403, 'No tiene permisos para realizar esta operación')
    const t = db.tickets.find((x) => x.ticketCode === params.ticketCode)
    if (!t) return error(404, `Ticket not found: ${String(params.ticketCode)}`)
    if (t.status !== 'PAID') return error(409, 'Only PAID tickets can be marked as used.')
    t.status = 'USED'
    return HttpResponse.json(t)
  }),
]
