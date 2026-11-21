import { setupServer } from 'msw/node'
import { handlers } from './handlers.ts'

export const servidor = setupServer(...handlers)

/** Registro de peticiones para verificar que un formulario inválido no llama a la API (QT-FE-006). */
export const peticiones: Request[] = []
servidor.events.on('request:start', ({ request }) => {
  peticiones.push(request.clone())
})
