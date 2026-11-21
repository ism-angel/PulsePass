import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import './index.css'
import { aplicarTema } from './lib/tema.ts'
import { crearQueryClient } from './lib/queryClient.ts'
import { Proveedores } from './Proveedores.tsx'
import { crearRouter } from './router.tsx'

aplicarTema()

const queryClient = crearQueryClient()
const router = crearRouter()
const raiz = document.getElementById('root')

if (raiz) {
  createRoot(raiz).render(
    <StrictMode>
      <Proveedores queryClient={queryClient}>
        <RouterProvider router={router} />
      </Proveedores>
    </StrictMode>,
  )
}
