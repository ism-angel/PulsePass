import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { olvidarEventosCreados } from '../funcionalidades/admin/eventosSesion.ts'
import { borrarToken } from '../lib/sesionToken.ts'
import { reiniciarDb } from './mocks/handlers.ts'
import { peticiones, servidor } from './mocks/servidor.ts'

// matchMedia no existe en jsdom (lo usa el modo oscuro).
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }),
})
window.scrollTo = () => undefined

beforeAll(() => {
  servidor.listen({ onUnhandledFrame: 'error' })
})
beforeEach(() => {
  reiniciarDb()
  peticiones.length = 0
})
afterEach(() => {
  cleanup()
  servidor.resetHandlers()
  borrarToken()
  olvidarEventosCreados()
  window.sessionStorage.clear()
  document.documentElement.classList.remove('dark')
})
afterAll(() => {
  servidor.close()
})
