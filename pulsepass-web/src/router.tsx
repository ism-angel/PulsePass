import { createBrowserRouter, type RouteObject } from 'react-router'
import Layout from './layouts/Layout.tsx'
import RutaPorRol from './layouts/RutaPorRol.tsx'
import RutaProtegida from './layouts/RutaProtegida.tsx'
import SoloAnonimo from './layouts/SoloAnonimo.tsx'
import { PATRONES } from './lib/rutas.ts'
import Inicio from './pages/Inicio.tsx'

/**
 * Árbol de rutas (PRD §8.2). Layout e Inicio se cargan de forma estática; las demás páginas
 * con `lazy` (FE-012, NFR-FE-003): las de admin/staff no se descargan en la primera carga.
 */
export const rutas: RouteObject[] = [
  {
    path: '/',
    Component: Layout,
    lazy: async () => ({ ErrorBoundary: (await import('./pages/ErrorPagina.tsx')).default }),
    children: [
      { index: true, Component: Inicio },
      {
        path: PATRONES.eventos,
        lazy: async () => ({ Component: (await import('./pages/CatalogoEventos.tsx')).default }),
      },
      {
        path: PATRONES.evento,
        lazy: async () => ({ Component: (await import('./pages/DetalleEvento.tsx')).default }),
      },
      {
        path: PATRONES.artistas,
        lazy: async () => ({ Component: (await import('./pages/ListaArtistas.tsx')).default }),
      },
      {
        path: PATRONES.artista,
        lazy: async () => ({ Component: (await import('./pages/DetalleArtista.tsx')).default }),
      },
      {
        path: PATRONES.sedes,
        lazy: async () => ({ Component: (await import('./pages/ListaSedes.tsx')).default }),
      },
      {
        path: PATRONES.sede,
        lazy: async () => ({ Component: (await import('./pages/DetalleSede.tsx')).default }),
      },
      {
        Component: SoloAnonimo,
        children: [
          {
            path: PATRONES.login,
            lazy: async () => ({ Component: (await import('./pages/Login.tsx')).default }),
          },
          {
            path: PATRONES.registro,
            lazy: async () => ({ Component: (await import('./pages/Registro.tsx')).default }),
          },
        ],
      },
      {
        Component: RutaProtegida,
        children: [
          {
            path: PATRONES.cuenta,
            lazy: async () => ({ Component: (await import('./pages/Cuenta.tsx')).default }),
          },
          {
            element: <RutaPorRol roles={['USER']} />,
            children: [
              {
                path: PATRONES.misTickets,
                lazy: async () => ({ Component: (await import('./pages/MisTickets.tsx')).default }),
              },
              {
                path: PATRONES.ticket,
                lazy: async () => ({ Component: (await import('./pages/DetalleTicket.tsx')).default }),
              },
              {
                path: PATRONES.confirmacion,
                lazy: async () => ({
                  Component: (await import('./pages/ConfirmacionCompra.tsx')).default,
                }),
              },
            ],
          },
          {
            element: <RutaPorRol roles={['STAFF', 'ADMIN']} />,
            children: [
              {
                path: PATRONES.staffValidacion,
                lazy: async () => ({
                  Component: (await import('./pages/ValidacionIngreso.tsx')).default,
                }),
              },
              {
                path: PATRONES.staffTicketsPagados,
                lazy: async () => ({
                  Component: (await import('./pages/TicketsPagadosEvento.tsx')).default,
                }),
              },
            ],
          },
          {
            element: <RutaPorRol roles={['ADMIN']} />,
            children: [
              {
                path: PATRONES.adminEventos,
                lazy: async () => ({ Component: (await import('./pages/AdminEventos.tsx')).default }),
              },
              {
                path: PATRONES.adminNuevoEvento,
                lazy: async () => ({
                  Component: (await import('./pages/AdminCrearEvento.tsx')).default,
                }),
              },
              {
                path: PATRONES.adminEvento,
                lazy: async () => ({
                  Component: (await import('./pages/AdminGestionEvento.tsx')).default,
                }),
              },
            ],
          },
        ],
      },
      {
        path: PATRONES.sinPermisos,
        lazy: async () => ({ Component: (await import('./pages/SinPermisos.tsx')).default }),
      },
      {
        path: PATRONES.noEncontrada,
        lazy: async () => ({ Component: (await import('./pages/NoEncontrada.tsx')).default }),
      },
    ],
  },
]

export function crearRouter() {
  return createBrowserRouter(rutas)
}
