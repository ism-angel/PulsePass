import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'
import { crearQueryClient } from '../lib/queryClient.ts'
import { guardarToken } from '../lib/sesionToken.ts'
import { Proveedores } from '../Proveedores.tsx'
import { rutas } from '../router.tsx'
import { tokenDe } from './mocks/handlers.ts'
import { peticiones } from './mocks/servidor.ts'

export type UsuarioPrueba = 'andrea' | 'carlos' | 'laura' | 'admin'

interface OpcionesRender {
  /** Usuario con sesión iniciada (token en sessionStorage, como tras un login real). */
  como?: UsuarioPrueba
  estado?: unknown
  rutasPersonalizadas?: RouteObject[]
}

/** Renderiza la aplicación real (Router + Query + Auth) en una ruta dada (PRD §17: renderConProveedores). */
export function renderConProveedores(
  ruta: string,
  { como, estado, rutasPersonalizadas }: OpcionesRender = {},
) {
  if (como) guardarToken(tokenDe(como), 900)
  const queryClient = crearQueryClient()
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false, gcTime: Infinity },
    mutations: { retry: false },
  })
  const router = createMemoryRouter(rutasPersonalizadas ?? rutas, {
    initialEntries: [
      {
        pathname: ruta.split('?')[0] ?? ruta,
        search: ruta.includes('?') ? `?${ruta.split('?')[1] ?? ''}` : '',
        state: estado,
      },
    ],
  })
  const user = userEvent.setup()
  const resultado = render(
    <Proveedores queryClient={queryClient}>
      <RouterProvider router={router} />
    </Proveedores>,
  )
  return { ...resultado, router, queryClient, user }
}

/** Peticiones a la API registradas por MSW (método + ruta). */
export function peticionesApi() {
  return peticiones
    .filter((p) => new URL(p.url).pathname.startsWith('/api'))
    .map((p) => `${p.method} ${new URL(p.url).pathname}`)
}
